"""专项项目 Pydantic 模型"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ProjectStatusEnum(str, Enum):
    """项目状态枚举"""
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# ============ 目标 Schema ============

class SpecialProjectTargetBase(BaseModel):
    """目标基础模型"""
    target_name: str = Field(..., min_length=1, max_length=100, description="目标名称")
    target_value: float = Field(..., description="目标值")
    current_value: float = Field(0, description="当前值")
    unit: Optional[str] = Field(None, max_length=20, description="单位")
    weight: float = Field(1.0, ge=0, le=1, description="权重")


class SpecialProjectTargetCreate(SpecialProjectTargetBase):
    """创建目标请求模型"""
    pass


class SpecialProjectTargetUpdate(BaseModel):
    """更新目标请求模型"""
    target_name: Optional[str] = Field(None, min_length=1, max_length=100)
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = Field(None, max_length=20)
    weight: Optional[float] = Field(None, ge=0, le=1)


class SpecialProjectTargetResponse(SpecialProjectTargetBase):
    """目标响应模型"""
    id: int
    project_id: int
    achievement_rate: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ 项目 Schema ============

class SpecialProjectBase(BaseModel):
    """项目基础模型"""
    sub_project: str = Field(..., min_length=1, max_length=100, description="子项目名称")
    responsible_person: str = Field(..., min_length=1, max_length=50, description="责任人")
    project_manager: str = Field(..., min_length=1, max_length=50, description="项目经理")
    budget_person_days: float = Field(..., gt=0, description="预算投入(人天)")
    budget_used_days: float = Field(0, ge=0, description="已使用人天")
    status: ProjectStatusEnum = Field(ProjectStatusEnum.PLANNING, description="项目状态")
    remarks: Optional[str] = Field(None, description="备注说明")


class SpecialProjectCreate(SpecialProjectBase):
    """创建项目请求模型"""
    targets: List[SpecialProjectTargetCreate] = Field(default=[], description="目标列表")


class SpecialProjectUpdate(BaseModel):
    """更新项目请求模型"""
    sub_project: Optional[str] = Field(None, min_length=1, max_length=100)
    responsible_person: Optional[str] = Field(None, min_length=1, max_length=50)
    project_manager: Optional[str] = Field(None, min_length=1, max_length=50)
    budget_person_days: Optional[float] = Field(None, gt=0)
    budget_used_days: Optional[float] = Field(None, ge=0)
    status: Optional[ProjectStatusEnum] = None
    remarks: Optional[str] = None
    targets: Optional[List[SpecialProjectTargetCreate]] = None


# ============ POST 请求体模型 ============

class SpecialProjectListRequest(BaseModel):
    """专项项目列表查询请求"""
    skip: int = Field(0, ge=0, description="跳过记录数")
    limit: int = Field(100, ge=1, le=1000, description="返回记录数")
    status: Optional[str] = Field(None, description="状态筛选")
    keyword: Optional[str] = Field(None, description="关键词搜索")


class SpecialProjectGetRequest(BaseModel):
    """获取单个专项项目请求"""
    id: int = Field(..., description="项目ID")


class SpecialProjectDeleteRequest(BaseModel):
    """删除专项项目请求"""
    id: int = Field(..., description="项目ID")


class SpecialProjectUpdateRequest(BaseModel):
    """更新专项项目请求（包含ID）"""
    id: int = Field(..., description="项目ID")
    sub_project: Optional[str] = Field(None, min_length=1, max_length=100)
    responsible_person: Optional[str] = Field(None, min_length=1, max_length=50)
    project_manager: Optional[str] = Field(None, min_length=1, max_length=50)
    budget_person_days: Optional[float] = Field(None, gt=0)
    budget_used_days: Optional[float] = Field(None, ge=0)
    status: Optional[ProjectStatusEnum] = None
    remarks: Optional[str] = None
    targets: Optional[List[SpecialProjectTargetCreate]] = None


class SpecialProjectBudgetUpdateRequest(BaseModel):
    """更新预算使用请求"""
    id: int = Field(..., description="项目ID")
    used_days: float = Field(..., ge=0, description="已使用人天")


class SpecialProjectTargetCreateRequest(BaseModel):
    """创建目标请求"""
    project_id: int = Field(..., description="项目ID")
    target_name: str = Field(..., min_length=1, max_length=100, description="目标名称")
    target_value: float = Field(..., description="目标值")
    current_value: float = Field(0, description="当前值")
    unit: Optional[str] = Field(None, max_length=20, description="单位")
    weight: float = Field(1.0, ge=0, le=1, description="权重")


class SpecialProjectTargetUpdateRequest(BaseModel):
    """更新目标请求"""
    project_id: int = Field(..., description="项目ID")
    target_id: int = Field(..., description="目标ID")
    target_name: Optional[str] = Field(None, min_length=1, max_length=100)
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = Field(None, max_length=20)
    weight: Optional[float] = Field(None, ge=0, le=1)


class SpecialProjectTargetDeleteRequest(BaseModel):
    """删除目标请求"""
    project_id: int = Field(..., description="项目ID")
    target_id: int = Field(..., description="目标ID")


class SpecialProjectTargetProgressRequest(BaseModel):
    """更新目标进度请求"""
    project_id: int = Field(..., description="项目ID")
    target_id: int = Field(..., description="目标ID")
    current_value: float = Field(..., description="当前值")


class SpecialProjectResponse(SpecialProjectBase):
    """项目响应模型"""
    id: int
    budget_usage_percent: float = Field(default=0, description="预算使用百分比")
    targets: List[SpecialProjectTargetResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SpecialProjectListResponse(BaseModel):
    """项目列表响应模型"""
    total: int
    items: List[SpecialProjectResponse]


# ============ 枚举配置 ============

PROJECT_STATUS_CONFIG = {
    ProjectStatusEnum.PLANNING: {"label": "规划中", "color": "#FFB900"},
    ProjectStatusEnum.IN_PROGRESS: {"label": "进行中", "color": "#107C10"},
    ProjectStatusEnum.ON_HOLD: {"label": "暂停", "color": "#CA5010"},
    ProjectStatusEnum.COMPLETED: {"label": "已完成", "color": "#0078D4"},
    ProjectStatusEnum.CANCELLED: {"label": "已取消", "color": "#D13438"},
}
