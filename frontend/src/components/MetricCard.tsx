/**
 * 指标卡片组件 - 用于看板展示
 */
import React from 'react';
import { Card, Statistic, Tag, Tooltip } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Metric, TREND_CONFIG, CATEGORY_CONFIG } from '../types';

interface MetricCardProps {
  metric: Metric;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, onClick }) => {
  // 计算目标完成率
  const completionRate = metric.target_value
    ? ((metric.value / metric.target_value) * 100).toFixed(1)
    : null;

  // 计算环比变化
  const changeRate = metric.previous_value
    ? (((metric.value - metric.previous_value) / metric.previous_value) * 100).toFixed(1)
    : null;

  // 格式化显示值
  const formatValue = (value: number, dataType: string, unit: string | null) => {
    if (dataType === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    return unit ? `${value.toLocaleString()} ${unit}` : value.toLocaleString();
  };

  // 趋势图标
  const TrendIcon = () => {
    if (!metric.trend) return null;
    const config = TREND_CONFIG[metric.trend];
    const iconProps = { style: { color: config.color } };

    switch (metric.trend) {
      case 'up':
        return <ArrowUpOutlined {...iconProps} />;
      case 'down':
        return <ArrowDownOutlined {...iconProps} />;
      case 'stable':
        return <MinusOutlined {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <Card
      hoverable
      onClick={onClick}
      style={{ height: '100%' }}
      styles={{
        body: { padding: '16px' }
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#262626',
          }}
        >
          {metric.name}
        </span>
        {metric.description && (
          <Tooltip title={metric.description}>
            <InfoCircleOutlined style={{ marginLeft: 8, color: '#8c8c8c', fontSize: 12 }} />
          </Tooltip>
        )}
      </div>

      <Statistic
        value={formatValue(metric.value, metric.data_type, metric.unit)}
        valueStyle={{ fontSize: 24, fontWeight: 600 }}
        prefix={<TrendIcon />}
      />

      {/* 目标进度 */}
      {metric.target_value && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
          目标: {formatValue(metric.target_value, metric.data_type, metric.unit)}
          <Tag
            color={Number(completionRate) >= 100 ? 'success' : 'processing'}
            style={{ marginLeft: 8 }}
          >
            {completionRate}%
          </Tag>
        </div>
      )}

      {/* 环比变化 */}
      {changeRate && (
        <div style={{ marginTop: 4, fontSize: 12 }}>
          <span style={{ color: '#8c8c8c' }}>环比: </span>
          <span
            style={{
              color: Number(changeRate) >= 0 ? '#52c41a' : '#ff4d4f',
            }}
          >
            {Number(changeRate) >= 0 ? '+' : ''}{changeRate}%
          </span>
        </div>
      )}
    </Card>
  );
};

export default MetricCard;
