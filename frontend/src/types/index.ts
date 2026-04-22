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
  target_value: number | null;
  challenge_value: number | null;
  aggregation_type: AggregationType;
  data_source_link?: string | null;
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
  target_value?: number;
  challenge_value?: number;
  aggregation_type?: AggregationType;
  data_source_link?: string;
  description?: string;
  is_active?: boolean;
  source_configs?: SourceConfigItem[];
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

// 月度历史数据映射: { metricCode: { month(1-12): { value: number, data_source_link?: string } } }
export interface MonthlyHistoryItem {
  value: number;
  data_source_link?: string | null;
}

export interface MonthlyHistoryMap {
  [metricCode: string]: { [month: number]: MonthlyHistoryItem };
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

// 聚合类型
export type AggregationType = 'sum' | 'average';

// 聚合配置
export interface AggregationConfig {
  id: number;
  target_metric_id: number;
  source_metric_id: number;
  aggregation_type: AggregationType;
  weight: number;
}

// 聚合配置创建请求
export interface AggregationConfigCreate {
  target_metric_id: number;
  source_metric_id: number;
  aggregation_type: AggregationType;
  weight?: number;
}

// 聚合配置响应（带指标详情）
export interface AggregationConfigResponse {
  id: number;
  target_metric_id: number;
  source_metric_id: number;
  aggregation_type: string;
  weight: number;
  target_metric?: Metric;
  source_metric?: Metric;
}

// 源指标选项（用于下拉选择）
export interface SourceMetricOption {
  id: number;
  name: string;
  code: string;
  category: Category;
  dimension: Dimension;
  lower_is_better: boolean;
  unit: string | null;
  data_type: DataType;
}

// 来源配置项（内联在创建/编辑指标表单中）
export interface SourceConfigItem {
  source_metric_id: number;
  aggregation_type: AggregationType;
  weight: number;
}
