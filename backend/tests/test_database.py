"""
数据库模型测试
"""
import pytest
from datetime import datetime

from database import Metric


class TestMetricModel:
    """Metric模型测试"""

    def test_create_metric(self, db_session):
        """测试创建指标"""
        metric = Metric(
            name="测试指标",
            code="test_create_metric",
            category="overview",
            metric_type="business",
            data_type="number",
            dimension="quality",
            lower_is_better=True,
            unit="个",
            value=100.0,
            target_value=80.0,
            previous_value=90.0,
            trend="down",
            description="测试描述",
            is_active=True
        )
        db_session.add(metric)
        db_session.commit()

        assert metric.id is not None
        assert metric.name == "测试指标"
        assert metric.code == "test_create_metric"
        assert metric.category == "overview"
        assert metric.metric_type == "business"
        assert metric.data_type == "number"
        assert metric.value == 100.0
        assert metric.created_at is not None
        assert metric.updated_at is not None

    def test_metric_default_values(self, db_session):
        """测试指标默认值"""
        metric = Metric(
            name="默认测试",
            code="test_defaults",
            category="overview",
            data_type="number",
            value=10.0
        )
        db_session.add(metric)
        db_session.commit()

        assert metric.metric_type == "business"
        assert metric.lower_is_better is True
        assert metric.is_active is True

    def test_metric_code_unique(self, db_session):
        """测试编码唯一性"""
        metric1 = Metric(
            name="指标1",
            code="unique_code",
            category="overview",
            data_type="number",
            value=10.0
        )
        db_session.add(metric1)
        db_session.commit()

        metric2 = Metric(
            name="指标2",
            code="unique_code",
            category="product_a",
            data_type="number",
            value=20.0
        )
        db_session.add(metric2)

        with pytest.raises(Exception):
            db_session.commit()

    def test_metric_timestamps(self, db_session):
        """测试时间戳"""
        metric = Metric(
            name="时间戳测试",
            code="test_timestamps",
            category="overview",
            data_type="number",
            value=10.0
        )
        db_session.add(metric)
        db_session.commit()

        assert isinstance(metric.created_at, datetime)
        assert isinstance(metric.updated_at, datetime)

    def test_metric_update(self, db_session, sample_metric):
        """测试指标更新"""
        original_updated_at = sample_metric.updated_at
        sample_metric.value = 200.0
        db_session.commit()
        db_session.refresh(sample_metric)

        assert sample_metric.value == 200.0
        assert sample_metric.updated_at >= original_updated_at

    def test_metric_delete(self, db_session, sample_metric):
        """测试指标删除"""
        metric_id = sample_metric.id
        db_session.delete(sample_metric)
        db_session.commit()

        deleted_metric = db_session.query(Metric).filter(Metric.id == metric_id).first()
        assert deleted_metric is None
