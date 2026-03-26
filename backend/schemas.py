"""
Pydantic模型定义 - 用于请求参数验证和响应数据序列化
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum


class DataTypeEnum(str, Enum):
    """数据类型枚举"""
    NUMBER = "number"
    PERCENTAGE = "percentage"
    TREND = "trend"


class CategoryEnum(str, Enum):
    """分类枚举"""
    OVERVIEW = "overview"
    PRODUCT_A = "product_a"
    PRODUCT_B = "product_b"
    PRODUCT_C = "product_c"
    PRODUCT_D = "product_d"


class TrendEnum(str, Enum):
    """趋势枚举"""
    UP = "up"
    DOWN = "down"
    STABLE = "stable"


class MetricTypeEnum(str, Enum):
    """指标类型枚举"""
    BUSINESS = "business"  # 业务指标
    TECH = "tech"          # 研发指标


class DimensionEnum(str, Enum):
    """维度枚举 - 用于年度指标分类"""
    QUALITY = "quality"       # 质量
    EFFICIENCY = "efficiency" # 效率
    EXPERIENCE = "experience" # 体验
    BUSINESS = "business"     # 经营


class MetricBase(BaseModel):
    """指标基础模型"""
    name: str = Field(..., min_length=1, max_length=100, description="指标名称")
    code: str = Field(..., min_length=1, max_length=50, description="指标编码")
    category: CategoryEnum = Field(..., description="所属分类")
    metric_type: MetricTypeEnum = Field(MetricTypeEnum.BUSINESS, description="指标类型: business/tech")
    data_type: DataTypeEnum = Field(..., description="数据类型")
    dimension: Optional[DimensionEnum] = Field(None, description="维度: quality/efficiency/experience/business (用于年度指标分类)")
    lower_is_better: bool = Field(True, description="达标条件: True表示越小越好, False表示越大越好")
    unit: Optional[str] = Field(None, max_length=20, description="单位")
    value: float = Field(..., description="当前值")
    target_value: Optional[float] = Field(None, description="目标值")
    challenge_value: Optional[float] = Field(None, description="挑战值")
    previous_value: Optional[float] = Field(None, description="上一周期值")
    trend: Optional[TrendEnum] = Field(None, description="趋势")
    description: Optional[str] = Field(None, description="指标描述")
    is_active: bool = Field(True, description="是否启用")

    @field_validator('code')
    @classmethod
    def validate_code(cls, v):
        """验证编码格式：只允许字母、数字和下划线"""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('编码只能包含字母、数字、下划线和连字符')
        return v.lower()


class MetricCreate(MetricBase):
    """创建指标请求模型"""
    pass


class MetricUpdate(BaseModel):
    """更新指标请求模型 - 所有字段可选"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    category: Optional[CategoryEnum] = None
    metric_type: Optional[MetricTypeEnum] = None
    data_type: Optional[DataTypeEnum] = None
    dimension: Optional[DimensionEnum] = None
    lower_is_better: Optional[bool] = None
    unit: Optional[str] = Field(None, max_length=20)
    value: Optional[float] = None
    target_value: Optional[float] = None
    challenge_value: Optional[float] = None
    previous_value: Optional[float] = None
    trend: Optional[TrendEnum] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator('code')
    @classmethod
    def validate_code(cls, v):
        if v is not None:
            if not v.replace('_', '').replace('-', '').isalnum():
                raise ValueError('编码只能包含字母、数字、下划线和连字符')
            return v.lower()
        return v


class MetricResponse(MetricBase):
    """指标响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MetricListResponse(BaseModel):
    """指标列表响应模型"""
    total: int
    items: list[MetricResponse]


class CategoryStats(BaseModel):
    """分类统计模型"""
    category: str
    count: int
    active_count: int


class ApiResponse(BaseModel):
    """通用API响应模型"""
    code: int = 200
    message: str = "success"
    data: Optional[dict] = None


# ============ 项目专题相关模型 ============

class ProjectStatusEnum(str, Enum):
    """项目状态枚举"""
    ACTIVE = "active"        # 进行中
    COMPLETED = "completed"  # 已完成
    ARCHIVED = "archived"    # 已归档


class ProjectBase(BaseModel):
    """项目基础模型"""
    name: str = Field(..., min_length=1, max_length=100, description="项目名称")
    code: Optional[str] = Field(None, max_length=50, description="项目编码")
    description: Optional[str] = Field(None, description="项目描述")
    status: ProjectStatusEnum = Field(ProjectStatusEnum.ACTIVE, description="状态: active/completed/archived")
    start_date: Optional[datetime] = Field(None, description="开始日期")
    end_date: Optional[datetime] = Field(None, description="结束日期")

    @field_validator('code')
    @classmethod
    def validate_code(cls, v):
        """验证编码格式：只允许字母、数字和下划线"""
        if v is not None:
            if not v.replace('_', '').replace('-', '').isalnum():
                raise ValueError('编码只能包含字母、数字、下划线和连字符')
            return v.lower()
        return v


class ProjectCreate(ProjectBase):
    """创建项目请求模型"""
    pass


class ProjectUpdate(BaseModel):
    """更新项目请求模型 - 所有字段可选"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    status: Optional[ProjectStatusEnum] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    @field_validator('code')
    @classmethod
    def validate_code(cls, v):
        if v is not None:
            if not v.replace('_', '').replace('-', '').isalnum():
                raise ValueError('编码只能包含字母、数字、下划线和连字符')
            return v.lower()
        return v


class ProjectResponse(ProjectBase):
    """项目响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """项目列表响应模型"""
    total: int
    items: list[ProjectResponse]


class ProjectMetricCreate(BaseModel):
    """添加指标到项目请求模型"""
    metric_id: int = Field(..., description="指标ID")
    target_value: Optional[float] = Field(None, description="该项目下的目标值")


class ProjectMetricResponse(BaseModel):
    """项目指标响应模型"""
    id: int
    project_id: int
    metric_id: int
    target_value: Optional[float]
    created_at: datetime
    # 关联的指标详情
    metric: Optional[MetricResponse] = None
    # 达成状态
    is_achieved: Optional[bool] = None
    achievement_rate: Optional[float] = None

    class Config:
        from_attributes = True


class ProjectStats(BaseModel):
    """项目统计模型"""
    total_metrics: int = Field(..., description="总指标数")
    achieved_metrics: int = Field(..., description="达标指标数")
    achievement_rate: float = Field(..., description="达成率（百分比）")


class ProjectResponse(ProjectBase):
    """项目响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime
    metric_count: int = Field(default=0, description="关联指标数量")
    achievement_rate: Optional[float] = Field(None, description="达成率")

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """项目列表响应模型"""
    total: int
    items: list[ProjectResponse]
