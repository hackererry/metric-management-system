/**
 * API服务 - 与后端交互（统一 POST）
 */
import axios from 'axios';
import {
  Metric,
  MetricFormData,
  MetricListResponse,
  MetricGroupedResponse,
  CategoryStats,
  Category,
  MonthlyHistoryMap,
  AggregationConfigCreate,
  AggregationConfigResponse,
  SourceMetricOption,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export const metricApi = {
  /**
   * 获取指标列表
   */
  getList: async (params?: {
    skip?: number;
    limit?: number;
    category?: Category;
    is_active?: boolean;
    keyword?: string;
  }): Promise<MetricListResponse> => {
    const response = await api.post<MetricListResponse>('/metrics/list', params || {});
    return response.data;
  },

  /**
   * 获取单个指标
   */
  getById: async (id: number): Promise<Metric> => {
    const response = await api.post<Metric>('/metrics/get', { id });
    return response.data;
  },

  /**
   * 创建指标
   */
  create: async (data: MetricFormData): Promise<Metric> => {
    const response = await api.post<Metric>('/metrics/create', data);
    return response.data;
  },

  /**
   * 更新指标
   */
  update: async (id: number, data: Partial<MetricFormData>): Promise<Metric> => {
    const response = await api.post<Metric>('/metrics/update', { id, ...data });
    return response.data;
  },

  /**
   * 删除指标
   */
  delete: async (id: number): Promise<void> => {
    await api.post('/metrics/delete', { id });
  },

  /**
   * 按分类获取指标
   */
  getByCategory: async (category: Category): Promise<Metric[]> => {
    const response = await api.post<Metric[]>('/metrics/category/query', { category });
    return response.data;
  },

  /**
   * 按分类获取分组指标（按维度分组）
   */
  getByCategoryGrouped: async (category: Category): Promise<MetricGroupedResponse> => {
    const response = await api.post<MetricGroupedResponse>('/metrics/category/grouped', { category });
    return response.data;
  },

  /**
   * 获取分类统计
   */
  getCategoryStats: async (): Promise<CategoryStats> => {
    const response = await api.post<{ data: CategoryStats }>('/metrics/stats', {});
    return response.data.data;
  },

  /**
   * 批量更新指标值
   */
  batchUpdate: async (updates: Record<string, number>): Promise<number> => {
    const response = await api.post<{ message: string }>('/metrics/batch-update', updates);
    return response.status;
  },

  /**
   * 获取分类月度历史数据
   */
  getMonthlyHistory: async (category: Category, year: number): Promise<MonthlyHistoryMap> => {
    const response = await api.post<MonthlyHistoryMap>('/metrics/history/query', { category, year });
    return response.data;
  },

  /**
   * 批量写入月度历史
   */
  batchCreateHistory: async (records: { metric_id: number; year: number; month: number; value: number }[]): Promise<void> => {
    await api.post('/metrics/history/batch', records);
  },

  // ============ 聚合配置 API ============

  /**
   * 创建聚合配置
   */
  createAggregationConfig: async (data: AggregationConfigCreate): Promise<AggregationConfigResponse> => {
    const response = await api.post<AggregationConfigResponse>('/metrics/aggregation/config/create', data);
    return response.data;
  },

  /**
   * 获取聚合配置列表
   */
  getAggregationConfigs: async (targetMetricId?: number): Promise<AggregationConfigResponse[]> => {
    const response = await api.post<{ data: AggregationConfigResponse[] }>('/metrics/aggregation/config/list', {}, {
      params: targetMetricId ? { target_metric_id: targetMetricId } : undefined,
    });
    return response.data.data || [];
  },

  /**
   * 删除聚合配置
   */
  deleteAggregationConfig: async (id: number): Promise<void> => {
    await api.post('/metrics/aggregation/config/delete', { id });
  },

  /**
   * 计算聚合值
   */
  computeAggregatedValue: async (metricId: number): Promise<number> => {
    const response = await api.post<{ data: { value: number } }>('/metrics/aggregation/compute', { metric_id: metricId });
    return response.data.data.value;
  },

  /**
   * 重新计算所有聚合指标
   */
  recomputeAllAggregations: async (): Promise<number> => {
    const response = await api.post<{ message: string }>('/metrics/aggregation/recompute');
    return response.status;
  },

  /**
   * 获取可选的源指标列表（用于聚合配置）
   */
  getSourceMetricOptions: async (dimension?: string): Promise<SourceMetricOption[]> => {
    const response = await api.post<SourceMetricOption[]>('/metrics/aggregation/source-options', {}, {
      params: dimension ? { dimension } : undefined,
    });
    return response.data;
  },
};

export default api;
