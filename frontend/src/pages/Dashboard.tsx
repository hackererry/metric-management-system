/**
 * 看板页面 - 年度指标 + 产品团队雷达图卡片 + 详细指标列表
 */
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spin, message, Divider, Table, Tag, Typography, Empty, Select } from 'antd';
import {
  BarChartOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { Metric, Category, METRIC_TYPE_CONFIG, MetricGroupedResponse, MetricType } from '../types';
import { metricApi } from '../services/api';
import AnnualMetricsCard from '../components/AnnualMetricsCard';
import ProductTeamRadarCard from '../components/ProductTeamRadarCard';

const { Title, Text } = Typography;
const { Option } = Select;

// 产品团队配置（移除总览）
const TEAM_CONFIG: Record<string, { label: string; color: string }> = {
  product_a: { label: '导购产品团队', color: '#52c41a' },
  product_b: { label: '交易产品团队', color: '#faad14' },
  product_c: { label: '智选车产品团队', color: '#722ed1' },
  product_d: { label: '公告产品团队', color: '#1890ff' },
};

const Dashboard: React.FC = () => {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState<number | null>(null);
  const [allMetrics, setAllMetrics] = useState<Record<Category, MetricGroupedResponse>>({
    overview: { business: [], tech: [] },
    product_a: { business: [], tech: [] },
    product_b: { business: [], tech: [] },
    product_c: { business: [], tech: [] },
    product_d: { business: [], tech: [] },
  });
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载所有数据
  const loadData = async () => {
    setLoading(true);
    try {
      const categories: Category[] = ['overview', 'product_a', 'product_b', 'product_c', 'product_d'];
      const promises = categories.map(cat => metricApi.getByCategoryGrouped(cat));
      const results = await Promise.all(promises);

      const metricsMap: Record<Category, MetricGroupedResponse> = {
        overview: results[0],
        product_a: results[1],
        product_b: results[2],
        product_c: results[3],
        product_d: results[4],
      };
      setAllMetrics(metricsMap);
    } catch (error: any) {
      message.error(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 计算团队统计数据
  const getTeamStats = (category: Category) => {
    const metrics = allMetrics[category];
    const allTeamMetrics = [...metrics.business, ...metrics.tech];

    const businessCount = metrics.business.length;
    const techCount = metrics.tech.length;
    const totalCount = allTeamMetrics.length;

    // 正常指标：达标或没有目标值
    const normalCount = allTeamMetrics.filter(m =>
      !m.target_value || m.value >= m.target_value
    ).length;

    // 异常指标：有目标值但未达标
    const abnormalCount = allTeamMetrics.filter(m =>
      m.target_value && m.value < m.target_value
    ).length;

    return { businessCount, techCount, totalCount, normalCount, abnormalCount };
  };

  // 格式化显示值
  const formatValue = (metric: Metric) => {
    if (metric.data_type === 'percentage') {
      return `${metric.value.toFixed(1)}%`;
    }
    return metric.unit ? `${metric.value.toLocaleString()} ${metric.unit}` : metric.value.toLocaleString();
  };

  // 获取趋势标签
  const getTrendTag = (trend: string | null) => {
    if (!trend) return '-';
    const config: Record<string, { color: string; label: string; icon: string }> = {
      up: { color: 'green', label: '上升', icon: '↑' },
      down: { color: 'red', label: '下降', icon: '↓' },
      stable: { color: 'default', label: '持平', icon: '→' },
    };
    const c = config[trend];
    return <Tag color={c.color}>{c.icon} {c.label}</Tag>;
  };

  // 获取状态标签
  const getStatusTag = (metric: Metric) => {
    if (!metric.target_value) return <Tag color="default">无目标</Tag>;
    if (metric.value >= metric.target_value) {
      return <Tag color="success">达标</Tag>;
    }
    return <Tag color="error">未达标</Tag>;
  };

  // 指标列表列定义
  const getColumns = (metricType: MetricType) => [
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: Metric) => (
        <span>
          {text}
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
              ({record.description.slice(0, 15)}...)
            </Text>
          )}
        </span>
      ),
    },
    {
      title: '当前值',
      dataIndex: 'value',
      key: 'value',
      width: 150,
      render: (_: any, record: Metric) => (
        <Text strong style={{ color: record.target_value && record.value < record.target_value ? '#ff4d4f' : '#52c41a' }}>
          {formatValue(record)}
        </Text>
      ),
    },
    {
      title: '目标值',
      dataIndex: 'target_value',
      key: 'target_value',
      width: 120,
      render: (_: any, record: Metric) => {
        if (!record.target_value) return '-';
        return record.unit
          ? `${record.target_value.toLocaleString()} ${record.unit}`
          : record.target_value.toLocaleString();
      },
    },
    {
      title: '完成率',
      key: 'completion',
      width: 100,
      render: (_: any, record: Metric) => {
        if (!record.target_value) return '-';
        const rate = ((record.value / record.target_value) * 100).toFixed(1);
        const color = parseFloat(rate) >= 100 ? '#52c41a' : '#ff4d4f';
        return <Text style={{ color }}>{rate}%</Text>;
      },
    },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      width: 80,
      render: (trend: string) => getTrendTag(trend),
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      render: (_: any, record: Metric) => getStatusTag(record),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  const selectedMetrics = selectedTeam ? allMetrics[selectedTeam as Category] : null;

  return (
    <div>
      {/* 页面标题和年度筛选 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          指标看板总览
        </Title>
        <div>
          <CalendarOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
          <Select
            value={year}
            onChange={setYear}
            style={{ width: 100 }}
          >
            <Option value={2023}>2023年</Option>
            <Option value={2024}>2024年</Option>
            <Option value={2025}>2025年</Option>
            <Option value={2026}>2026年</Option>
          </Select>
        </div>
      </div>

      {/* 年度指标展示卡片 */}
      <AnnualMetricsCard year={year} />

      {/* 产品团队指标标题和筛选 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 16 }}>
        <Title level={5} style={{ margin: 0 }}>
          产品团队指标
        </Title>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select
            value={year}
            onChange={(val) => {
              setYear(val);
              setMonth(null);
            }}
            style={{ width: 100 }}
          >
            <Option value={2023}>2023年</Option>
            <Option value={2024}>2024年</Option>
            <Option value={2025}>2025年</Option>
            <Option value={2026}>2026年</Option>
          </Select>
          <Select
            value={month}
            onChange={setMonth}
            style={{ width: 80 }}
            allowClear
            placeholder="全部"
          >
            <Option value={1}>1月</Option>
            <Option value={2}>2月</Option>
            <Option value={3}>3月</Option>
            <Option value={4}>4月</Option>
            <Option value={5}>5月</Option>
            <Option value={6}>6月</Option>
            <Option value={7}>7月</Option>
            <Option value={8}>8月</Option>
            <Option value={9}>9月</Option>
            <Option value={10}>10月</Option>
            <Option value={11}>11月</Option>
            <Option value={12}>12月</Option>
          </Select>
        </div>
      </div>

      {/* 产品团队雷达图卡片 */}
      <Row gutter={[16, 16]}>
        {Object.entries(TEAM_CONFIG).map(([key, config]) => {
          const isSelected = selectedTeam === key;

          return (
            <Col xs={24} sm={12} lg={6} key={key}>
              <ProductTeamRadarCard
                teamKey={key}
                label={config.label}
                color={config.color}
                year={year}
                month={month}
                isSelected={isSelected}
                onClick={() => setSelectedTeam(isSelected ? null : key)}
              />
            </Col>
          );
        })}
      </Row>

      {/* 详细指标列表 */}
      {selectedTeam && selectedMetrics && (
        <div style={{ marginTop: 24 }}>
          <Divider orientation="left">
            <span style={{ color: TEAM_CONFIG[selectedTeam].color, fontWeight: 600 }}>
              {TEAM_CONFIG[selectedTeam].label} - 详细指标
            </span>
          </Divider>

          {/* 业务指标列表 */}
          <Card
            title={
              <span>
                <BarChartOutlined style={{ color: METRIC_TYPE_CONFIG.business.color, marginRight: 8 }} />
                业务指标 ({selectedMetrics.business.length}个)
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            {selectedMetrics.business.length > 0 ? (
              <Table
                columns={getColumns('business')}
                dataSource={selectedMetrics.business}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无业务指标" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>

          {/* 研发指标列表 */}
          <Card
            title={
              <span>
                <CodeOutlined style={{ color: METRIC_TYPE_CONFIG.tech.color, marginRight: 8 }} />
                研发指标 ({selectedMetrics.tech.length}个)
              </span>
            }
          >
            {selectedMetrics.tech.length > 0 ? (
              <Table
                columns={getColumns('tech')}
                dataSource={selectedMetrics.tech}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无研发指标" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </div>
      )}

      {/* 未选择提示 */}
      {!selectedTeam && (
        <div style={{ marginTop: 24, textAlign: 'center', color: '#8c8c8c' }}>
          <Text type="secondary">点击上方产品团队卡片查看详细指标</Text>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
