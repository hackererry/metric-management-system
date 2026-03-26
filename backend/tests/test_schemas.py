"""
Pydantic Schema测试
"""
import pytest
from pydantic import ValidationError

from schemas import (
    MetricBase,
    MetricCreate,
    MetricUpdate,
    MetricResponse,
    DataTypeEnum,
    CategoryEnum,
    MetricTypeEnum,
    DimensionEnum,
    TrendEnum
)


class TestEnums:
    """枚举类型测试"""

    def test_data_type_enum(self):
        """测试数据类型枚举"""
        assert DataTypeEnum.NUMBER.value == "number"
        assert DataTypeEnum.PERCENTAGE.value == "percentage"
        assert DataTypeEnum.TREND.value == "trend"

    def test_category_enum(self):
        """测试分类枚举"""
        assert CategoryEnum.OVERVIEW.value == "overview"
        assert CategoryEnum.PRODUCT_A.value == "product_a"
        assert CategoryEnum.PRODUCT_B.value == "product_b"
        assert CategoryEnum.PRODUCT_C.value == "product_c"
        assert CategoryEnum.PRODUCT_D.value == "product_d"

    def test_metric_type_enum(self):
        """测试指标类型枚举"""
        assert MetricTypeEnum.BUSINESS.value == "business"
        assert MetricTypeEnum.TECH.value == "tech"

    def test_dimension_enum(self):
        """测试维度枚举"""
        assert DimensionEnum.QUALITY.value == "quality"
        assert DimensionEnum.EFFICIENCY.value == "efficiency"
        assert DimensionEnum.EXPERIENCE.value == "experience"
        assert DimensionEnum.BUSINESS.value == "business"

    def test_trend_enum(self):
        """测试趋势枚举"""
        assert TrendEnum.UP.value == "up"
        assert TrendEnum.DOWN.value == "down"
        assert TrendEnum.STABLE.value == "stable"


class TestMetricBase:
    """MetricBase模型测试"""

    def test_valid_metric_base(self):
        """测试有效的基础指标"""
        metric = MetricBase(
            name="测试指标",
            code="test_metric",
            category=CategoryEnum.OVERVIEW,
            data_type=DataTypeEnum.NUMBER,
            value=100.0
        )
        assert metric.name == "测试指标"
        assert metric.code == "test_metric"
        assert metric.lower_is_better is True  # 默认值

    def test_code_normalization(self):
        """测试编码自动转小写"""
        metric = MetricBase(
            name="测试",
            code="TEST_CODE",
            category=CategoryEnum.OVERVIEW,
            data_type=DataTypeEnum.NUMBER,
            value=100.0
        )
        assert metric.code == "test_code"

    def test_invalid_code_characters(self):
        """测试无效编码字符"""
        with pytest.raises(ValidationError):
            MetricBase(
                name="测试",
                code="invalid@code!",
                category=CategoryEnum.OVERVIEW,
                data_type=DataTypeEnum.NUMBER,
                value=100.0
            )

    def test_name_required(self):
        """测试名称必填"""
        with pytest.raises(ValidationError):
            MetricBase(
                code="test",
                category=CategoryEnum.OVERVIEW,
                data_type=DataTypeEnum.NUMBER,
                value=100.0
            )

    def test_name_max_length(self):
        """测试名称最大长度"""
        with pytest.raises(ValidationError):
            MetricBase(
                name="x" * 101,  # 超过100字符
                code="test",
                category=CategoryEnum.OVERVIEW,
                data_type=DataTypeEnum.NUMBER,
                value=100.0
            )


class TestMetricCreate:
    """MetricCreate模型测试"""

    def test_create_with_all_fields(self, sample_metric_data):
        """测试创建完整指标"""
        metric = MetricCreate(**sample_metric_data)
        assert metric.name == sample_metric_data["name"]
        assert metric.code == sample_metric_data["code"]

    def test_create_minimal_fields(self):
        """测试最小字段创建"""
        metric = MetricCreate(
            name="最小指标",
            code="min_metric",
            category=CategoryEnum.OVERVIEW,
            data_type=DataTypeEnum.NUMBER,
            value=10.0
        )
        assert metric.name == "最小指标"
        assert metric.metric_type == MetricTypeEnum.BUSINESS  # 默认值


class TestMetricUpdate:
    """MetricUpdate模型测试"""

    def test_update_partial_fields(self):
        """测试部分更新"""
        update = MetricUpdate(value=200.0)
        data = update.model_dump(exclude_unset=True)
        assert "value" in data
        assert data["value"] == 200.0
        assert "name" not in data

    def test_update_empty(self):
        """测试空更新"""
        update = MetricUpdate()
        data = update.model_dump(exclude_unset=True)
        assert len(data) == 0

    def test_update_code_validation(self):
        """测试更新时编码验证"""
        update = MetricUpdate(code="valid_code")
        assert update.code == "valid_code"

        with pytest.raises(ValidationError):
            MetricUpdate(code="invalid@code!")
