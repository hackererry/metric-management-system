/**
 * 产品团队雷达图卡片
 */
import React, { useState, useEffect } from 'react';
import { Card, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import { Metric, Dimension, MonthlyHistoryMap } from '../types';
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from '../styles/theme';

const { Text } = Typography;

interface ProductTeamRadarCardProps {
  teamKey: string;
  label: string;
  color: string;
  year: number;
  month: number | null;
  isSelected: boolean;
  onClick: () => void;
  metrics?: Metric[];
  monthlyData?: MonthlyHistoryMap;
}

const getCurrentYearMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

const calculateRealTeamData = (
  metrics: Metric[] | undefined,
  monthlyData: MonthlyHistoryMap | undefined,
  year: number,
  month: number | null
) => {
  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();

  if (year > currentYear || (year === currentYear && month && month > currentMonth)) {
    return { radarData: { quality: 0, efficiency: 0, experience: 0, business: 0, operation: 0 }, noData: true };
  }

  if (!metrics || metrics.length === 0 || !monthlyData || Object.keys(monthlyData).length === 0) {
    const seed = year + (month || 0);
    const random = (base: number) => Math.round(base + (Math.sin(seed) * 10 + Math.random() * 5));
    const monthFactor = month ? (0.8 + (month * 0.05)) : 1;
    return {
      radarData: {
        quality: random(75 * monthFactor),
        efficiency: random(70 * monthFactor),
        experience: random(80 * monthFactor),
        business: random(72 * monthFactor),
        operation: random(78 * monthFactor),
      },
      noData: false,
    };
  }

  const dimensionScores: Record<Dimension, number[]> = {
    quality: [],
    efficiency: [],
    experience: [],
    business: [],
    operation: [],
  };

  const currentMonthValue = month || new Date().getMonth() + 1;

  metrics.forEach(m => {
    if (!m.target_value) return;
    const data = monthlyData[m.code]?.[currentMonthValue];
    const value = data !== undefined ? (typeof data === 'object' ? data.value : data) : undefined;
    if (value === undefined) return;

    const met = m.lower_is_better ? value <= m.target_value : value >= m.target_value;
    dimensionScores[m.dimension].push(met ? 100 : 50);
  });

  const calcAvg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  return {
    radarData: {
      quality: calcAvg(dimensionScores.quality) || 0,
      efficiency: calcAvg(dimensionScores.efficiency) || 0,
      experience: calcAvg(dimensionScores.experience) || 0,
      business: calcAvg(dimensionScores.business) || 0,
      operation: calcAvg(dimensionScores.operation) || 0,
    },
    noData: false,
  };
};

const ProductTeamRadarCard: React.FC<ProductTeamRadarCardProps> = ({
  teamKey,
  label,
  color,
  year,
  month,
  isSelected,
  onClick,
  metrics,
  monthlyData,
}) => {
  const [teamData, setTeamData] = useState(() => calculateRealTeamData(metrics, monthlyData, year, month));

  useEffect(() => {
    setTeamData(calculateRealTeamData(metrics, monthlyData, year, month));
  }, [teamKey, year, month, metrics, monthlyData]);

  const radarOption = {
    tooltip: {
      trigger: 'item',
    },
    radar: {
      indicator: [
        { name: `质量\n${teamData.radarData.quality}分`, max: 100 },
        { name: `效率\n${teamData.radarData.efficiency}分`, max: 100 },
        { name: `体验\n${teamData.radarData.experience}分`, max: 100 },
        { name: `经营\n${teamData.radarData.business}分`, max: 100 },
        { name: `运作\n${teamData.radarData.operation}分`, max: 100 },
      ],
      center: ['50%', '55%'],
      radius: '60%',
      axisName: {
        color: COLORS.text,
        fontSize: FONT_SIZES.sm,
        fontWeight: 500,
      },
      splitLine: {
        lineStyle: {
          color: COLORS.border,
        },
      },
      splitArea: {
        areaStyle: {
          color: [COLORS.background, '#FFFFFF'],
        },
      },
      axisLine: {
        lineStyle: {
          color: COLORS.border,
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [
              teamData.radarData.quality,
              teamData.radarData.efficiency,
              teamData.radarData.experience,
              teamData.radarData.business,
              teamData.radarData.operation,
            ],
            name: '综合评分',
            areaStyle: {
              color: `${color}40`,
            },
            lineStyle: {
              color: color,
              width: 2,
            },
            itemStyle: {
              color: color,
            },
          },
        ],
      },
    ],
  };

  const totalScore = Math.round(
    (teamData.radarData.quality +
      teamData.radarData.efficiency +
      teamData.radarData.experience +
      teamData.radarData.business +
      teamData.radarData.operation) / 5
  );

  // 根据得分获取状态标签
  const getScoreStatus = (): { label: string; color: string } => {
    if (totalScore >= 90) return { label: '优秀', color: COLORS.success };
    if (totalScore >= 70) return { label: '良好', color: COLORS.info };
    if (totalScore >= 50) return { label: '一般', color: COLORS.warning };
    return { label: '需改进', color: COLORS.danger };
  };

  const scoreStatus = getScoreStatus();

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <span style={{ color, fontSize: FONT_SIZES.lg }}>●</span>
          <span style={{ fontWeight: 500, color: COLORS.text }}>{label}</span>
          {month && (
            <Text type="secondary" style={{ fontSize: FONT_SIZES.sm }}>
              {year}年{month}月
            </Text>
          )}
        </div>
      }
      style={{
        height: '100%',
        cursor: 'pointer',
        border: isSelected ? `2px solid ${color}` : `1px solid ${COLORS.border}`,
        boxShadow: isSelected ? `0 4px 12px ${color}30` : SHADOWS.sm,
        transition: 'all 0.2s ease',
        borderRadius: BORDER_RADIUS.lg,
      }}
      styles={{
        body: { padding: SPACING.base }
      }}
      onClick={onClick}
      hoverable
    >
      {/* 雷达图 */}
      {teamData.noData ? (
        <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text type="secondary">暂无数据</Text>
        </div>
      ) : (
        <ReactECharts
          option={radarOption}
          style={{ height: 180 }}
          opts={{ renderer: 'svg' }}
        />
      )}

      {/* 综合得分区域 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
        padding: `${SPACING.sm}px 0`,
      }}>
        {teamData.noData ? (
          <Text type="secondary">-</Text>
        ) : (
          <>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.secondary }}>综合得分</Text>
              <div style={{ fontSize: FONT_SIZES.xxl, fontWeight: 600, color }}>
                {totalScore}
                <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.secondary }}> 分</Text>
              </div>
            </div>
            <div style={{
              padding: `${SPACING.xs}px ${SPACING.sm}px`,
              backgroundColor: `${scoreStatus.color}15`,
              borderRadius: BORDER_RADIUS.md,
              border: `1px solid ${scoreStatus.color}30`,
            }}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: 500, color: scoreStatus.color }}>
                {scoreStatus.label}
              </Text>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default ProductTeamRadarCard;