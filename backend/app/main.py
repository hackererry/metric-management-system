"""
FastAPI 主应用 - 产品运营平台后端
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import logging

from app.database import engine, Base
from app.models import Metric, MetricHistory  # noqa: F401 - 注册所有表
from app.models import SpecialProject, SpecialProjectTarget  # noqa: F401 - 注册专项项目表
from app.api.metrics import router
from app.api.special_projects import router as special_projects_router
from app.seed import init_test_data
import uvicorn

# 配置日志格式（带时间戳）
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    datefmt="%Y-%m-%d %H:%M:%S",
)


@asynccontextmanager
async def lifespan(application: FastAPI):
    """应用生命周期：启动和关闭逻辑"""
    # 启动：创建表并初始化数据
    Base.metadata.create_all(bind=engine)
    init_test_data()
    yield
    # 关闭：（如需清理资源可在此添加）


# 创建FastAPI应用
app = FastAPI(
    title="产品运营平台 API",
    description="""
## 产品运营平台后端接口

### 功能模块
- **指标管理**: 增删改查指标数据
- **分类管理**: 支持总览、导购/交易/智选车/公告多维度分类
- **维度分组**: 支持质量/效率/体验/经营/运作五维度分组
- **月度历史**: 支持指标月度历史数据查询
- **数据类型**: 支持数值、百分比、趋势等类型
- **搜索筛选**: 支持关键词搜索和多条件筛选

### 分类说明
- **overview**: 总览指标
- **product_a**: 导购产品指标
- **product_b**: 交易产品指标
- **product_c**: 智选车产品指标
- **product_d**: 公告产品指标

### 维度说明
- **quality**: 质量
- **efficiency**: 效率
- **experience**: 体验
- **business**: 经营
- **operation**: 运作

### 数据类型
- **number**: 数值型
- **percentage**: 百分比型
- **trend**: 趋势型
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应配置具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router)
app.include_router(special_projects_router)


@app.get("/", tags=["根路径"])
async def root():
    """API根路径"""
    return {
        "message": "产品运营平台 API",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health", tags=["健康检查"])
async def health_check():
    """健康检查接口"""
    return {"status": "healthy"}


if __name__ == "__main__":
    print("[*] 启动产品运营平台后端服务...")
    print("[*] API文档: http://localhost:8000/docs")
    print("[*] ReDoc文档: http://localhost:8000/redoc")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_config={
            "formatters": {
                "default": {
                    "format": LOG_FORMAT,
                    "datefmt": "%Y-%m-%d %H:%M:%S",
                },
                "access": {
                    "format": LOG_FORMAT,
                    "datefmt": "%Y-%m-%d %H:%M:%S",
                },
            },
        },
    )
