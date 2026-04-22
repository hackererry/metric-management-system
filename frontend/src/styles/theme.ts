/**
 * 主题样式常量 - 统一管理颜色、字体、间距等
 */

import { Trend, Dimension } from '../types';

// 颜色系统
export const COLORS = {
  // 状态色
  success: '#107C10',
  warning: '#FFB900',
  danger: '#D13438',
  info: '#0078D4',

  // 趋势色
  trendUp: '#107C10',
  trendDown: '#D13438',
  trendStable: '#605E5C',

  // 中性色
  primary: '#0078D4',
  secondary: '#605E5C',
  text: '#323130',
  textLight: '#8c8c8c',
  textMuted: '#C8C6C4',

  // 背景与边框
  background: '#FAF9F8',
  backgroundAlt: '#F5F5F5',
  border: '#E1DFDD',
  borderLight: '#D2D0CE',

  // 维度的预设颜色（可覆盖）
  dimension: {
    quality: '#0078D4',
    efficiency: '#107C10',
    experience: '#5C2D91',
    business: '#004578',
    operation: '#CA5010',
  },

  // 类别的预设颜色
  category: {
    overview: '#0078D4',
    product_a: '#106EBE',
    product_b: '#005A9E',
    product_c: '#2B88D8',
    product_d: '#004578',
  },
};

// 字体大小
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  base: 13,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

// 间距
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

// 圆角
export const BORDER_RADIUS = {
  sm: 4,
  md: 6,
  lg: 8,
};

// 阴影
export const SHADOWS = {
  sm: '0 1.6px 3.6px rgba(0, 0, 0, 0.04), 0 3.2px 7.2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 12px rgba(0, 0, 0, 0.08)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
};

// 趋势配置（整合到主题）
export const TREND_STYLES: Record<Trend, { color: string; icon: string }> = {
  up: { color: COLORS.trendUp, icon: '↑' },
  down: { color: COLORS.trendDown, icon: '↓' },
  stable: { color: COLORS.trendStable, icon: '→' },
};

// 维度配置（整合到主题）
export const DIMENSION_STYLES: Record<Dimension, { label: string; color: string }> = {
  quality: { label: '质量', color: COLORS.dimension.quality },
  efficiency: { label: '效率', color: COLORS.dimension.efficiency },
  experience: { label: '体验', color: COLORS.dimension.experience },
  business: { label: '经营', color: COLORS.dimension.business },
  operation: { label: '运作', color: COLORS.dimension.operation },
};

// 状态配置（用于 AnnualMetricsCard）
export const STATUS_CONFIG = {
  green: { color: COLORS.success, label: '全部达标' },
  yellow: { color: COLORS.warning, label: '部分达标' },
  red: { color: COLORS.danger, label: '全部未达标' },
  none: { color: COLORS.textMuted, label: '暂无数据' },
};

// 通用样式工厂函数
export const createTrendColor = (trend: Trend | null): string => {
  if (!trend) return COLORS.secondary;
  return TREND_STYLES[trend].color;
};

export const createChangeColor = (change: number, lowerIsBetter: boolean): string => {
  const isPositive = change > 0;
  const isGood = lowerIsBetter ? !isPositive : isPositive;
  return isGood ? COLORS.success : COLORS.danger;
};

export const createStatusColor = (met: boolean): string => {
  return met ? COLORS.success : COLORS.danger;
};