"""
pytest 配置文件和共享 fixture
"""
import pytest
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.models import Metric, MetricHistory
from app.main import app


# 测试数据库配置 - 使用内存数据库 + StaticPool 确保跨线程共享同一连接
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """创建测试数据库会话"""
    # 创建所有表
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # 清除所有表
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """创建测试客户端"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def sample_metric_data():
    """示例指标数据"""
    return {
        "name": "测试指标",
        "code": "test_metric",
        "category": "overview",
        "data_type": "number",
        "dimension": "quality",
        "lower_is_better": True,
        "unit": "个",
        "value": 100.0,
        "target_value": 80.0,
        "challenge_value": 60.0,
        "previous_value": 90.0,
        "trend": "down",
        "description": "这是一个测试指标",
        "is_active": True
    }


@pytest.fixture
def sample_metric(db_session):
    """创建示例指标"""
    metric = Metric(
        name="示例指标",
        code="sample_metric",
        category="overview",
        data_type="number",
        dimension="quality",
        lower_is_better=True,
        unit="个",
        value=50.0,
        target_value=40.0,
        challenge_value=30.0,
        previous_value=45.0,
        trend="up",
        description="示例指标描述",
        is_active=True
    )
    db_session.add(metric)
    db_session.commit()
    db_session.refresh(metric)
    return metric
