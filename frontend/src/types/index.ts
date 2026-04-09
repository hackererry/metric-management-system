/**
 * 类型定义
 */

export type DataType = 'number' | 'percentage' | 'trend';
export type Category = 'overview' | 'product_a' | 'product_b' | 'product_c' | 'product_d';
export type Trend = 'up' | 'down' | 'stable';
export type Dimension = 'quality' | 'efficiency' | 'experience' | 'business' | 'operation';

export interface Metric {
  id: number;
  name: string;
  code: string;
  category: Category;
  data_type: DataType;
  dimension: Dimension;
  lower_is_better: boolean;
  unit: string | null;
  value: number;
  target_value: number | null;
  challenge_value: number | null;
  previous_value: number | null;
  trend: Trend | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetricFormData {
  name: string;
  code: string;
  category: Category;
  data_type: DataType;
  dimension: Dimension;
  lower_is_better?: boolean;
  unit?: string;
  value: number;
  target_value?: number;
  challenge_value?: number;
  previous_value?: number;
  trend?: Trend;
  description?: string;
  is_active?: boolean;
}

export interface MetricListResponse {
  total: number;
  items: Metric[];
}

export interface MetricGroupedResponse {
  [dimension: string]: Metric[];
}

export interface CategoryStats {
  overview: { total: number; active: number };
  product_a: { total: number; active: number };
  product_b: { total: number; active: number };
  product_c: { total: number; active: number };
  product_d: { total: number; active: number };
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

// 月度历史数据映射: { metricCode: { month(1-12): value } }
export interface MonthlyHistoryMap {
  [metricCode: string]: { [month: number]: number };
}

// 分类配置 - 科技蓝主题色系
export const CATEGORY_CONFIG: Record<Category, { label: string; color: string }> = {
  overview: { label: '总览', color: '#0078D4' },
  product_a: { label: '导购产品', color: '#106EBE' },
  product_b: { label: '交易产品', color: '#005A9E' },
  product_c: { label: '智选车产品', color: '#2B88D8' },
  product_d: { label: '公告产品', color: '#004578' },
};

// 数据类型配置
export const DATA_TYPE_CONFIG: Record<DataType, { label: string }> = {
  number: { label: '数值' },
  percentage: { label: '百分比' },
  trend: { label: '趋势' },
};

// 趋势配置
export const TREND_CONFIG: Record<Trend, { label: string; color: string; icon: string }> = {
  up: { label: '上升', color: '#107C10', icon: '↑' },
  down: { label: '下降', color: '#D13438', icon: '↓' },
  stable: { label: '持平', color: '#605E5C', icon: '→' },
};

// 维度配置
export const DIMENSION_CONFIG: Record<Dimension, { label: string; color: string }> = {
  quality: { label: '质量', color: '#0078D4' },
  efficiency: { label: '效率', color: '#107C10' },
  experience: { label: '体验', color: '#5C2D91' },
  business: { label: '经营', color: '#004578' },
  operation: { label: '运作', color: '#CA5010' },
};
