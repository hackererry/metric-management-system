"""
CRUD操作测试
"""
import pytest
from app.crud import MetricCRUD
from app.schemas import MetricCreate, MetricUpdate
from app.models import Metric


class TestMetricCRUDCreate:
    """创建操作测试"""

    def test_create_metric(self, db_session, sample_metric_data):
        """测试创建指标"""
        metric_create = MetricCreate(**sample_metric_data)
        metric = MetricCRUD.create(db_session, metric_create)

        assert metric.id is not None
        assert metric.name == sample_metric_data["name"]
        assert metric.code == sample_metric_data["code"]

    def test_create_returns_metric(self, db_session):
        """测试创建返回Metric对象"""
        metric_data = MetricCreate(
            name="返回测试",
            code="return_test",
            category="overview",
            data_type="number",
            dimension="quality",
            value=10.0
        )
        result = MetricCRUD.create(db_session, metric_data)
        assert isinstance(result, Metric)


class TestMetricCRUDGet:
    """读取操作测试"""

    def test_get_by_id(self, db_session, sample_metric):
        """测试通过ID获取"""
        result = MetricCRUD.get_by_id(db_session, sample_metric.id)
        assert result is not None
        assert result.id == sample_metric.id
        assert result.name == sample_metric.name

    def test_get_by_id_not_found(self, db_session):
        """测试ID不存在"""
        result = MetricCRUD.get_by_id(db_session, 99999)
        assert result is None

    def test_get_by_code(self, db_session, sample_metric):
        """测试通过编码获取"""
        result = MetricCRUD.get_by_code(db_session, sample_metric.code)
        assert result is not None
        assert result.code == sample_metric.code

    def test_get_by_code_not_found(self, db_session):
        """测试编码不存在"""
        result = MetricCRUD.get_by_code(db_session, "nonexistent")
        assert result is None

    def test_get_list_no_filter(self, db_session):
        """测试无筛选条件获取列表"""
        for i in range(5):
            metric = Metric(
                name=f"指标{i}",
                code=f"metric_{i}",
                category="overview",
                data_type="number",
                dimension="quality",
                value=i * 10.0
            )
            db_session.add(metric)
        db_session.commit()

        items, total = MetricCRUD.get_list(db_session)
        assert total == 5
        assert len(items) == 5

    def test_get_list_with_pagination(self, db_session):
        """测试分页"""
        for i in range(10):
            metric = Metric(
                name=f"分页指标{i}",
                code=f"pagination_{i}",
                category="overview",
                data_type="number",
                dimension="quality",
                value=i * 10.0
            )
            db_session.add(metric)
        db_session.commit()

        items, total = MetricCRUD.get_list(db_session, skip=0, limit=5)
        assert total == 10
        assert len(items) == 5

        items, total = MetricCRUD.get_list(db_session, skip=5, limit=5)
        assert total == 10
        assert len(items) == 5

    def test_get_list_by_category(self, db_session):
        """测试按分类筛选"""
        categories = ["overview", "product_a", "product_b"]
        for cat in categories:
            metric = Metric(
                name=f"{cat}_指标",
                code=f"{cat}_code",
                category=cat,
                data_type="number",
                dimension="quality",
                value=10.0
            )
            db_session.add(metric)
        db_session.commit()

        items, total = MetricCRUD.get_list(db_session, category="overview")
        assert total == 1
        assert items[0].category == "overview"

    def test_get_list_by_keyword(self, db_session):
        """测试关键词搜索"""
        metrics = [
            Metric(name="搜索测试一", code="search_1", category="overview", data_type="number", dimension="quality", value=10.0),
            Metric(name="搜索测试二", code="search_2", category="overview", data_type="number", dimension="quality", value=20.0),
            Metric(name="其他指标", code="other", category="overview", data_type="number", dimension="quality", value=30.0),
        ]
        db_session.add_all(metrics)
        db_session.commit()

        items, total = MetricCRUD.get_list(db_session, keyword="搜索")
        assert total == 2

    def test_get_list_by_is_active(self, db_session):
        """测试按状态筛选"""
        active = Metric(name="激活", code="active_metric", category="overview", data_type="number", dimension="quality", value=10.0, is_active=True)
        inactive = Metric(name="未激活", code="inactive_metric", category="overview", data_type="number", dimension="quality", value=10.0, is_active=False)
        db_session.add_all([active, inactive])
        db_session.commit()

        items, total = MetricCRUD.get_list(db_session, is_active=True)
        assert total == 1
        assert items[0].is_active is True


