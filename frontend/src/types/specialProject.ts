/**
 * 专项项目相关类型定义
 */

// 项目状态枚举
export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

// 项目状态配置
export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  planning: { label: '规划中', color: '#FFB900' },
  in_progress: { label: '进行中', color: '#107C10' },
  on_hold: { label: '暂停', color: '#CA5010' },
  completed: { label: '已完成', color: '#0078D4' },
  cancelled: { label: '已取消', color: '#D13438' },
};

// 目标接口
export interface SpecialProjectTarget {
  id: number;
  project_id: number;
  target_name: string;
  target_value: number;
  current_value: number;
  unit: string | null;
  weight: number;
  achievement_rate: number;
  created_at: string;
  updated_at: string;
}

// 目标表单数据
export interface SpecialProjectTargetFormData {
  target_name: string;
  target_value: number;
  current_value?: number;
  unit?: string;
  weight?: number;
}

// 专项项目接口
export interface SpecialProject {
  id: number;
  sub_project: string;
  responsible_person: string;
  project_manager: string;
  budget_person_days: number;
  budget_used_days: number;
  budget_usage_percent: number;
  status: ProjectStatus;
  remarks: string | null;
  targets: SpecialProjectTarget[];
  created_at: string;
  updated_at: string;
}

// 专项项目表单数据
export interface SpecialProjectFormData {
  sub_project: string;
  responsible_person: string;
  project_manager: string;
  budget_person_days: number;
  budget_used_days?: number;
  status: ProjectStatus;
  remarks?: string;
  targets: SpecialProjectTargetFormData[];
}

// 专项项目列表响应
export interface SpecialProjectListResponse {
  total: number;
  items: SpecialProject[];
}

// 预算使用进度条props
export interface BudgetProgressBarProps {
  budgetPersonDays: number;
  budgetUsedDays: number;
  budgetUsagePercent: number;
  showLabel?: boolean;
  showPercent?: boolean;
  size?: 'small' | 'default' | 'large';
}
