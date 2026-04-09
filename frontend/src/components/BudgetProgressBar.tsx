/**
 * 预算使用进度条组件
 */
import React from 'react';
import { Progress, Typography, Space } from 'antd';
import { BudgetProgressBarProps } from '../types/specialProject';

const { Text } = Typography;

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  budgetPersonDays,
  budgetUsedDays,
  budgetUsagePercent,
  showLabel = true,
  showPercent = false,
  size = 'default',
}) => {
  // 根据使用百分比确定颜色
  const getStrokeColor = (percent: number): string => {
    if (percent >= 100) return '#D13438';  // 超支 - 红色
    if (percent >= 80) return '#FFB900';   // 警戒 - 黄色
    return '#107C10';                       // 正常 - 绿色
  };

  const strokeColor = getStrokeColor(budgetUsagePercent);

  const getProgressSize = (): "small" | "default" | [number, number] | undefined => {
    if (size === 'small') return 'small';
    if (size === 'large') return [160, 12] as [number, number];
    return [160, 8] as [number, number];
  };

  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Progress
          percent={Math.min(budgetUsagePercent, 100)}
          strokeColor={strokeColor}
          size={getProgressSize()}
          showInfo={false}
          style={{ flex: 1 }}
        />
        {showPercent && (
          <Text style={{ fontSize: 12, color: strokeColor, minWidth: 40 }}>
            {budgetUsagePercent}%
          </Text>
        )}
      </div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            已使用: {budgetUsedDays} 人天
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            预算: {budgetPersonDays} 人天
          </Text>
        </div>
      )}
    </Space>
  );
};

export default BudgetProgressBar;
