/**
 * 数据录入弹窗 - 用于录入指标的月度历史数据
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Space,
  Input,
  Select,
  InputNumber,
  message,
  Row,
  Col,
  Card,
  Typography,
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { Metric, Category, Dimension, CATEGORY_CONFIG, DIMENSION_CONFIG } from '../types';
import { metricApi } from '../services/api';

const { Option } = Select;
const { Text } = Typography;

interface DataEntryModalProps {
  visible: boolean;
  onCancel: () => void;
}

interface EntryRow {
  metric_id: number;
  metric_name: string;
  metric_code: string;
  category: Category;
  dimension: Dimension;
  year: number;
  month: number;
  value: number | null;
}

const DataEntryModal: React.FC<DataEntryModalProps> = ({ visible, onCancel }) => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<Category | undefined>();
  const [dimensionFilter, setDimensionFilter] = useState<Dimension | undefined>();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  // 已配置聚合的 overview 指标 ID 集合
  const [aggregatedMetricIds, setAggregatedMetricIds] = useState<Set<number>>(new Set());
  // 已有数据（当前录入月份的已有值）
  const [existingValues, setExistingValues] = useState<Record<number, number>>({});

  // 加载指标列表
  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await metricApi.getList({ skip: 0, limit: 1000 });
      let items = response.items;
      if (categoryFilter) {
        items = items.filter(m => m.category === categoryFilter);
      }
      if (dimensionFilter) {
        items = items.filter(m => m.dimension === dimensionFilter);
      }
      setMetrics(items);
    } catch (error: any) {
      message.error(error.message || '加载指标失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载所有聚合配置，确定哪些 overview 指标是聚合指标
  const loadAggregationConfigs = async () => {
    try {
      const configs = await metricApi.getAggregationConfigs();
      const aggregatedIds = new Set<number>();
      configs.forEach(cfg => {
        aggregatedIds.add(cfg.target_metric_id);
      });
      setAggregatedMetricIds(aggregatedIds);
    } catch (error: any) {
      console.error('加载聚合配置失败', error);
    }
  };

  // 加载已录入数据（当前年月的已有值）
  const loadExistingHistory = async (currentMetrics: Metric[]) => {
    if (currentMetrics.length === 0) return;
    try {
      const categories: Category[] = ['overview', 'product_a', 'product_b', 'product_c', 'product_d'];
      const values: Record<number, number> = {};
      // 构建 code -> id 映射用于快速查找
      const codeToId: Record<string, number> = {};
      currentMetrics.forEach(m => { codeToId[m.code] = m.id; });

      await Promise.all(
        categories.map(async (cat) => {
          const history = await metricApi.getMonthlyHistory(cat, year);
          Object.entries(history).forEach(([code, monthMap]) => {
            const metricId = codeToId[code];
            if (metricId && monthMap[month] !== undefined) {
              const data = monthMap[month];
              values[metricId] = typeof data === 'object' ? data.value : data;
            }
          });
        })
      );
      setExistingValues(values);
    } catch (error: any) {
      console.error('加载已有数据失败', error);
    }
  };

  useEffect(() => {
    if (visible) {
      loadMetrics();
      loadAggregationConfigs();
      setYear(new Date().getFullYear());
      setMonth(new Date().getMonth() + 1);
    }
  }, [visible, categoryFilter, dimensionFilter]);

  // year 或 month 或 metrics 变化时，重新加载已有数据
  useEffect(() => {
    if (visible && metrics.length > 0) {
      loadExistingHistory(metrics);
    }
  }, [year, month, visible, metrics]);

  // 表格列定义
  const columns = [
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (cat: Category) => (
        <span style={{ color: CATEGORY_CONFIG[cat]?.color }}>
          {CATEGORY_CONFIG[cat]?.label}
        </span>
      ),
    },
    {
      title: '维度',
      dataIndex: 'dimension',
      key: 'dimension',
      width: 80,
      render: (dim: Dimension) => (
        <span style={{ color: DIMENSION_CONFIG[dim]?.color }}>
          {DIMENSION_CONFIG[dim]?.label}
        </span>
      ),
    },
    {
      title: '已有值',
      dataIndex: 'existing',
      key: 'existing',
      width: 100,
      render: (_: any, record: Metric) => {
        const val = existingValues[record.id];
        if (val === undefined) return <Text type="secondary">-</Text>;
        return <Text>{val}</Text>;
      },
    },
    {
      title: '录入值',
      key: 'value',
      width: 150,
      render: (_: any, record: Metric) => {
        const isAggregated = record.category === 'overview' && aggregatedMetricIds.has(record.id);
        const existingVal = existingValues[record.id];
        return (
          <InputNumber
            style={{ width: '100%', backgroundColor: isAggregated ? '#f5f5f5' : undefined }}
            placeholder={existingVal !== undefined ? String(existingVal) : '请输入值'}
            value={modifiedValues[record.id] !== undefined ? modifiedValues[record.id] : existingVal}
            disabled={isAggregated}
            min={0}
            precision={2}
            onChange={(val) => handleValueChange(record.id, val)}
          />
        );
      },
    },
    {
      title: '数据来源链接',
      key: 'link',
      width: 200,
      render: (_: any, record: Metric) => (
        <Input
          placeholder={record.data_source_link || '留空使用指标定义链接'}
          value={modifiedLinks[record.id] || ''}
          onChange={(e) => handleLinkChange(record.id, e.target.value)}
          style={{ fontSize: 12 }}
        />
      ),
    },
  ];

  // 记录已修改的值和链接
  const [modifiedValues, setModifiedValues] = useState<Record<number, number>>({});
  const [modifiedLinks, setModifiedLinks] = useState<Record<number, string>>({});

  const handleValueChange = (metricId: number, value: number | null) => {
    if (value !== null) {
      setModifiedValues(prev => ({ ...prev, [metricId]: value }));
    } else {
      setModifiedValues(prev => {
        const newMap = { ...prev };
        delete newMap[metricId];
        return newMap;
      });
    }
  };

  const handleLinkChange = (metricId: number, link: string) => {
    if (link.trim()) {
      setModifiedLinks(prev => ({ ...prev, [metricId]: link.trim() }));
    } else {
      setModifiedLinks(prev => {
        const newMap = { ...prev };
        delete newMap[metricId];
        return newMap;
      });
    }
  };

  // 保存数据
  const handleSave = async () => {
    if (Object.keys(modifiedValues).length === 0) {
      message.warning('请至少录入一条数据');
      return;
    }

    setSaving(true);
    try {
      const records = Object.entries(modifiedValues).map(([metric_id, value]) => ({
        metric_id: parseInt(metric_id),
        year,
        month,
        value,
        data_source_link: modifiedLinks[parseInt(metric_id)] || undefined,
      }));

      await metricApi.batchCreateHistory(records);
      message.success('数据录入成功');
      setModifiedValues({});
      setModifiedLinks({});
      onCancel();
    } catch (error: any) {
      message.error(error.message || '数据录入失败');
    } finally {
      setSaving(false);
    }
  };

  // 重置
  const handleReset = () => {
    setModifiedValues({});
    setModifiedLinks({});
  };

  return (
    <Modal
      title="录入月度数据"
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="reset" icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
        >
          保存
        </Button>,
      ]}
    >
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Text strong style={{ marginRight: 8 }}>录入年月：</Text>
            <InputNumber
              value={year}
              onChange={(val) => setYear(val || new Date().getFullYear())}
              min={2020}
              max={2100}
              style={{ width: 80 }}
            />
            <Text style={{ margin: '0 4px' }}>年</Text>
            <InputNumber
              value={month}
              onChange={(val) => setMonth(val || 1)}
              min={1}
              max={12}
              style={{ width: 60 }}
            />
            <Text style={{ marginLeft: 4 }}>月</Text>
          </Col>
          <Col span={5}>
            <Select
              placeholder="按分类筛选"
              allowClear
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              style={{ width: 120 }}
            >
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <Option key={key} value={key}>
                  <span style={{ color: config.color }}>●</span> {config.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="按维度筛选"
              allowClear
              value={dimensionFilter}
              onChange={(val) => setDimensionFilter(val)}
              style={{ width: 100 }}
            >
              {Object.entries(DIMENSION_CONFIG).map(([key, config]) => (
                <Option key={key} value={key}>
                  <span style={{ color: config.color }}>●</span> {config.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Text type="secondary">
              已选 {Object.keys(modifiedValues).length} 条
            </Text>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={metrics}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, size: 'small' }}
        size="small"
        scroll={{ y: 400 }}
      />
    </Modal>
  );
};

export default DataEntryModal;
