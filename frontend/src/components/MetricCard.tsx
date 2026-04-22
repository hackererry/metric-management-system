/**
 * 指标卡片组件 - 用于看板展示
 */
import React from 'react';
import { Card, Statistic, Tooltip } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Metric } from '../types';
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  createChangeColor,
  TREND_STYLES,
} from '../styles/theme';

interface MetricCardProps {
  metric: Metric;
  currentValue: number | null;
  previousValue?: number | null;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, currentValue, previousValue, onClick }) => {
  // 计算环比变化
  const changeRate = previousValue && previousValue !== 0 && currentValue !== null
    ? ((currentValue - previousValue) / previousValue) * 100
    : null;

  // 格式化显示值
  const formatValue = (value: number | null, dataType: string, unit: string | null): string => {
    if (value === null || value === undefined) return '-';
    if (dataType === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    return unit ? `${value.toLocaleString()} ${unit}` : value.toLocaleString();
  };

  // 判断趋势（根据环比变化）
  const getTrend = (): 'up' | 'down' | 'stable' | null => {
    if (changeRate === null) return null;
    if (changeRate > 0) return 'up';
    if (changeRate < 0) return 'down';
    return 'stable';
  };

  // 趋势图标组件
  const TrendIcon: React.FC = () => {
    const trend = getTrend();
    if (!trend) return null;
    const style = TREND_STYLES[trend];
    if (trend === 'up') {
      return <ArrowUpOutlined style={{ color: style.color }} />;
    }
    if (trend === 'down') {
      return <ArrowDownOutlined style={{ color: style.color }} />;
    }
    return <MinusOutlined style={{ color: style.color }} />;
  };

  // 环比变化颜色
  const changeColor = changeRate !== null
    ? createChangeColor(changeRate, metric.lower_is_better)
    : COLORS.secondary;

  return (
    <Card
      hoverable
      onClick={onClick}
      style={{ height: '100%' }}
      styles={{
        body: { padding: SPACING.base }
      }}
    >
      {/* 指标名称区域 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
      }}>
        <span style={{
            fontSize: FONT_SIZES.md,
            fontWeight: 500,
            color: COLORS.text,
          }}>
            {metric.name}
          </span>
        {metric.description && (
          <Tooltip title={metric.description}>
            <InfoCircleOutlined style={{ color: COLORS.textLight, fontSize: FONT_SIZES.sm }} />
          </Tooltip>
        )}
      </div>

      {/* 当前值区域 */}
      <div style={{ marginBottom: SPACING.sm }}>
        <Statistic
          value={currentValue !== null ? formatValue(currentValue, metric.data_type, metric.unit) : '-'}
          valueStyle={{
            fontSize: FONT_SIZES.xxl,
            fontWeight: 600,
            color: COLORS.text,
          }}
          prefix={<TrendIcon />}
        />
      </div>

      {/* 目标区域 */}
      {metric.target_value && currentValue !== null && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          fontSize: FONT_SIZES.sm,
          color: COLORS.textLight,
        }}>
          <span>目标: {formatValue(metric.target_value, metric.data_type, metric.unit)}</span>
        </div>
      )}

      {/* 环比变化区域 */}
      {changeRate !== null && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xs,
          fontSize: FONT_SIZES.sm,
        }}>
          <span style={{ color: COLORS.textLight }}>环比:</span>
          <span style={{ color: changeColor, fontWeight: 500 }}>
            {changeRate >= 0 ? '+' : ''}{changeRate.toFixed(1)}%
          </span>
          {getTrend() === 'up' && <ArrowUpOutlined style={{ color: changeColor, fontSize: 10 }} />}
          {getTrend() === 'down' && <ArrowDownOutlined style={{ color: changeColor, fontSize: 10 }} />}
          {getTrend() === 'stable' && <MinusOutlined style={{ color: changeColor, fontSize: 10 }} />}
        </div>
      )}
    </Card>
  );
};

export default MetricCard;