"""
指标相关枚举和 Pydantic 模型
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


class DimensionEnum(str, Enum):
    """维度枚举"""
    QUALITY = "quality"       # 质量
    EFFICIENCY = "efficiency" # 效率
    EXPERIENCE = "experience" # 体验
    BUSINESS = "business"     # 经营
    OPERATION = "operation"   # 运作


class MetricBase(BaseModel):
    """指标基础模型"""
    name: str = Field(..., min_length=1, max_length=100, description="指标名称")
    code: str = Field(..., min_length=1, max_length=50, description="指标编码")
    category: CategoryEnum = Field(..., description="所属分类")
    data_type: DataTypeEnum = Field(..., description="数据类型")
    dimension: DimensionEnum = Field(..., description="维度: quality/efficiency/experience/business/operation")
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


# ============ POST 请求体模型 ============

class MetricListRequest(BaseModel):
    """指标列表查询请求"""
    skip: int = Field(0, ge=0, description="跳过记录数")
    limit: int = Field(100, ge=1, le=1000, description="返回记录数")
    category: Optional[str] = Field(None, description="分类筛选")
    is_active: Optional[bool] = Field(None, description="状态筛选")
    keyword: Optional[str] = Field(None, description="关键词搜索")


class MetricGetRequest(BaseModel):
    """获取单个指标请求"""
    id: int = Field(..., description="指标ID")


class MetricDeleteRequest(BaseModel):
    """删除指标请求"""
    id: int = Field(..., description="指标ID")


class MetricUpdateRequest(BaseModel):
    """更新指标请求（包含ID）"""
    id: int = Field(..., description="指标ID")
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    category: Optional[CategoryEnum] = None
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


class MetricCategoryQueryRequest(BaseModel):
    """按分类查询指标请求"""
    category: str = Field(..., description="分类名称")
    metric_type: Optional[str] = Field(None, description="指标类型筛选")


class MetricHistoryQueryRequest(BaseModel):
    """月度历史查询请求"""
    category: str = Field(..., description="分类名称")
    year: int = Field(..., description="年份")


class MetricHistoryCreate(BaseModel):
    """创建月度历史请求模型"""
    metric_id: int
    year: int = Field(..., ge=2020, le=2100)
    month: int = Field(..., ge=1, le=12)
    value: float


class MetricHistoryResponse(BaseModel):
    """月度历史响应模型"""
    id: int
    metric_id: int
    year: int
    month: int
    value: float
    created_at: datetime

    class Config:
        from_attributes = True
