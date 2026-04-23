/**
 * 年度指标展示卡片 - 按维度分组展示overview类别指标
 */
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Typography, Tag, Spin, message, Tooltip, Radio, Collapse } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined, MinusOutlined } from '@ant-design/icons';
import { ArrowUpOutlined, ArrowDownOutlined, LinkOutlined } from '@ant-design/icons';
import { metricApi } from '../services/api';
import { Metric, MetricGroupedResponse, Dimension, DIMENSION_CONFIG, MonthlyHistoryMap } from '../types';
import MonthlyLineChart from './MonthlyLineChart';
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  STATUS_CONFIG,
  createChangeColor,
  DIMENSION_STYLES,
} from '../styles/theme';

const { Text } = Typography;

// 补全 URL 协议前缀
const normalizeUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
};

interface AnnualMetricsCardProps {
  year: number;
  month?: number | null;
  overviewMetrics?: MetricGroupedResponse;
  overviewHistory?: MonthlyHistoryMap;
}

// 维度中文标签
const DIMENSION_LABELS: Record<Dimension, string> = {
  quality: '质量',
  efficiency: '效率',
  experience: '体验',
  business: '经营',
  operation: '运作',
};

const AnnualMetricsCard: React.FC<AnnualMetricsCardProps> = ({ year, month, overviewMetrics, overviewHistory }) => {
  const [loading, setLoading] = useState(true);
  const [metricsData, setMetricsData] = useState<Metric[]>([]);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyHistoryMap>({});
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [viewModes, setViewModes] = useState<Record<Dimension, 'table' | 'chart'>>({
    quality: 'table',
    efficiency: 'table',
    experience: 'table',
    business: 'table',
    operation: 'table',
  });

  useEffect(() => {
    if (overviewMetrics) {
      setMetricsData(Object.values(overviewMetrics).flat());
      setLoading(false);
    } else {
      loadData();
    }
  }, [year, overviewMetrics]);

  useEffect(() => {
    if (overviewHistory) {
      setMonthlyHistory(overviewHistory);
      setHistoryLoaded(true);
    } else {
      loadMonthlyHistory();
    }
  }, [year, overviewHistory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await metricApi.getByCategoryGrouped('overview');
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

  const getCalculatedValue = (metric: Metric): number | null => {
    if (month !== null && month !== undefined) {
      const metricHistory = monthlyHistory[metric.code];
      if (metricHistory && metricHistory[month] !== undefined) {
        const data = metricHistory[month];
        return typeof data === 'object' ? data.value : data;
      }
      return null;
    }

    if (!historyLoaded) {
      return null;
    }

    const metricHistory = monthlyHistory[metric.code];
    if (!metricHistory || Object.keys(metricHistory).length === 0) {
      return null;
    }

    const values = Object.values(metricHistory).map(v => typeof v === 'object' ? v.value : v);
    if (metric.aggregation_type === 'sum') {
      return Math.round(values.reduce((acc, v) => acc + v, 0) * 100) / 100;
    } else {
      return Math.round((values.reduce((acc, v) => acc + v, 0) / values.length) * 100) / 100;
    }
  };

  const getHistoryData = (metric: Metric, targetMonth: number) => {
    const metricHistory = monthlyHistory[metric.code];
    if (!metricHistory) return null;
    const data = metricHistory[targetMonth];
    if (!data) return null;
    return typeof data === 'object' ? data : { value: data, data_source_link: null };
  };

  const getPreviousValue = (metric: Metric, currentMonth: number): number | null => {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? year - 1 : year;
    const data = getHistoryData(metric, prevMonth);
    return data ? data.value : null;
  };

  // 构建指标行 - 每行最多maxPerRow个，多维度混合排列
  const buildMetricRows = (dimMetricsMap: Record<Dimension, Metric[]>, maxPerRow: number): Metric[][] => {
    // 收集所有有数据的维度指标
    const dimensionKeys = (Object.keys(dimMetricsMap) as Dimension[]).filter(dim => dimMetricsMap[dim].length > 0);
    const rows: Metric[][] = [];
    let currentRow: Metric[] = [];

    // 轮询填充每行
    while (dimensionKeys.length > 0) {
      const dim = dimensionKeys[0]; // 总是从第一个维度取
      const metrics = dimMetricsMap[dim];

      if (metrics.length > 0) {
        // 取第一个指标放入当前行
        currentRow.push(metrics.shift()!);
        if (currentRow.length === maxPerRow) {
          rows.push([...currentRow]);
          currentRow = [];
        }
      }

      // 如果当前维度空了，移除
      if (metrics.length === 0) {
        dimensionKeys.shift();
      }
    }

    // 处理最后一行
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  };

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

  const getDimensionStatus = (dimensionMetrics: Metric[]): keyof typeof STATUS_CONFIG => {
    if (dimensionMetrics.length === 0) return 'none';

    const currentMonth = month ?? new Date().getMonth() + 1;

    const metricsWithTarget = dimensionMetrics.filter(m => m.target_value !== null);
    if (metricsWithTarget.length === 0) return 'green';

    const metCount = metricsWithTarget.filter(m => {
      const data = getHistoryData(m, currentMonth);
      if (!data) return false;
      const value = data.value;
      if (m.lower_is_better) {
        return value <= (m.target_value as number);
      } else {
        return value >= (m.target_value as number);
      }
    }).length;

    if (metCount === metricsWithTarget.length) return 'green';
    if (metCount > 0) return 'yellow';
    return 'red';
  };

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

  // 将维度分组到各行，每行最多 maxMetricsPerRow 个指标
  // 同一维度的指标不可拆分，但多个维度可以共享一行
  const groupDimensionsIntoRows = (
    grouped: Record<Dimension, Metric[]>,
    maxMetricsPerRow: number = 6
  ): { dimension: Dimension; metrics: Metric[] }[][] => {
    const dimensions = (Object.keys(DIMENSION_CONFIG) as Dimension[]).filter(
      dim => grouped[dim]?.length > 0
    );

    const rows: { dimension: Dimension; metrics: Metric[] }[][] = [];
    let currentRow: { dimension: Dimension; metrics: Metric[] }[] = [];
    let currentRowCount = 0;

    for (const dim of dimensions) {
      const dimMetrics = grouped[dim];

      if (currentRowCount + dimMetrics.length <= maxMetricsPerRow) {
        currentRow.push({ dimension: dim, metrics: dimMetrics });
        currentRowCount += dimMetrics.length;
      } else {
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [{ dimension: dim, metrics: dimMetrics }];
        currentRowCount = dimMetrics.length;
      }
    }

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
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
          <div style={{ textAlign: 'center', padding: 40, color: COLORS.secondary }}>
            暂无数据
          </div>
        </Card>
      );
    }

    // 渲染单个指标子项（横向排列）
    const renderMetricItem = (metric: Metric, displayMonth: number) => {
      const calculatedValue = getCalculatedValue(metric);
      const hasValue = calculatedValue !== null;
      const historyData = getHistoryData(metric, displayMonth);

      // 优先使用历史记录中的链接，否则使用指标定义时的链接，并补全协议前缀
      const dataSourceLink = normalizeUrl(historyData?.data_source_link || metric.data_source_link);

      // 判断是否达标
      const isMet = hasValue && metric.target_value
        ? (metric.lower_is_better ? calculatedValue <= metric.target_value : calculatedValue >= metric.target_value)
        : true;

      const prevValue = getPreviousValue(metric, displayMonth);
      const momChange = hasValue && prevValue && prevValue !== 0
        ? ((calculatedValue - prevValue) / prevValue * 100).toFixed(1)
        : null;
      const isPositive = momChange ? parseFloat(momChange) > 0 : false;
      const changeColor = momChange ? createChangeColor(parseFloat(momChange), metric.lower_is_better) : COLORS.secondary;

      // 未达标时使用浅红背景
      const itemBackground = isMet ? COLORS.background : 'rgba(209, 52, 56, 0.08)';
      const itemBorder = isMet ? COLORS.border : 'rgba(209, 52, 56, 0.4)';

      return (
        <div key={metric.id} style={{
          flex: '0 0 auto',
          minWidth: 140,
          maxWidth: 200,
          padding: SPACING.base,
          borderRadius: BORDER_RADIUS.md,
          background: itemBackground,
          border: `1px solid ${itemBorder}`,
        }}>
            {/* 指标名称 */}
            <div style={{ marginBottom: SPACING.sm }}>
              <Text style={{ fontSize: FONT_SIZES.base, color: COLORS.secondary, fontWeight: 500 }}>{metric.name}</Text>
            </div>

            {/* 数值区域 */}
            <div style={{ marginBottom: SPACING.sm }}>
              {hasValue ? (
                dataSourceLink ? (
                  <a href={dataSourceLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: 600, color: COLORS.text }}>
                      {metric.data_type === 'percentage' ? `${calculatedValue.toFixed(1)}%` : calculatedValue.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.secondary, marginLeft: 4 }}>
                      {metric.unit || ''}
                    </Text>
                  </a>
                ) : (
                  <>
                    <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: 600, color: COLORS.text }}>
                      {metric.data_type === 'percentage' ? `${calculatedValue.toFixed(1)}%` : calculatedValue.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.secondary, marginLeft: 4 }}>
                      {metric.unit || ''}
                    </Text>
                  </>
                )
              ) : (
                <Text style={{ fontSize: FONT_SIZES.xl, fontWeight: 600, color: COLORS.textMuted }}>-</Text>
              )}
            </div>

            {/* 目标 */}
            {metric.target_value !== null && metric.target_value !== undefined && (
              <div style={{ marginBottom: SPACING.xs }}>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textLight }}>
                  目标: {metric.target_value?.toLocaleString()}{metric.unit || ''}
                </Text>
              </div>
            )}

            {/* 环比变化 */}
            {momChange !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textLight }}>环比:</Text>
                <Text style={{ fontSize: FONT_SIZES.sm, color: changeColor, fontWeight: 500 }}>
                  {isPositive ? '+' : ''}{momChange}%
                </Text>
                {isPositive ? (
                  <ArrowUpOutlined style={{ color: changeColor, fontSize: FONT_SIZES.xs }} />
                ) : (
                  <ArrowDownOutlined style={{ color: changeColor, fontSize: FONT_SIZES.xs }} />
                )}
              </div>
            )}
          </div>
        );
    };

    // 渲染维度卡片
    const renderDimensionCard = (dim: Dimension, span: number, dimMetrics?: Metric[]) => {
      const metrics = dimMetrics ?? grouped[dim];
      if (metrics.length === 0) return null;

      const dimConfig = DIMENSION_CONFIG[dim];

      return (
        <Col span={span} key={dim}>
          <Card
            size="small"
            title={
              <Tag color={dimConfig.color} style={{ marginRight: SPACING.sm }}>
                {DIMENSION_LABELS[dim]}
              </Tag>
            }
            style={{ height: '100%' }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{
              display: 'flex',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              gap: SPACING.sm,
              padding: SPACING.sm,
            }}>
              {metrics.map(m => renderMetricItem(m, month ?? new Date().getMonth() + 1))}
            </div>
          </Card>
        </Col>
      );
    };

    // 计算每行中各维度卡片的 span（基于指标数量比例）
    const getSpanForDimension = (metricsCount: number, rowTotal: number): number => {
      if (rowTotal === 0) return 24;
      const ratio = metricsCount / rowTotal;
      return Math.max(4, Math.min(Math.round(ratio * 24), 24));
    };

    const dimensionRows = groupDimensionsIntoRows(grouped, 6);

    return (
      <>
        {dimensionRows.map((row, rowIdx) => {
          const rowTotal = row.reduce((sum, item) => sum + item.metrics.length, 0);
          return (
            <Row key={rowIdx} gutter={SPACING.base} style={{ marginBottom: SPACING.base }}>
              {row.map((item) => {
                const span = getSpanForDimension(item.metrics.length, rowTotal);
                return renderDimensionCard(item.dimension, span, item.metrics);
              })}
            </Row>
          );
        })}
      </>
    );
  };

  // 月度数据表格
  const renderMonthlyData = () => {
    if (loading || metricsData.length === 0) return null;

    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const currentMonth = new Date().getMonth();
    const isCurrentYear = year === new Date().getFullYear();
    const metricsByDimension = getMetricsByDimension();

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
        title: '达标值',
        dataIndex: 'target_value',
        key: 'target_value',
        width: 65,
        render: (target: number | null, record: Metric) => {
          if (target === null || target === undefined) return '-';
          const displayValue = record.unit
            ? `${target.toLocaleString()} ${record.unit}`
            : target.toLocaleString();
          return <Text style={{ fontSize: FONT_SIZES.xs }}>{displayValue}</Text>;
        },
      },
      ...months.map((m, idx) => ({
        title: m,
        key: `month_${idx}`,
        width: 60,
        render: (_: any, record: Metric) => {
          if (isCurrentYear && idx > currentMonth) {
            return <Text style={{ color: COLORS.textMuted, fontSize: FONT_SIZES.xs }}>-</Text>;
          }
          const data = monthlyHistory[record.code]?.[idx + 1];
          const historyData = data !== undefined ? (typeof data === 'object' ? data : { value: data, data_source_link: null }) : null;
          const dataSourceLink = normalizeUrl(historyData?.data_source_link || record.data_source_link);
          const value = data !== undefined ? (typeof data === 'object' ? data.value : data) : undefined;
          if (value === undefined) return <Text style={{ color: COLORS.textMuted, fontSize: FONT_SIZES.xs }}>-</Text>;
          const isMet = record.target_value
            ? record.lower_is_better
              ? value <= record.target_value
              : value >= record.target_value
            : true;
          const displayValue = record.unit ? `${value} ${record.unit}` : value;
          const textEl = (
            <Text style={{
              fontSize: FONT_SIZES.xs,
              color: isMet ? COLORS.text : COLORS.danger,
              fontWeight: isMet ? 'normal' : 600
            }}>
              {displayValue}
            </Text>
          );
          if (dataSourceLink) {
            return <a href={dataSourceLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{textEl}</a>;
          }
          return textEl;
        },
      })),
    ];

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
              <Tag color={dimConfig.color} style={{ marginRight: SPACING.sm }}>
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
          style={{ marginBottom: SPACING.md }}
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
      <div style={{ marginTop: SPACING.xl }}>
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
        style={{ marginBottom: SPACING.base }}
      >
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  const getDimensionStatusCircles = () => {
    const grouped = getMetricsByDimension();

    return (
      <div style={{ display: 'flex', gap: SPACING.md, alignItems: 'center' }}>
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
                fontSize: FONT_SIZES.xs,
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
          <span style={{ marginRight: SPACING.xxl }}>{`产品部指标 - ${year}年${month ? month + '月' : '度'}`}</span>
          {getDimensionStatusCircles()}
        </div>
      }
      style={{ marginBottom: SPACING.base }}
    >
      <Row gutter={SPACING.base}>
        <Col xs={24}>
          {renderDetailData()}
        </Col>
      </Row>

      <Row gutter={SPACING.base}>
        <Col xs={24}>
          {renderMonthlyData()}
        </Col>
      </Row>
    </Card>
  );
};

export default AnnualMetricsCard;