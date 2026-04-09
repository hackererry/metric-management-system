"""
API接口测试（统一 POST）
"""
import pytest
from fastapi import status


class TestRootAPI:
    """根路径API测试"""

    def test_root(self, client):
        """测试根路径"""
        response = client.get("/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "docs" in data

    def test_health_check(self, client):
        """测试健康检查"""
        response = client.get("/health")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"status": "healthy"}


class TestMetricAPI:
    """指标API测试"""

    def test_create_metric(self, client, sample_metric_data):
        """测试创建指标"""
        response = client.post("/api/metrics/create", json=sample_metric_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == sample_metric_data["name"]
        assert data["code"] == sample_metric_data["code"]
        assert "id" in data

    def test_create_metric_invalid_code(self, client):
        """测试创建指标 - 无效编码"""
        invalid_data = {
            "name": "测试",
            "code": "invalid@code!",
            "category": "overview",
            "data_type": "number",
            "dimension": "quality",
            "value": 100.0
        }
        response = client.post("/api/metrics/create", json=invalid_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_duplicate_code(self, client, sample_metric_data):
        """测试创建重复编码"""
        response1 = client.post("/api/metrics/create", json=sample_metric_data)
        assert response1.status_code == status.HTTP_200_OK

        response2 = client.post("/api/metrics/create", json=sample_metric_data)
        assert response2.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_metrics(self, client, sample_metric):
        """测试获取指标列表"""
        response = client.post("/api/metrics/list", json={})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total" in data
        assert "items" in data
        assert data["total"] >= 1

    def test_get_metrics_with_pagination(self, client):
        """测试分页参数"""
        response = client.post("/api/metrics/list", json={"skip": 0, "limit": 10})
        assert response.status_code == status.HTTP_200_OK

    def test_get_metrics_with_category_filter(self, client, sample_metric):
        """测试分类筛选"""
        response = client.post("/api/metrics/list", json={"category": sample_metric.category})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        for item in data["items"]:
            assert item["category"] == sample_metric.category

    def test_get_metrics_with_keyword(self, client, sample_metric):
        """测试关键词搜索"""
        response = client.post("/api/metrics/list", json={"keyword": sample_metric.name[:2]})
        assert response.status_code == status.HTTP_200_OK

    def test_get_metric_by_id(self, client, sample_metric):
        """测试获取单个指标"""
        response = client.post("/api/metrics/get", json={"id": sample_metric.id})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == sample_metric.id
        assert data["name"] == sample_metric.name

    def test_get_metric_not_found(self, client):
        """测试获取不存在的指标"""
        response = client.post("/api/metrics/get", json={"id": 99999})
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_metric(self, client, sample_metric):
        """测试更新指标"""
        update_data = {"id": sample_metric.id, "name": "更新后的名称", "value": 999.0}
        response = client.post("/api/metrics/update", json=update_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "更新后的名称"
        assert data["value"] == 999.0

    def test_update_metric_not_found(self, client):
        """测试更新不存在的指标"""
        update_data = {"id": 99999, "name": "新名称"}
        response = client.post("/api/metrics/update", json=update_data)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_duplicate_code(self, client, sample_metric):
        """测试更新重复编码"""
        new_metric = {
            "name": "新指标",
            "code": "new_unique_code",
            "category": "overview",
            "data_type": "number",
            "dimension": "quality",
            "value": 50.0
        }
        create_response = client.post("/api/metrics/create", json=new_metric)
        new_metric_id = create_response.json()["id"]

        update_data = {"id": new_metric_id, "code": sample_metric.code}
        response = client.post("/api/metrics/update", json=update_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_delete_metric(self, client, sample_metric):
        """测试删除指标"""
        response = client.post("/api/metrics/delete", json={"id": sample_metric.id})
        assert response.status_code == status.HTTP_200_OK

        response = client.post("/api/metrics/get", json={"id": sample_metric.id})
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_metric_not_found(self, client):
        """测试删除不存在的指标"""
        response = client.post("/api/metrics/delete", json={"id": 99999})
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCategoryAPI:
    """分类API测试"""

    def test_get_by_category(self, client, sample_metric):
        """测试按分类获取指标"""
        response = client.post("/api/metrics/category/query", json={"category": sample_metric.category})
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)

    def test_get_by_category_invalid(self, client):
        """测试无效分类"""
        response = client.post("/api/metrics/category/query", json={"category": "invalid_category"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_by_category_grouped(self, client, sample_metric):
        """测试按分类分组获取（按维度分组）"""
        response = client.post("/api/metrics/category/grouped", json={"category": sample_metric.category})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # 应该返回维度分组的字典
        assert isinstance(data, dict)

    def test_get_category_stats(self, client, sample_metric):
        """测试获取分类统计"""
        response = client.post("/api/metrics/stats", json={})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "code" in data
        assert "data" in data
        stats = data["data"]
        assert "overview" in stats
        assert "product_a" in stats


class TestBatchUpdateAPI:
    """批量更新API测试"""

    def test_batch_update(self, client, sample_metric):
        """测试批量更新"""
        updates = {sample_metric.code: 888.0}
        response = client.post("/api/metrics/batch-update", json=updates)
        assert response.status_code == status.HTTP_200_OK

        get_response = client.post("/api/metrics/get", json={"id": sample_metric.id})
        updated_metric = get_response.json()
        assert updated_metric["value"] == 888.0

    def test_batch_update_trend_calculation(self, client, sample_metric):
        """测试批量更新趋势计算"""
        original_value = sample_metric.value
        updates = {sample_metric.code: original_value + 10.0}
        response = client.post("/api/metrics/batch-update", json=updates)
        assert response.status_code == status.HTTP_200_OK

        get_response = client.post("/api/metrics/get", json={"id": sample_metric.id})
        updated_metric = get_response.json()
        assert updated_metric["trend"] == "up"


class TestHistoryAPI:
    """历史数据API测试"""

    def test_get_monthly_history(self, client, sample_metric):
        """测试获取月度历史数据"""
        response = client.post("/api/metrics/history/query", json={"category": sample_metric.category, "year": 2026})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, dict)

    def test_get_monthly_history_invalid_category(self, client):
        """测试无效分类的历史数据"""
        response = client.post("/api/metrics/history/query", json={"category": "invalid", "year": 2026})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestValidation:
    """输入验证测试"""

    def test_name_required(self, client):
        """测试名称必填"""
        invalid_data = {
            "code": "no_name",
            "category": "overview",
            "data_type": "number",
            "dimension": "quality",
            "value": 100.0
        }
        response = client.post("/api/metrics/create", json=invalid_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_code_required(self, client):
        """测试编码必填"""
        invalid_data = {
            "name": "测试名称",
            "category": "overview",
            "data_type": "number",
            "dimension": "quality",
            "value": 100.0
        }
        response = client.post("/api/metrics/create", json=invalid_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_value_required(self, client):
        """测试值必填"""
        invalid_data = {
            "name": "测试名称",
            "code": "test_code",
            "category": "overview",
            "data_type": "number",
            "dimension": "quality"
        }
        response = client.post("/api/metrics/create", json=invalid_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_dimension_required(self, client):
        """测试维度必填"""
        invalid_data = {
            "name": "测试名称",
            "code": "test_code",
            "category": "overview",
            "data_type": "number",
            "value": 100.0
        }
        response = client.post("/api/metrics/create", json=invalid_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
