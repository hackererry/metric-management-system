"""
API接口测试
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
        response = client.post("/api/metrics/", json=sample_metric_data)
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
            "value": 100.0
        }
        response = client.post("/api/metrics/", json=invalid_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_duplicate_code(self, client, sample_metric_data):
        """测试创建重复编码"""
        # 第一次创建
        response1 = client.post("/api/metrics/", json=sample_metric_data)
        assert response1.status_code == status.HTTP_200_OK

        # 重复编码创建
        response2 = client.post("/api/metrics/", json=sample_metric_data)
        assert response2.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_metrics(self, client, sample_metric):
        """测试获取指标列表"""
        response = client.get("/api/metrics/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total" in data
        assert "items" in data
        assert data["total"] >= 1

    def test_get_metrics_with_pagination(self, client):
        """测试分页参数"""
        response = client.get("/api/metrics/?skip=0&limit=10")
        assert response.status_code == status.HTTP_200_OK

    def test_get_metrics_with_category_filter(self, client, sample_metric):
        """测试分类筛选"""
        response = client.get(f"/api/metrics/?category={sample_metric.category}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        for item in data["items"]:
            assert item["category"] == sample_metric.category

    def test_get_metrics_with_metric_type_filter(self, client, sample_metric):
        """测试指标类型筛选"""
        response = client.get(f"/api/metrics/?metric_type={sample_metric.metric_type}")
        assert response.status_code == status.HTTP_200_OK

    def test_get_metrics_with_keyword(self, client, sample_metric):
        """测试关键词搜索"""
        response = client.get(f"/api/metrics/?keyword={sample_metric.name[:2]}")
        assert response.status_code == status.HTTP_200_OK

    def test_get_metric_by_id(self, client, sample_metric):
        """测试获取单个指标"""
        response = client.get(f"/api/metrics/{sample_metric.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == sample_metric.id
        assert data["name"] == sample_metric.name

    def test_get_metric_not_found(self, client):
        """测试获取不存在的指标"""
        response = client.get("/api/metrics/99999")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_metric(self, client, sample_metric):
        """测试更新指标"""
        update_data = {"name": "更新后的名称", "value": 999.0}
        response = client.put(f"/api/metrics/{sample_metric.id}", json=update_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "更新后的名称"
        assert data["value"] == 999.0

    def test_update_metric_not_found(self, client):
        """测试更新不存在的指标"""
        update_data = {"name": "新名称"}
        response = client.put("/api/metrics/99999", json=update_data)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_duplicate_code(self, client, sample_metric):
        """测试更新重复编码"""
        # 创建另一个指标
        new_metric = {
            "name": "新指标",
            "code": "new_unique_code",
            "category": "overview",
            "data_type": "number",
            "value": 50.0
        }
        client.post("/api/metrics/", json=new_metric)

        # 尝试使用已存在的编码
        update_data = {"code": sample_metric.code}
        response = client.put(f"/api/metrics/{new_metric['code']}", json=update_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_delete_metric(self, client, sample_metric):
        """测试删除指标"""
        response = client.delete(f"/api/metrics/{sample_metric.id}")
        assert response.status_code == status.HTTP_200_OK

        # 确认已删除
        response = client.get(f"/api/metrics/{sample_metric.id}")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_metric_not_found(self, client):
        """测试删除不存在的指标"""
        response = client.delete("/api/metrics/99999")
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCategoryAPI:
    """分类API测试"""

    def test_get_by_category(self, client, sample_metric):
        """测试按分类获取指标"""
        response = client.get(f"/api/metrics/category/{sample_metric.category}")
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)

    def test_get_by_category_with_metric_type(self, client, sample_metric):
        """测试按分类和类型获取"""
        response = client.get(
            f"/api/metrics/category/{sample_metric.category}",
            params={"metric_type": sample_metric.metric_type}
        )
        assert response.status_code == status.HTTP_200_OK

    def test_get_by_category_invalid(self, client):
        """测试无效分类"""
        response = client.get("/api/metrics/category/invalid_category")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_by_category_grouped(self, client, sample_metric):
        """测试按分类分组获取"""
        response = client.get(f"/api/metrics/category/{sample_metric.category}/grouped")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "business" in data
        assert "tech" in data

    def test_get_category_stats(self, client, sample_metric):
        """测试获取分类统计"""
        response = client.get("/api/metrics/stats")
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

        # 验证更新
        get_response = client.get(f"/api/metrics/{sample_metric.id}")
        updated_metric = get_response.json()
        assert updated_metric["value"] == 888.0

    def test_batch_update_trend_calculation(self, client, sample_metric):
        """测试批量更新趋势计算"""
        original_value = sample_metric.value
        updates = {sample_metric.code: original_value + 10.0}
        response = client.post("/api/metrics/batch-update", json=updates)
        assert response.status_code == status.HTTP_200_OK

        # 验证趋势
        get_response = client.get(f"/api/metrics/{sample_metric.id}")
        updated_metric = get_response.json()
        assert updated_metric["trend"] == "up"


class TestValidation:
    """输入验证测试"""

    def test_name_required(self, client):
        """测试名称必填"""
        invalid_data = {
            "code": "no_name",
            "category": "overview",
            "data_type": "number",
            "value": 100.0
        }
        response = client.post("/api/metrics/", json=invalid_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_code_required(self, client):
        """测试编码必填"""
        invalid_data = {
            "name": "测试名称",
            "category": "overview",
            "data_type": "number",
            "value": 100.0
        }
        response = client.post("/api/metrics/", json=invalid_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_value_required(self, client):
        """测试值必填"""
        invalid_data = {
            "name": "测试名称",
            "code": "test_code",
            "category": "overview",
            "data_type": "number"
        }
        response = client.post("/api/metrics/", json=invalid_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
