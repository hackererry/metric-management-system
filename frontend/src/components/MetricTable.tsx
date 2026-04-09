/**
 * 指标列表组件 - 表格展示和管理指标
 */
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Switch,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Metric,
  Category,
  Dimension,
  CATEGORY_CONFIG,
  DATA_TYPE_CONFIG,
  TREND_CONFIG,
  DIMENSION_CONFIG,
  MetricFormData,
} from '../types';
import { metricApi } from '../services/api';
import MetricForm from './MetricForm';

const { Option } = Select;
const { Search } = Input;

const MetricTable: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | undefined>();
  const [dimensionFilter, setDimensionFilter] = useState<Dimension | undefined>();
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>();
  const [formVisible, setFormVisible] = useState(false);
  const [currentMetric, setCurrentMetric] = useState<Metric | null>(null);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await metricApi.getList({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        keyword: keyword || undefined,
        category: categoryFilter,
        is_active: statusFilter,
      });
      // 前端按维度筛选（后端不提供维度筛选参数）
      let items = response.items;
      if (dimensionFilter) {
        items = items.filter(m => m.dimension === dimensionFilter);
      }
      setMetrics(items);
      setTotal(dimensionFilter ? items.length : response.total);
    } catch (error: any) {
      message.error(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, keyword, categoryFilter, dimensionFilter, statusFilter]);

  // 删除指标
  const handleDelete = async (id: number) => {
    try {
      await metricApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 切换状态
  const handleToggleStatus = async (metric: Metric) => {
    try {
      await metricApi.update(metric.id, { is_active: !metric.is_active });
      message.success('状态更新成功');
      loadData();
    } catch (error: any) {
      message.error(error.message || '更新失败');
    }
  };

  // 提交表单
  const handleSubmit = async (data: MetricFormData) => {
    if (currentMetric) {
      await metricApi.update(currentMetric.id, data);
    } else {
      await metricApi.create(data);
    }
    loadData();
  };

  // 打开编辑表单
  const handleEdit = (metric: Metric) => {
    setCurrentMetric(metric);
    setFormVisible(true);
  };

  // 打开新增表单
  const handleAdd = () => {
    setCurrentMetric(null);
    setFormVisible(true);
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: string, record: Metric) => (
        <span>
          {text}
          {record.description && (
            <span style={{ color: '#8c8c8c', marginLeft: 4, fontSize: 12 }}>
              ({record.description.slice(0, 20)}...)
            </span>
          )}
        </span>
      ),
    },
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (text: string) => <code style={{ fontSize: 12 }}>{text}</code>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: Category) => {
        const config = CATEGORY_CONFIG[category];
        return <Tag color={config.color} style={{ borderRadius: 4 }}>{config.label}</Tag>;
      },
    },
    {
      title: '维度',
      dataIndex: 'dimension',
      key: 'dimension',
      width: 80,
      render: (dimension: Dimension) => {
        const config = DIMENSION_CONFIG[dimension];
        return config ? <Tag color={config.color} style={{ borderRadius: 4 }}>{config.label}</Tag> : '-';
      },
    },
    {
      title: '数据类型',
      dataIndex: 'data_type',
      key: 'data_type',
      width: 100,
      render: (type: string) => DATA_TYPE_CONFIG[type as keyof typeof DATA_TYPE_CONFIG]?.label || type,
    },
    {
      title: '当前值',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      render: (value: number, record: Metric) => {
        const display =
          record.data_type === 'percentage'
            ? `${value.toFixed(1)}%`
            : record.unit
            ? `${value.toLocaleString()} ${record.unit}`
            : value.toLocaleString();
        return <span style={{ fontWeight: 500 }}>{display}</span>;
      },
    },
    {
      title: '目标值',
      dataIndex: 'target_value',
      key: 'target_value',
      width: 120,
      render: (value: number | null, record: Metric) => {
        if (!value) return '-';
        const display =
          record.data_type === 'percentage'
            ? `${value.toFixed(1)}%`
            : record.unit
            ? `${value.toLocaleString()} ${record.unit}`
            : value.toLocaleString();
        return display;
      },
    },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      width: 80,
      render: (trend: string) => {
        if (!trend) return '-';
        const config = TREND_CONFIG[trend as keyof typeof TREND_CONFIG];
        return (
          <Tag color={config.color} style={{ borderRadius: 4 }}>
            {config.icon} {config.label}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (active: boolean, record: Metric) => (
        <Switch
          checked={active}
          onChange={() => handleToggleStatus(record)}
          size="small"
          style={{ backgroundColor: active ? '#107C10' : '#C8C6C4' }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Metric) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此指标吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      {/* 工具栏 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Search
            placeholder="搜索指标名称/编码/描述"
            allowClear
            onSearch={setKeyword}
            enterButton={<SearchOutlined />}
          />
        </Col>
        <Col span={4}>
          <Select
            placeholder="分类筛选"
            allowClear
            style={{ width: '100%' }}
            onChange={setCategoryFilter}
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
            placeholder="维度筛选"
            allowClear
            style={{ width: '100%' }}
            onChange={setDimensionFilter}
          >
            {Object.entries(DIMENSION_CONFIG).map(([key, config]) => (
              <Option key={key} value={key}>
                <span style={{ color: config.color }}>●</span> {config.label}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={3}>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: '100%' }}
            onChange={setStatusFilter}
          >
            <Option value={true}>启用</Option>
            <Option value={false}>停用</Option>
          </Select>
        </Col>
        <Col span={7} style={{ textAlign: 'right' }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增指标
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={metrics}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        scroll={{ x: 1200 }}
      />

      {/* 表单弹窗 */}
      <MetricForm
        visible={formVisible}
        metric={currentMetric}
        onCancel={() => setFormVisible(false)}
        onSubmit={handleSubmit}
      />
    </Card>
  );
};

export default MetricTable;
