# 产品运营指标管理平台

企业级指标管理与可视化看板系统，支持多维度指标分类、状态监控和数据可视化。

## 项目概述

本系统是一个面向产品运营团队的指标管理平台，采用前后端分离架构，实现指标的增删改查、状态监控、数据可视化等功能。

### 核心功能

- **指标管理**: 支持指标的完整 CRUD 操作，含创建、编辑、删除、批量更新
- **多维度分类**: 按业务维度（质量/效率/体验/经营）和产品团队（导购/交易/智选车/公告）双重分类
- **状态监控**: 实时展示指标达标状态，支持年度/月度数据筛选
- **数据可视化**: 雷达图展示、卡片式指标展示、月度趋势表格
- **达标判定**: 支持"越大越好"和"越小越好"两种达标规则配置

## 技术架构

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2 | UI 框架 |
| TypeScript | 4.9 | 类型安全 |
| Ant Design | 5.12 | UI 组件库 |
| ECharts | 5.4 | 数据可视化 |
| Axios | 1.6 | HTTP 客户端 |
| React Router | 6.20 | 路由管理 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.9+ | 运行环境 |
| FastAPI | 0.104 | Web 框架 |
| SQLAlchemy | 2.0 | ORM |
| SQLite | - | 数据库 |
| Pydantic | 2.5 | 数据验证 |
| Uvicorn | 0.24 | ASGI 服务器 |

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                      前端 (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Dashboard  │  │   Metric    │  │  ProductTeam    │  │
│  │  看板页面   │  │  Management │  │  RadarCard      │  │
│  │             │  │  指标管理   │  │  雷达图卡片     │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │                │                  │           │
│         └────────────────┼──────────────────┘           │
│                          │                              │
│                    ┌─────┴─────┐                        │
│                    │   API     │                        │
│                    │  Service  │                        │
│                    └─────┬─────┘                        │
└──────────────────────────┼──────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────┼──────────────────────────────┐
│                    后端 (FastAPI)                       │
│                    ┌─────┴─────┐                        │
│                    │   Routers  │                        │
│                    └─────┬─────┘                        │
│         ┌────────────────┼────────────────┐             │
│         │                │                │             │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐     │
│  │    CRUD     │  │  Schemas     │  │  Database   │     │
│  │  Operations │  │  Validation  │  │  SQLite     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## 项目结构

```
metric-management-system/
├── backend/                      # 后端项目
│   ├── main.py                   # FastAPI 应用入口
│   ├── database.py               # 数据库配置与模型定义
│   ├── schemas.py                # Pydantic 数据模型
│   ├── crud.py                   # CRUD 操作层
│   ├── routers.py                # API 路由定义
│   ├── metrics_final.db          # SQLite 数据库
│   ├── requirements.txt          # 生产依赖
│   ├── requirements-test.txt     # 测试依赖
│   └── tests/                    # 后端测试
│       ├── __init__.py
│       ├── conftest.py           # pytest 配置和 fixtures
│       ├── test_database.py      # 数据库模型测试
│       ├── test_schemas.py       # Pydantic 模型测试
│       ├── test_crud.py          # CRUD 操作测试
│       └── test_api.py           # API 接口测试
│
├── frontend/                     # 前端项目
│   ├── src/
│   │   ├── __tests__/             # 测试文件
│   │   │   ├── index.test.ts           # 类型测试
│   │   │   ├── api.test.ts             # API 服务测试
│   │   │   ├── MetricCard.test.tsx      # 指标卡片测试
│   │   │   ├── AnnualMetricsCard.test.tsx  # 年度指标卡片测试
│   │   │   └── ProductTeamRadarCard.test.tsx  # 雷达图测试
│   │   ├── components/           # React 组件
│   │   │   ├── AnnualMetricsCard.tsx    # 年度指标卡片
│   │   │   ├── MetricCard.tsx           # 指标卡片
│   │   │   ├── MetricChart.tsx          # 指标图表
│   │   │   ├── MetricForm.tsx           # 指标表单
│   │   │   ├── MetricTable.tsx          # 指标表格
│   │   │   └── ProductTeamRadarCard.tsx # 产品团队雷达图
│   │   ├── pages/                # 页面组件
│   │   │   ├── Dashboard.tsx           # 看板页面
│   │   │   └── MetricManagement.tsx     # 指标管理页面
│   │   ├── services/             # API 服务
│   │   │   └── api.ts
│   │   ├── types/                # TypeScript 类型
│   │   │   └── index.ts
│   │   ├── App.tsx               # 根组件
│   │   ├── index.tsx             # 入口文件
│   │   └── setupTests.ts         # 测试环境配置
│   ├── public/                   # 静态资源
│   ├── build/                   # 构建输出
│   └── package.json
│
└── README.md                     # 项目文档
```

## 快速开始

### 环境要求

- Python 3.9+
- Node.js 16+
- npm 或 yarn
- Docker & Docker Compose (可选，用于容器化部署)

### 方式一：Docker 部署（推荐）

使用 Docker Compose 一键部署前后端服务。

#### 前置条件

- Docker 20.10+
- Docker Compose 2.0+

#### 快速启动

```bash
# 在项目根目录执行
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost | Nginx 静态服务 |
| 后端 API | http://localhost:8000 | FastAPI 服务 |
| API 文档 | http://localhost:8000/docs | Swagger UI |
| ReDoc | http://localhost:8000/redoc | ReDoc 文档 |

#### Docker 常用命令

```bash
# 停止服务
docker-compose down

# 重新构建镜像
docker-compose build --no-cache

# 重启服务
docker-compose restart

# 查看前端日志
docker-compose logs -f frontend

# 查看后端日志
docker-compose logs -f backend

# 进入容器
docker exec -it metric-backend /bin/bash
docker exec -it metric-frontend /bin/sh
```

#### 数据持久化

数据库文件通过 volume 挂载持久化：
- 宿主机: `./backend/metrics_final.db`
- 容器内: `/app/metrics_final.db`

#### Docker 文件说明

| 文件 | 说明 |
|------|------|
| `docker-compose.yml` | Docker Compose 编排配置 |
| `backend/Dockerfile` | 后端镜像构建文件 |
| `frontend/Dockerfile` | 前端镜像构建文件（多阶段构建） |
| `frontend/nginx.conf` | Nginx 配置文件 |
| `.dockerignore` | Docker 构建忽略文件 |

### 方式二：本地开发部署

#### 后端启动

```bash
# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动服务（默认端口 8000）
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# 或直接运行
python main.py
```

服务启动后访问：
- API 文档: http://localhost:8000/docs
- ReDoc 文档: http://localhost:8000/redoc

### 前端启动

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

前端访问：http://localhost:3000

### 构建生产版本

```bash
cd frontend
npm run build
```

构建产物将输出到 `frontend/build/` 目录。

## 测试

### 后端测试

```bash
cd backend

# 安装测试依赖
pip install -r requirements-test.txt

# 运行所有测试
pytest tests/ -v

# 运行特定测试文件
pytest tests/test_api.py -v

# 运行特定测试类
pytest tests/test_api.py::TestMetricAPI -v

# 显示详细输出
pytest tests/ -v -s

# 生成覆盖率报告
pytest tests/ --cov=. --cov-report=html
```

### 前端测试

```bash
cd frontend

# 安装测试依赖（包含在 npm install 中）
npm install

# 运行所有测试
npm test

# 运行测试并显示详细信息
npm test -- --verbose

# 运行特定测试文件
npm test -- --testPathPattern=MetricCard.test.tsx

# 运行测试并生成覆盖率报告
npm test -- --coverage

# 监视模式运行测试
npm test -- --watch
```

### 测试文件说明

#### 后端测试 (backend/tests/)

| 文件 | 测试内容 |
|------|----------|
| `test_database.py` | Metric 模型创建、更新、删除、时间戳 |
| `test_schemas.py` | Pydantic 模型验证、枚举类型、默认值 |
| `test_crud.py` | CRUD 操作、分页、筛选、批量更新 |
| `test_api.py` | REST API 接口、请求验证、错误处理 |

#### 前端测试 (frontend/src/__tests__/)

| 文件 | 测试内容 |
|------|----------|
| `index.test.ts` | TypeScript 类型定义和配置对象 |
| `api.test.ts` | API 服务方法 |
| `MetricCard.test.tsx` | 指标卡片组件 |
| `AnnualMetricsCard.test.tsx` | 年度指标卡片组件 |
| `ProductTeamRadarCard.test.tsx` | 产品团队雷达图组件 |

## 数据模型

### 指标 (Metric)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| name | string | 指标名称 |
| code | string | 指标编码（唯一） |
| category | enum | 所属分类 |
| metric_type | enum | 指标类型（业务/研发） |
| data_type | enum | 数据类型（数值/百分比/趋势） |
| dimension | enum | 维度（质量/效率/体验/经营） |
| lower_is_better | bool | 达标规则 |
| unit | string | 单位 |
| value | float | 当前值 |
| target_value | float | 达标值 |
| previous_value | float | 上期值 |
| trend | enum | 趋势（上升/下降/持平） |
| description | string | 描述 |
| is_active | bool | 是否启用 |

### 枚举值说明

**分类 (Category)**
- `overview`: 总览
- `product_a`: 导购产品
- `product_b`: 交易产品
- `product_c`: 智选车产品
- `product_d`: 公告产品

**维度 (Dimension)**
- `quality`: 质量
- `efficiency`: 效率
- `experience`: 体验
- `business`: 经营

**指标类型 (MetricType)**
- `business`: 业务指标
- `tech`: 研发指标

**数据类型 (DataType)**
- `number`: 数值型
- `percentage`: 百分比型
- `trend`: 趋势型

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/metrics/ | 获取指标列表（支持分页、筛选） |
| GET | /api/metrics/{id} | 获取单个指标 |
| POST | /api/metrics/ | 创建指标 |
| PUT | /api/metrics/{id} | 更新指标 |
| DELETE | /api/metrics/{id} | 删除指标 |
| GET | /api/metrics/category/{category} | 按分类获取指标 |
| GET | /api/metrics/category/{category}/grouped | 按分类获取分组指标 |
| GET | /api/metrics/stats | 获取分类统计 |
| POST | /api/metrics/batch-update | 批量更新指标值 |

## 页面功能

### 指标看板总览

- 展示年度/月度指标数据
- 按维度（质量/效率/体验/经营）分类展示
- 圆形状态标识（绿色=全部达标，黄色=部分达标，红色=全部未达标）
- 支持月度数据筛选
- 月度数据表格（1-12月趋势）

### 指标管理

- 指标列表展示（支持分页、搜索）
- 创建新指标
- 编辑现有指标
- 删除指标
- 批量更新指标值

### 产品团队雷达图

- 四个产品团队卡片式展示
- 雷达图可视化各维度指标
- 支持点击选中查看详细指标

## 配置说明

### 数据库

默认使用 SQLite 数据库 `metrics_final.db`。如需切换其他数据库，修改 `backend/database.py` 中的连接字符串。

### 跨域配置

CORS 已配置允许所有来源。生产环境建议在 `backend/main.py` 中配置具体域名。

### 端口配置

- 后端默认端口: 8000
- 前端默认端口: 3000

## 业界普遍做法参考

1. **前后端分离**: 使用 Axios 进行 HTTP 通信，RESTful API 设计
2. **类型安全**: 前端 TypeScript + 后端 Pydantic 双类型校验
3. **组件化**: React 组件化开发，Ant Design 组件库
4. **数据可视化**: ECharts 雷达图、卡片图表
5. **状态管理**: React Hooks (useState/useEffect) 管理组件状态
6. **CRUD 模式**: 分离路由、CRUD 操作、数据模型层级
7. **响应式设计**: Ant Design Grid 系统实现响应式布局

## License

MIT