class TestMetricCRUDUpdate:
    """更新操作测试"""

    def test_update_metric(self, db_session, sample_metric):
        """测试更新指标"""
        update_data = MetricUpdate(name="新名称", value=999.0)
        result = MetricCRUD.update(db_session, sample_metric.id, update_data)

        assert result is not None
        assert result.name == "新名称"
        assert result.value == 999.0

    def test_update_not_found(self, db_session):
        """测试更新不存在的指标"""
        update_data = MetricUpdate(name="新名称")
        result = MetricCRUD.update(db_session, 99999, update_data)
        assert result is None

    def test_update_partial(self, db_session, sample_metric):
        """测试部分更新"""
        update_data = MetricUpdate(name="仅更新名称")
        result = MetricCRUD.update(db_session, sample_metric.id, update_data)

        assert result.name == "仅更新名称"
        assert result.code == sample_metric.code  # 未更新的字段保持不变


class TestMetricCRUDDelete:
    """删除操作测试"""

    def test_delete_metric(self, db_session, sample_metric):
        """测试删除指标"""
        metric_id = sample_metric.id
        result = MetricCRUD.delete(db_session, metric_id)

        assert result is True
        assert MetricCRUD.get_by_id(db_session, metric_id) is None

    def test_delete_not_found(self, db_session):
        """测试删除不存在的指标"""
        result = MetricCRUD.delete(db_session, 99999)
        assert result is False


class TestMetricCRUDBatch:
    """批量操作测试"""

    def test_batch_update_values(self, db_session):
        """测试批量更新值"""
        metrics = [
            Metric(name="指标1", code="batch_1", category="overview", data_type="number", dimension="quality", value=10.0),
            Metric(name="指标2", code="batch_2", category="overview", data_type="number", dimension="quality", value=20.0),
        ]
        db_session.add_all(metrics)
        db_session.commit()

        updates = {"batch_1": 100.0, "batch_2": 200.0}
        count = MetricCRUD.batch_update_values(db_session, updates)

        assert count == 2

        metric1 = MetricCRUD.get_by_code(db_session, "batch_1")
        assert metric1.value == 100.0
        assert metric1.previous_value == 10.0
        assert metric1.trend == "up"

    def test_batch_update_auto_trend(self, db_session):
        """测试批量更新自动计算趋势"""
        metric = Metric(
            name="趋势测试",
            code="trend_test",
            category="overview",
            data_type="number",
            dimension="quality",
            value=50.0,
            previous_value=100.0
        )
        db_session.add(metric)
        db_session.commit()

        MetricCRUD.batch_update_values(db_session, {"trend_test": 30.0})
        db_session.refresh(metric)

        assert metric.trend == "down"  # 30 < 50

    def test_get_category_stats(self, db_session):
        """测试获取分类统计"""
        metrics = [
            Metric(name="指标1", code="stat_1", category="overview", data_type="number", dimension="quality", value=10.0, is_active=True),
            Metric(name="指标2", code="stat_2", category="overview", data_type="number", dimension="quality", value=20.0, is_active=False),
            Metric(name="指标3", code="stat_3", category="product_a", data_type="number", dimension="efficiency", value=30.0, is_active=True),
        ]
        db_session.add_all(metrics)
        db_session.commit()

        stats = MetricCRUD.get_category_stats(db_session)

        assert stats["overview"]["total"] == 2
        assert stats["overview"]["active"] == 1
        assert stats["product_a"]["total"] == 1

    def test_get_by_category_grouped(self, db_session):
        """测试按分类获取维度分组指标"""
        metrics = [
            Metric(name="质量指标", code="dim_quality", category="overview", data_type="number", dimension="quality", value=10.0, is_active=True),
            Metric(name="效率指标", code="dim_efficiency", category="overview", data_type="number", dimension="efficiency", value=20.0, is_active=True),
            Metric(name="体验指标", code="dim_experience", category="overview", data_type="number", dimension="experience", value=30.0, is_active=True),
            Metric(name="经营指标", code="dim_business", category="overview", data_type="number", dimension="business", value=40.0, is_active=True),
            Metric(name="运作指标", code="dim_operation", category="overview", data_type="number", dimension="operation", value=50.0, is_active=True),
        ]
        db_session.add_all(metrics)
        db_session.commit()

        grouped = MetricCRUD.get_by_category_grouped(db_session, "overview")

        assert "quality" in grouped
        assert "efficiency" in grouped
        assert "experience" in grouped
        assert "business" in grouped
        assert "operation" in grouped
        assert len(grouped["quality"]) == 1
        assert grouped["quality"][0].code == "dim_quality"
