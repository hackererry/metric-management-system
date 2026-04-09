/**
 * 专项项目 API 服务（统一 POST）
 */
import api from './api';
import { SpecialProject, SpecialProjectFormData, SpecialProjectListResponse, SpecialProjectTargetFormData } from '../types/specialProject';

export const specialProjectApi = {
  /**
   * 获取专项项目列表
   */
  getList: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    keyword?: string;
  }): Promise<SpecialProjectListResponse> => {
    const response = await api.post<SpecialProjectListResponse>('/special-projects/list', params || {});
    return response.data;
  },

  /**
   * 获取单个专项项目
   */
  getById: async (id: number): Promise<SpecialProject> => {
    const response = await api.post<SpecialProject>('/special-projects/get', { id });
    return response.data;
  },

  /**
   * 创建专项项目
   */
  create: async (data: SpecialProjectFormData): Promise<SpecialProject> => {
    const response = await api.post<SpecialProject>('/special-projects/create', data);
    return response.data;
  },

  /**
   * 更新专项项目
   */
  update: async (id: number, data: Partial<SpecialProjectFormData>): Promise<SpecialProject> => {
    const response = await api.post<SpecialProject>('/special-projects/update', { id, ...data });
    return response.data;
  },

  /**
   * 删除专项项目
   */
  delete: async (id: number): Promise<void> => {
    await api.post('/special-projects/delete', { id });
  },

  /**
   * 更新预算使用
   */
  updateBudget: async (id: number, usedDays: number): Promise<SpecialProject> => {
    const response = await api.post<SpecialProject>('/special-projects/budget/update', { id, used_days: usedDays });
    return response.data;
  },

  /**
   * 创建目标
   */
  createTarget: async (projectId: number, target: SpecialProjectTargetFormData): Promise<any> => {
    const response = await api.post('/special-projects/targets/create', { project_id: projectId, ...target });
    return response.data;
  },

  /**
   * 更新目标
   */
  updateTarget: async (projectId: number, targetId: number, target: Partial<SpecialProjectTargetFormData>): Promise<any> => {
    const response = await api.post('/special-projects/targets/update', { project_id: projectId, target_id: targetId, ...target });
    return response.data;
  },

  /**
   * 删除目标
   */
  deleteTarget: async (projectId: number, targetId: number): Promise<void> => {
    await api.post('/special-projects/targets/delete', { project_id: projectId, target_id: targetId });
  },

  /**
   * 更新目标进度
   */
  updateTargetProgress: async (projectId: number, targetId: number, currentValue: number): Promise<any> => {
    const response = await api.post('/special-projects/targets/progress', { project_id: projectId, target_id: targetId, current_value: currentValue });
    return response.data;
  },
};

export default specialProjectApi;
