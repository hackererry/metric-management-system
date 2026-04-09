/**
 * 维度月度视图组件 - 支持三种展示模式：当月数据、12月列表、12月折线图
 */
import React, { useState } from 'react';
import { Card, Table, Tag, Radio, Typography, Empty } from 'antd';
import { Metric, Dimension, DIMENSION_CONFIG, MonthlyHistoryMap } from '../types';
import MonthlyLineChart from './MonthlyLineChart';

const { Text } = Typography;

interface DimensionMonthlyViewProps {
  dimension: Dimension;
  metrics: Metric[];
  monthlyData: MonthlyHistoryMap;
  year: number;
}

type ViewMode = 'current' | 'table' | 'chart';

const DimensionMonthlyView: React.FC<DimensionMonthlyViewProps> = ({
  dimension,
  metrics,
  monthlyData,
  year,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('current');

  const config = DIMENSION_CONFIG[dimension];

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
    const trendConfig: Record<string, { color: string; label: string; icon: string }> = {
      up: { color: '#107C10', label: '上升', icon: '↑' },
      down: { color: '#D13438', label: '下降', icon: '↓' },
      stable: { color: '#605E5C', label: '持平', icon: '→' },
    };
    const c = trendConfig[trend];
    return <Tag color={c.color}>{c.icon} {c.label}</Tag>;
  };

  // 当月数据列定义
  const currentColumns = [
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '指标定义',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (text: string | null) => text || '-',
    },
    {
      title: '实际值',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      render: (_: any, record: Metric) => (
        <Text strong style={{ color: record.target_value && record.value < record.target_value ? '#D13438' : '#107C10' }}>
          {formatValue(record)}
        </Text>
      ),
    },
    {
      title: '达标值',
      dataIndex: 'target_value',
      key: 'target_value',
      width: 100,
      render: (_: any, record: Metric) => {
        if (!record.target_value) return '-';
        return record.unit
          ? `${record.target_value.toLocaleString()} ${record.unit}`
          : record.target_value.toLocaleString();
      },
    },
    {
      title: '挑战值',
      dataIndex: 'challenge_value',
      key: 'challenge_value',
      width: 100,
      render: (_: any, record: Metric) => {
        if (!record.challenge_value) return '-';
        return record.unit
          ? `${record.challenge_value.toLocaleString()} ${record.unit}`
          : record.challenge_value.toLocaleString();
      },
    },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      width: 80,
      render: (trend: string) => getTrendTag(trend),
    },
  ];

  // 12月列表列定义
  const monthlyColumns = [
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      fixed: 'left' as const,
    },
    ...Array.from({ length: 12 }, (_, i) => ({
      title: `${i + 1}月`,
      key: `month_${i + 1}`,
      width: 80,
      render: (_: any, record: Metric) => {
        const value = monthlyData[record.code]?.[i + 1];
        if (value === undefined || value === null) return <Text type="secondary">-</Text>;
        // 根据是否达标着色
        const isMet = record.target_value
          ? record.lower_is_better ? value <= record.target_value : value >= record.target_value
          : true;
        return (
          <Text style={{ color: isMet ? '#107C10' : '#D13438', fontSize: 12 }}>
            {record.data_type === 'percentage' ? `${value.toFixed(1)}%` : value.toLocaleString()}
          </Text>
        );
      },
    })),
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <Tag color={config.color}>{config.label}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>({metrics.length}个指标)</Text>
          </span>
          <Radio.Group
            size="small"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <Radio.Button value="current">当月数据</Radio.Button>
            <Radio.Button value="table">12月列表</Radio.Button>
            <Radio.Button value="chart">12月折线</Radio.Button>
          </Radio.Group>
        </div>
      }
      style={{ marginBottom: 16 }}
      size="small"
    >
      {metrics.length === 0 ? (
        <Empty description={`暂无${config.label}维度指标`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <>
          {viewMode === 'current' && (
            <Table
              columns={currentColumns}
              dataSource={metrics}
              rowKey="id"
              pagination={false}
              size="small"
            />
          )}
          {viewMode === 'table' && (
            <Table
              columns={monthlyColumns}
              dataSource={metrics}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 1080 }}
            />
          )}
          {viewMode === 'chart' && (
            <MonthlyLineChart
              metrics={metrics}
              monthlyData={monthlyData}
              year={year}
              dimension={dimension}
            />
          )}
        </>
      )}
    </Card>
  );
};

export default DimensionMonthlyView;
