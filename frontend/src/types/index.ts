/**
 * 类型定义
 */

export type DataType = 'number' | 'percentage' | 'trend';
export type Category = 'overview' | 'product_a' | 'product_b' | 'product_c' | 'product_d';
export type Trend = 'up' | 'down' | 'stable';
export type MetricType = 'business' | 'tech';

export interface Metric {
  id: number;
  name: string;
  code: string;
  category: Category;
  metric_type: MetricType;
  data_type: DataType;
  unit: string | null;
  value: number;
  target_value: number | null;
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
  metric_type?: MetricType;
  data_type: DataType;
  unit?: string;
  value: number;
  target_value?: number;
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
  business: Metric[];
  tech: Metric[];
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

// 分类配置
export const CATEGORY_CONFIG: Record<Category, { label: string; color: string }> = {
  overview: { label: '总览', color: '#1890ff' },
  product_a: { label: '导购产品', color: '#52c41a' },
  product_b: { label: '交易产品', color: '#faad14' },
  product_c: { label: '智选车产品', color: '#722ed1' },
  product_d: { label: '公告产品', color: '#1890ff' },
};

// 数据类型配置
export const DATA_TYPE_CONFIG: Record<DataType, { label: string }> = {
  number: { label: '数值' },
  percentage: { label: '百分比' },
  trend: { label: '趋势' },
};

// 趋势配置
export const TREND_CONFIG: Record<Trend, { label: string; color: string; icon: string }> = {
  up: { label: '上升', color: '#52c41a', icon: '↑' },
  down: { label: '下降', color: '#ff4d4f', icon: '↓' },
  stable: { label: '持平', color: '#8c8c8c', icon: '→' },
};

// 指标类型配置
export const METRIC_TYPE_CONFIG: Record<MetricType, { label: string; color: string }> = {
  business: { label: '业务指标', color: '#1890ff' },
  tech: { label: '研发指标', color: '#722ed1' },
};
