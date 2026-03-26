"""
FastAPI主应用 - 产品运营平台后端
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import router, project_router
from database import init_test_data
import uvicorn

# 创建FastAPI应用
app = FastAPI(
    title="产品运营平台 API",
    description="""
## 产品运营平台后端接口

### 功能模块
- **指标管理**: 增删改查指标数据
- **分类管理**: 支持总览、导购/交易/智选车/公告多维度分类
- **指标类型**: 支持业务指标、研发指标分类
- **数据类型**: 支持数值、百分比、趋势等类型
- **搜索筛选**: 支持关键词搜索和多条件筛选

### 分类说明
- **overview**: 总览指标
- **product_a**: 导购产品指标
- **product_b**: 交易产品指标
- **product_c**: 智选车产品指标
- **product_d**: 公告产品指标

### 指标类型
- **business**: 业务指标
- **tech**: 研发指标

### 数据类型
- **number**: 数值型
- **percentage**: 百分比型
- **trend**: 趋势型
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
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
app.include_router(project_router)


@app.on_event("startup")
async def startup_event():
    """应用启动时初始化测试数据"""
    init_test_data()


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
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
