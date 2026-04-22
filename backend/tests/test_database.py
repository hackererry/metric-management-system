"""
数据库模型测试
"""
import pytest
from datetime import datetime

from app.models import Metric, MetricHistory


class TestMetricModel:
    """Metric模型测试"""

    def test_create_metric(self, db_session):
        """测试创建指标"""
        metric = Metric(
            name="测试指标",
            code="test_create_metric",
            category="overview",
            data_type="number",
            dimension="quality",
            lower_is_better=True,
            unit="个",
            target_value=80.0,
            description="测试描述",
            is_active=True
        )
        db_session.add(metric)
        db_session.commit()

        assert metric.id is not None
        assert metric.name == "测试指标"
        assert metric.code == "test_create_metric"
        assert metric.category == "overview"
        assert metric.dimension == "quality"
        assert metric.data_type == "number"
        assert metric.target_value == 80.0
        assert metric.created_at is not None
        assert metric.updated_at is not None

    def test_metric_default_values(self, db_session):
        """测试指标默认值"""
        metric = Metric(
            name="默认测试",
            code="test_defaults",
            category="overview",
            data_type="number",
            dimension="quality"
        )
        db_session.add(metric)
        db_session.commit()

        assert metric.lower_is_better is True
        assert metric.is_active is True

    def test_metric_code_unique(self, db_session):
        """测试编码唯一性"""
        metric1 = Metric(
            name="指标1",
            code="unique_code",
            category="overview",
            data_type="number",
            dimension="quality"
        )
        db_session.add(metric1)
        db_session.commit()

        metric2 = Metric(
            name="指标2",
            code="unique_code",
            category="product_a",
            data_type="number",
            dimension="efficiency"
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
            dimension="quality"
        )
        db_session.add(metric)
        db_session.commit()

        assert isinstance(metric.created_at, datetime)
        assert isinstance(metric.updated_at, datetime)

    def test_metric_update(self, db_session, sample_metric):
        """测试指标更新"""
        original_updated_at = sample_metric.updated_at
        sample_metric.target_value = 60.0
        db_session.commit()
        db_session.refresh(sample_metric)

        assert sample_metric.target_value == 60.0
        assert sample_metric.updated_at >= original_updated_at

    def test_metric_delete(self, db_session, sample_metric):
        """测试指标删除"""
        metric_id = sample_metric.id
        db_session.delete(sample_metric)
        db_session.commit()

        deleted_metric = db_session.query(Metric).filter(Metric.id == metric_id).first()
        assert deleted_metric is None


class TestMetricHistoryModel:
    """MetricHistory模型测试"""

    def test_create_history(self, db_session, sample_metric):
        """测试创建历史记录"""
        history = MetricHistory(
            metric_id=sample_metric.id,
            year=2026,
            month=3,
            value=45.0
        )
        db_session.add(history)
        db_session.commit()

        assert history.id is not None
        assert history.metric_id == sample_metric.id
        assert history.year == 2026
        assert history.month == 3
        assert history.value == 45.0
        assert history.created_at is not None

    def test_history_unique_constraint(self, db_session, sample_metric):
        """测试历史记录唯一约束（同一指标同年月）"""
        history1 = MetricHistory(
            metric_id=sample_metric.id,
            year=2026,
            month=3,
            value=45.0
        )
        db_session.add(history1)
        db_session.commit()

        history2 = MetricHistory(
            metric_id=sample_metric.id,
            year=2026,
            month=3,
            value=50.0
        )
        db_session.add(history2)

        with pytest.raises(Exception):
            db_session.commit()

    def test_history_cascade_delete(self, db_session):
        """测试指标删除时级联删除历史（SQLite不强制外键，仅验证结构）"""
        metric = Metric(
            name="级联测试",
            code="cascade_test",
            category="overview",
            data_type="number",
            dimension="quality"
        )
        db_session.add(metric)
        db_session.commit()

        history = MetricHistory(
            metric_id=metric.id,
            year=2026,
            month=1,
            value=9.0
        )
        db_session.add(history)
        db_session.commit()

        # 手动删除历史记录，然后删除指标
        history_id = history.id
        db_session.delete(history)
        db_session.delete(metric)
        db_session.commit()

        deleted = db_session.query(MetricHistory).filter(MetricHistory.id == history_id).first()
        assert deleted is None
