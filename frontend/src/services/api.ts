/**
 * API服务 - 与后端交互
 */
import axios from 'axios';
import {
  Metric,
  MetricFormData,
  MetricListResponse,
  MetricGroupedResponse,
  CategoryStats,
  Category,
  MetricType,
  Project,
  ProjectFormData,
  ProjectListResponse,
  ProjectMetric,
  ProjectMetricFormData,
  ProjectStats
} from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
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
    metric_type?: MetricType;
    is_active?: boolean;
    keyword?: string;
  }): Promise<MetricListResponse> => {
    const response = await api.get<MetricListResponse>('/metrics/', { params });
    return response.data;
  },

  /**
   * 获取单个指标
   */
  getById: async (id: number): Promise<Metric> => {
    const response = await api.get<Metric>(`/metrics/${id}`);
    return response.data;
  },

  /**
   * 创建指标
   */
  create: async (data: MetricFormData): Promise<Metric> => {
    const response = await api.post<Metric>('/metrics/', data);
    return response.data;
  },

  /**
   * 更新指标
   */
  update: async (id: number, data: Partial<MetricFormData>): Promise<Metric> => {
    const response = await api.put<Metric>(`/metrics/${id}`, data);
    return response.data;
  },

  /**
   * 删除指标
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/metrics/${id}`);
  },

  /**
   * 按分类获取指标
   */
  getByCategory: async (category: Category, metricType?: MetricType): Promise<Metric[]> => {
    const params = metricType ? { metric_type: metricType } : {};
    const response = await api.get<Metric[]>(`/metrics/category/${category}`, { params });
    return response.data;
  },

  /**
   * 按分类获取分组指标（业务指标/研发指标分开）
   */
  getByCategoryGrouped: async (category: Category): Promise<MetricGroupedResponse> => {
    const response = await api.get<MetricGroupedResponse>(`/metrics/category/${category}/grouped`);
    return response.data;
  },

  /**
   * 获取分类统计
   */
  getCategoryStats: async (): Promise<CategoryStats> => {
    const response = await api.get<{ data: CategoryStats }>('/metrics/stats');
    return response.data.data;
  },

  /**
   * 批量更新指标值
   */
  batchUpdate: async (updates: Record<string, number>): Promise<number> => {
    const response = await api.post<{ message: string }>('/metrics/batch-update', updates);
    return response.status;
  },
};

// 项目 API 服务
export const projectApi = {
  /**
   * 获取项目列表
   */
  getList: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    keyword?: string;
  }): Promise<ProjectListResponse> => {
    const response = await api.get<ProjectListResponse>('/projects/', { params });
    return response.data;
  },

  /**
   * 获取单个项目
   */
  getById: async (id: number): Promise<Project> => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  /**
   * 创建项目
   */
  create: async (data: ProjectFormData): Promise<Project> => {
    const response = await api.post<Project>('/projects/', data);
    return response.data;
  },

  /**
   * 更新项目
   */
  update: async (id: number, data: Partial<ProjectFormData>): Promise<Project> => {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  /**
   * 删除项目
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  /**
   * 获取项目下所有指标
   */
  getMetrics: async (projectId: number): Promise<ProjectMetric[]> => {
    const response = await api.get<{ data: ProjectMetric[] }>(`/projects/${projectId}/metrics`);
    return response.data.data;
  },

  /**
   * 添加指标到项目
   */
  addMetric: async (projectId: number, data: ProjectMetricFormData): Promise<ProjectMetric> => {
    const response = await api.post<ProjectMetric>(`/projects/${projectId}/metrics`, data);
    return response.data;
  },

  /**
   * 从项目移除指标
   */
  removeMetric: async (projectId: number, metricId: number): Promise<void> => {
    await api.delete(`/projects/${projectId}/metrics/${metricId}`);
  },

  /**
   * 获取项目统计
   */
  getStats: async (projectId: number): Promise<ProjectStats> => {
    const response = await api.get<ProjectStats>(`/projects/${projectId}/stats`);
    return response.data;
  },
};

export default api;
