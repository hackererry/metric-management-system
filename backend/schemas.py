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


class MetricBase(BaseModel):
    """指标基础模型"""
    name: str = Field(..., min_length=1, max_length=100, description="指标名称")
    code: str = Field(..., min_length=1, max_length=50, description="指标编码")
    category: CategoryEnum = Field(..., description="所属分类")
    metric_type: MetricTypeEnum = Field(MetricTypeEnum.BUSINESS, description="指标类型: business/tech")
    data_type: DataTypeEnum = Field(..., description="数据类型")
    unit: Optional[str] = Field(None, max_length=20, description="单位")
    value: float = Field(..., description="当前值")
    target_value: Optional[float] = Field(None, description="目标值")
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
    unit: Optional[str] = Field(None, max_length=20)
    value: Optional[float] = None
    target_value: Optional[float] = None
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
