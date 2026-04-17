/**
 * 年度指标展示卡片 - 按维度分组展示overview类别指标
 */
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Typography, Tag, Spin, message, Tooltip, Radio, Collapse } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined, MinusOutlined } from '@ant-design/icons';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { metricApi } from '../services/api';
import { Metric, MetricGroupedResponse, Dimension, DIMENSION_CONFIG, MonthlyHistoryMap } from '../types';
import MonthlyLineChart from './MonthlyLineChart';

const { Text } = Typography;

interface AnnualMetricsCardProps {
  year: number;
  month?: number | null;
}

// 状态配置
const STATUS_CONFIG = {
  green: { color: '#107C10', icon: <CheckCircleOutlined />, label: '全部达标' },
  yellow: { color: '#FFB900', icon: <ExclamationCircleOutlined />, label: '部分达标' },
  red: { color: '#D13438', icon: <CloseCircleOutlined />, label: '全部未达标' },
  none: { color: '#C8C6C4', icon: <MinusOutlined />, label: '暂无数据' },
};

// 维度配置
const DIMENSION_LABELS: Record<Dimension, string> = {
  quality: '质量',
  efficiency: '效率',
  experience: '体验',
  business: '经营',
  operation: '运作',
};

const AnnualMetricsCard: React.FC<AnnualMetricsCardProps> = ({ year, month }) => {
  const [loading, setLoading] = useState(true);
  const [metricsData, setMetricsData] = useState<Metric[]>([]);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyHistoryMap>({});
  // 标记月度历史数据是否加载完成
  const [historyLoaded, setHistoryLoaded] = useState(false);
  // 所有维度的展示模式状态（表格/折线图）
  const [viewModes, setViewModes] = useState<Record<Dimension, 'table' | 'chart'>>({
    quality: 'table',
    efficiency: 'table',
    experience: 'table',
    business: 'table',
    operation: 'table',
  });

  useEffect(() => {
    loadData();
  }, [year]);

  useEffect(() => {
    loadMonthlyHistory();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await metricApi.getByCategoryGrouped('overview');
      // 合并所有维度指标
      const allMetrics = Object.values(data).flat();
      setMetricsData(allMetrics);
    } catch (error: any) {
      message.error(error.message || '加载年度指标失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyHistory = async () => {
    try {
      const data = await metricApi.getMonthlyHistory('overview', year);
      setMonthlyHistory(data);
      setHistoryLoaded(true);
    } catch (error: any) {
      console.error('加载月度历史数据失败', error);
      setHistoryLoaded(true);
    }
  };

  // 根据月份计算指标值（返回 null 表示没有数据）
  const getCalculatedValue = (metric: Metric): number | null => {
    // 选择具体月份时，从月度历史数据中获取
    if (month !== null && month !== undefined) {
      const metricHistory = monthlyHistory[metric.code];
      if (metricHistory && metricHistory[month] !== undefined) {
        return metricHistory[month];
      }
      // 没有该月份数据，返回 null 显示横杠
      return null;
    }

    // 选择"全部"时
    // 如果月度历史数据还未加载完成，显示当前值
    if (!historyLoaded) {
      return metric.value;
    }

    // 月度历史数据已加载完成
    const metricHistory = monthlyHistory[metric.code];
    if (!metricHistory || Object.keys(metricHistory).length === 0) {
      // 该年份没有任何数据，显示横杠
      return null;
    }

    // 根据 aggregation_type 计算年度值
    const values = Object.values(metricHistory);
    if (metric.aggregation_type === 'sum') {
      // 求和
      return Math.round(values.reduce((acc, v) => acc + v, 0) * 100) / 100;
    } else {
      // 平均（默认）
      return Math.round((values.reduce((acc, v) => acc + v, 0) / values.length) * 100) / 100;
    }
  };

  // 按维度分组
  const getMetricsByDimension = () => {
    const grouped: Record<Dimension, Metric[]> = {
      quality: [],
      efficiency: [],
      experience: [],
      business: [],
      operation: [],
    };

    metricsData.forEach(m => {
      if (m.dimension && grouped[m.dimension]) {
        grouped[m.dimension].push(m);
      }
    });

    return grouped;
  };

  // 计算单个维度的状态
  const getDimensionStatus = (dimensionMetrics: Metric[]): keyof typeof STATUS_CONFIG => {
    if (dimensionMetrics.length === 0) return 'none';

    const metricsWithTarget = dimensionMetrics.filter(m => m.target_value !== null);
    if (metricsWithTarget.length === 0) return 'green';

    const metCount = metricsWithTarget.filter(m => {
      // 根据 lower_is_better 判断达标条件
      // lower_is_better: true -> 越小越好 (value <= target_value)
      // lower_is_better: false -> 越大越好 (value >= target_value)
      if (m.lower_is_better) {
        return m.value <= (m.target_value as number);
      } else {
        return m.value >= (m.target_value as number);
      }
    }).length;

    if (metCount === metricsWithTarget.length) return 'green';
    if (metCount > 0) return 'yellow';
    return 'red';
  };

  // 计算整体状态
  const getOverallStatus = (): keyof typeof STATUS_CONFIG => {
    const grouped = getMetricsByDimension();
    const dimensions = Object.keys(grouped) as Dimension[];

    let allHaveMetrics = true;
    let allGreen = true;
    let anyYellow = false;
    let anyRed = false;

    dimensions.forEach(dim => {
      const dimMetrics = grouped[dim];
      if (dimMetrics.length === 0) {
        allHaveMetrics = false;
      } else {
        const status = getDimensionStatus(dimMetrics);
        if (status === 'yellow') anyYellow = true;
        if (status === 'red') anyRed = true;
        if (status !== 'green') allGreen = false;
      }
    });

    if (allGreen && allHaveMetrics) return 'green';
    if (anyRed) return 'red';
    if (anyYellow) return 'yellow';
    return 'none';
  };

  // 详细数据卡片 - 按维度分组展示
  const renderDetailData = () => {
    if (loading) {
      return (
        <Card title="指标详细数据" size="small">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        </Card>
      );
    }

    const grouped = getMetricsByDimension();

    if (metricsData.length === 0) {
      return (
        <Card title="指标详细数据" size="small">
          <div style={{ textAlign: 'center', padding: 40, color: '#605E5C' }}>
            暂无数据
          </div>
        </Card>
      );
    }

    // 渲染单个指标子项（横向排列）
    const renderMetricItem = (metric: Metric, span: number) => {
      const calculatedValue = getCalculatedValue(metric);
      const hasValue = calculatedValue !== null;

      // 只有有值且有上一周期值时才计算环比
      const momChange = hasValue && metric.previous_value && metric.previous_value !== 0
        ? ((calculatedValue - metric.previous_value) / metric.previous_value * 100).toFixed(1)
        : null;
      const isPositive = momChange ? parseFloat(momChange) > 0 : false;
      const isGood = metric.lower_is_better ? !isPositive : isPositive;
      const changeColor = momChange ? (isGood ? '#107C10' : '#D13438') : '#605E5C';

      return (
        <Col span={span} key={metric.id} style={{ padding: '8px 4px' }}>
          <div style={{
            padding: '12px 16px',
            borderRadius: 6,
            background: '#FAF9F8',
            border: `1px solid #E1DFDD`,
            textAlign: 'center',
          }}>
            <div style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 13, color: '#605E5C' }}>{metric.name}</Text>
            </div>
            <div>
              {hasValue ? (
                <>
                  <Text style={{ fontSize: 20, fontWeight: 600, color: '#323130' }}>
                    {metric.data_type === 'percentage' ? `${calculatedValue.toFixed(1)}%` : calculatedValue.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#605E5C', marginLeft: 4 }}>{metric.unit || ''}</Text>
                </>
              ) : (
                <Text style={{ fontSize: 20, fontWeight: 600, color: '#C8C6C4' }}>-</Text>
              )}
            </div>
            {momChange !== null && (
              <div style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: changeColor }}>
                  {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {isPositive ? '+' : ''}{momChange}%
                </Text>
              </div>
            )}
          </div>
        </Col>
      );
    };

    // 渲染维度卡片
    const renderDimensionCard = (dim: Dimension, span: number) => {
      const dimMetrics = grouped[dim];
      if (dimMetrics.length === 0) return null;

      const dimConfig = DIMENSION_CONFIG[dim];
      // 计算每个指标占的宽度：如果指标数<=6，则平分一行；否则每行最多6个
      const itemSpan = dimMetrics.length <= 6 ? Math.floor(24 / dimMetrics.length) : 4;

      return (
        <Col span={span} key={dim}>
          <Card
            size="small"
            title={
              <Tag color={dimConfig.color} style={{ marginRight: 8 }}>
                {DIMENSION_LABELS[dim]}
              </Tag>
            }
            style={{ height: '100%' }}
            bodyStyle={{ padding: 0 }}
          >
            <Row gutter={0}>
              {dimMetrics.map(m => renderMetricItem(m, itemSpan))}
            </Row>
          </Card>
        </Col>
      );
    };

    return (
      <>
        {/* 第一行：质量和效率并排 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {renderDimensionCard('quality', 12)}
          {renderDimensionCard('efficiency', 12)}
        </Row>

        {/* 第二行：体验单独一行 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {renderDimensionCard('experience', 24)}
        </Row>

        {/* 第三行：经营单独一行 */}
        <Row gutter={16}>
          {renderDimensionCard('business', 24)}
        </Row>
      </>
    );
  };

  // 月度数据表格 - 按维度拆分
  const renderMonthlyData = () => {
    if (loading || metricsData.length === 0) return null;

    // 使用从数据库加载的真实月度数据
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    // 获取当前月份索引
    const currentMonth = new Date().getMonth();
    const isCurrentYear = year === new Date().getFullYear();

    // 按维度分组
    const metricsByDimension = getMetricsByDimension();

    // 生成单个维度表格的列定义
    const getColumnsByDimension = (dimension: Dimension) => [
      {
        title: '指标名称',
        dataIndex: 'name',
        key: 'name',
        fixed: 'left' as const,
        width: 100,
        ellipsis: true,
      },
      {
        title: '目标值',
        dataIndex: 'target_value',
        key: 'target_value',
        width: 65,
        render: (target: number | null, record: Metric) => {
          if (!target) return '-';
          const displayValue = record.unit
            ? `${target.toLocaleString()} ${record.unit}`
            : target.toLocaleString();
          return <Text style={{ fontSize: 10 }}>{displayValue}</Text>;
        },
      },
      ...months.map((m, idx) => ({
        title: m,
        key: `month_${idx}`,
        width: 60,
        render: (_: any, record: Metric) => {
          // 未来月份或当前月份之后的月份显示-
          if (isCurrentYear && idx > currentMonth) {
            return <Text style={{ color: '#C8C6C4', fontSize: 10 }}>-</Text>;
          }
          // monthlyHistory: { [metricCode]: { [month]: value } }
          const value = monthlyHistory[record.code]?.[idx + 1];
          if (value === undefined) return <Text style={{ color: '#C8C6C4', fontSize: 10 }}>-</Text>;
          // 判断是否达标
          const isMet = record.target_value
            ? record.lower_is_better
              ? value <= record.target_value
              : value >= record.target_value
            : true;
          const displayValue = record.unit ? `${value} ${record.unit}` : value;
          return <Text style={{ fontSize: 10, color: isMet ? '#323130' : '#D13438', fontWeight: isMet ? 'normal' : 600 }}>{displayValue}</Text>;
        },
      })),
    ];

    // 渲染单个维度的月度数据表格
    const renderDimensionMonthlyTable = (dim: Dimension) => {
      const dimMetrics = metricsByDimension[dim];
      if (dimMetrics.length === 0) return null;

      const dimConfig = DIMENSION_CONFIG[dim];
      const currentViewMode = viewModes[dim];

      return (
        <Card
          key={dim}
          size="small"
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag color={dimConfig.color} style={{ marginRight: 8 }}>
                {DIMENSION_LABELS[dim]}
              </Tag>
              <Radio.Group
                value={currentViewMode}
                onChange={e => setViewModes(prev => ({ ...prev, [dim]: e.target.value }))}
                size="small"
                buttonStyle="solid"
              >
                <Radio.Button value="table">表格</Radio.Button>
                <Radio.Button value="chart">折线图</Radio.Button>
              </Radio.Group>
            </div>
          }
          style={{ marginBottom: 12 }}
        >
          {currentViewMode === 'table' ? (
            <Table
              columns={getColumnsByDimension(dim)}
              dataSource={dimMetrics.map(m => ({ ...m, key: m.id }))}
              pagination={false}
              size="small"
              scroll={{ x: 850 }}
            />
          ) : (
            <MonthlyLineChart
              metrics={dimMetrics}
              monthlyData={monthlyHistory}
              year={year}
              dimension={dim}
            />
          )}
        </Card>
      );
    };

    return (
      <div style={{ marginTop: 24 }}>
        <Collapse
          defaultActiveKey={[]}
          items={[{
            key: 'monthly',
            label: <span style={{ fontWeight: 500 }}>月度数据</span>,
            children: (
              <>
                {renderDimensionMonthlyTable('quality')}
                {renderDimensionMonthlyTable('efficiency')}
                {renderDimensionMonthlyTable('experience')}
                {renderDimensionMonthlyTable('business')}
                {renderDimensionMonthlyTable('operation')}
              </>
            ),
          }]}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <Card
        title={`产品部指标 - ${year}年${month ? month + '月' : '度'}`}
        style={{ marginBottom: 16 }}
      >
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  // 获取各维度状态用于标题栏展示
  const getDimensionStatusCircles = () => {
    const grouped = getMetricsByDimension();

    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {(['quality', 'efficiency', 'experience', 'business'] as Dimension[]).map(dim => {
          const dimMetrics = grouped[dim];
          const dimStatus = getDimensionStatus(dimMetrics);
          const dimStatusInfo = STATUS_CONFIG[dimStatus];

          return (
            <Tooltip key={dim} title={dimStatusInfo.label}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: dimStatusInfo.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
              }}>
                {DIMENSION_LABELS[dim]}
              </div>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: 48 }}>{`产品部指标 - ${year}年${month ? month + '月' : '度'}`}</span>
          {getDimensionStatusCircles()}
        </div>
      }
      style={{ marginBottom: 16 }}
    >
      {/* 详细数据 */}
      <Row gutter={16}>
        <Col xs={24}>
          {renderDetailData()}
        </Col>
      </Row>

      {/* 月度数据 */}
      <Row gutter={16}>
        <Col xs={24}>
          {renderMonthlyData()}
        </Col>
      </Row>
    </Card>
  );
};

export default AnnualMetricsCard;
