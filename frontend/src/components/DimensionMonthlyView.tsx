/**
 * 维度月度视图组件 - 支持三种展示模式：当月数据、12月列表、12月折线图
 */
import React, { useState } from 'react';
import { Card, Table, Tag, Radio, Typography, Empty } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { Metric, Dimension, DIMENSION_CONFIG, MonthlyHistoryMap } from '../types';
import MonthlyLineChart from './MonthlyLineChart';

const { Text } = Typography;

// 补全 URL 协议前缀
const normalizeUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
};

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

  // 当月数据列定义
  const currentMonth = new Date().getMonth() + 1;
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
      render: (_: any, record: Metric) => {
        const data = monthlyData[record.code]?.[currentMonth];
        const historyData = data !== undefined ? (typeof data === 'object' ? data : { value: data, data_source_link: null }) : null;
        const dataSourceLink = normalizeUrl(historyData?.data_source_link || record.data_source_link);
        const value = data !== undefined ? (typeof data === 'object' ? data.value : data) : undefined;
        if (value === undefined || value === null) return <Text type="secondary">-</Text>;
        const isMet = record.target_value
          ? record.lower_is_better ? value <= record.target_value : value >= record.target_value
          : true;
        const displayValue = record.data_type === 'percentage'
          ? `${value.toFixed(1)}%`
          : record.unit ? `${value.toLocaleString()} ${record.unit}` : value.toLocaleString();
        const textEl = (
          <Text strong style={{ color: isMet ? '#107C10' : '#D13438' }}>
            {displayValue}
          </Text>
        );
        if (dataSourceLink) {
          return <a href={dataSourceLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{textEl}</a>;
        }
        return textEl;
      },
    },
    {
      title: '达标值',
      dataIndex: 'target_value',
      key: 'target_value',
      width: 100,
      render: (_: any, record: Metric) => {
        if (record.target_value === null || record.target_value === undefined) return '-';
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
        if (record.challenge_value === null || record.challenge_value === undefined) return '-';
        return record.unit
          ? `${record.challenge_value.toLocaleString()} ${record.unit}`
          : record.challenge_value.toLocaleString();
      },
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
        const data = monthlyData[record.code]?.[i + 1];
        const historyData = data !== undefined ? (typeof data === 'object' ? data : { value: data, data_source_link: null }) : null;
        const dataSourceLink = normalizeUrl(historyData?.data_source_link || record.data_source_link);
        const value = data !== undefined ? (typeof data === 'object' ? data.value : data) : undefined;
        if (value === undefined || value === null) return <Text type="secondary">-</Text>;
        // 根据是否达标着色
        const isMet = record.target_value
          ? record.lower_is_better ? value <= record.target_value : value >= record.target_value
          : true;
        const textEl = (
          <Text style={{ color: isMet ? '#107C10' : '#D13438', fontSize: 12 }}>
            {record.data_type === 'percentage' ? `${value.toFixed(1)}%` : value.toLocaleString()}
          </Text>
        );
        if (dataSourceLink) {
          return <a href={dataSourceLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{textEl}</a>;
        }
        return textEl;
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
            <Radio.Button value="table">表格</Radio.Button>
            <Radio.Button value="chart">折线图</Radio.Button>
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
