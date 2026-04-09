# CLAUDE.md

## 项目概述

企业级指标管理与可视化看板系统（产品运营平台），前后端分离架构，支持指标分类、状态监控、项目专题和数据可视化。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18.2 + TypeScript 4.9 + Ant Design 5.12 + ECharts 5.4 + React Router 6.20 |
| 后端 | Python 3.9+ / FastAPI + SQLAlchemy 2.0 + Pydantic 2.5 |
| 数据库 | SQLite (`metrics_final.db`) |
| 部署 | Docker Compose（nginx + uvicorn 双容器） |

## 项目结构

```
metric-management-system/
├── backend/
│   ├── app/                          # Python 包（标准 FastAPI 项目结构）
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI 入口 + lifespan（替代 on_event）
│   │   ├── config.py                 # pydantic-settings 配置（DATABASE_URL）
│   │   ├── database.py               # SQLAlchemy engine/SessionLocal/Base/get_db
│   │   ├── seed.py                   # init_test_data() 种子数据
│   │   ├── models/
│   │   │   ├── __init__.py           # 重导出 Metric, Project, ProjectMetric
│   │   │   ├── metric.py             # Metric ORM 模型
│   │   │   └── project.py            # Project + ProjectMetric ORM 模型
│   │   ├── schemas/
│   │   │   ├── __init__.py           # 重导出所有枚举和 Pydantic 模型
│   │   │   ├── metric.py             # 5 枚举 + Metric 相关 schema
│   │   │   └── project.py            # ProjectStatusEnum + Project 相关 schema
│   │   ├── crud/
│   │   │   ├── __init__.py           # 重导出 MetricCRUD, ProjectCRUD
│   │   │   ├── metric.py             # MetricCRUD 类
│   │   │   └── project.py            # ProjectCRUD 类
│   │   └── api/
│   │       ├── __init__.py           # 重导出路由
│   │       ├── metrics.py            # /api/metrics 路由（9 端点）
│   │       └── projects.py           # /api/projects 路由（9 端点）
│   ├── tests/
│   │   ├── conftest.py               # 内存 SQLite (StaticPool) + TestClient
│   │   ├── test_database.py          # 6 tests - 模型 CRUD、时间戳、唯一约束
│   │   ├── test_schemas.py           # 13 tests - 枚举、验证规则、默认值
│   │   ├── test_crud.py              # 15 tests - CRUD、分页、筛选、批量更新
│   │   └── test_api.py               # 21 tests - HTTP 接口、验证、错误处理
│   ├── metrics_final.db              # SQLite 数据库（活跃）
│   ├── requirements.txt
│   └── Dockerfile                    # CMD: uvicorn app.main:app
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # 根组件（侧边栏布局 + 路由）
│   │   ├── types/index.ts        # TypeScript 类型、枚举、配置对象
│   │   ├── services/api.ts       # Axios API 客户端（metricApi, projectApi）
│   │   ├── components/
│   │   │   ├── MetricCard.tsx         # 单指标卡片（值/目标/趋势/完成率）
│   │   │   ├── MetricTable.tsx        # 指标表格（搜索/筛选/分页/CRUD）
│   │   │   ├── MetricForm.tsx         # 指标创建/编辑表单
│   │   │   ├── MetricChart.tsx        # 柱状+折线混合图
│   │   │   ├── AnnualMetricsCard.tsx  # 年度指标（按维度分组，月度数据）
│   │   │   ├── MonthlyLineChart.tsx   # 月度趋势折线图
│   │   │   ├── ProductTeamRadarCard.tsx # 产品团队雷达图
│   │   │   ├── ProjectForm.tsx        # 项目创建/编辑表单
│   │   │   └── AddMetricModal.tsx     # 向项目添加指标的弹窗
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # / 主看板
│   │   │   ├── ProjectPage.tsx        # /projects 项目列表
│   │   │   ├── ProjectDetailPage.tsx  # /projects/:id 项目详情
│   │   │   └── MetricManagement.tsx   # /management 指标管理
│   │   └── __tests__/                 # 前端测试（~41 tests）
│   │       ├── index.test.ts          # 类型定义和配置对象
│   │       ├── api.test.ts            # API 方法契约
│   │       ├── MetricCard.test.tsx
│   │       ├── AnnualMetricsCard.test.tsx
│   │       └── ProductTeamRadarCard.test.tsx
│   ├── nginx.conf                # 反向代理 /api/ → backend:8000
│   ├── Dockerfile                # 多阶段构建（node:18-alpine + nginx:alpine）
│   └── package.json              # proxy: http://localhost:8000
├── docker-compose.yml            # metric-network, 双容器编排
├── deploy.bat / deploy.sh        # 部署脚本
└── README.md
```

## 数据模型

### Metric（指标）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | 主键 |
| name | str(100) | 指标名称 |
| code | str(50) UNIQUE | 指标编码 |
| category | str(50) | 分类：overview / product_a / product_b / product_c / product_d |
| metric_type | str(20) | 类型：business / tech |
| data_type | str(20) | 数据类型：number / percentage / trend |
| dimension | str(20) | 维度：quality / efficiency / experience / business |
| lower_is_better | bool | 达标规则（True=越低越好，默认True） |
| unit | str(20) | 单位 |
| value | float | 当前值 |
| target_value | float | 目标值 |
| challenge_value | float | 挑战值 |
| previous_value | float | 上期值 |
| trend | str(10) | 趋势：up / down / stable |
| description | text | 描述 |
| is_active | bool | 是否启用（默认True） |

### Project（项目）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | 主键 |
| name | str(100) | 项目名称 |
| code | str(50) UNIQUE | 项目编码 |
| description | text | 描述 |
| status | str(20) | 状态：active / completed / archived |
| start_date / end_date | datetime | 起止日期 |

### ProjectMetric（项目-指标关联）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | 主键 |
| project_id | int FK | 项目 ID（CASCADE） |
| metric_id | int FK | 指标 ID（CASCADE） |
| target_value | float | 覆盖目标值 |

唯一约束：`(project_id, metric_id)`

## API 接口

> **规范：前后端交互统一使用 POST 请求**（仅 `GET /` 和 `GET /health` 基础设施端点保留 GET）

### 指标接口 `/api/metrics`

| 方法 | 路径 | 请求体 | 说明 |
|------|------|--------|------|
| POST | /create | MetricCreate | 创建指标 |
| POST | /list | MetricListRequest | 获取指标列表（分页，支持 category/is_active/keyword 筛选） |
| POST | /get | {id} | 获取单个指标 |
| POST | /update | MetricUpdateRequest（含 id） | 更新指标 |
| POST | /delete | {id} | 删除指标 |
| POST | /stats | {} | 获取分类统计 |
| POST | /category/query | {category} | 按分类获取活跃指标 |
| POST | /category/grouped | {category} | 按分类获取分组指标（按维度分组） |
| POST | /batch-update | {"code": value, ...} | 批量更新指标值（自动计算趋势） |
| POST | /history/query | {category, year} | 获取分类月度历史数据 |
| POST | /history/batch | MetricHistoryCreate[] | 批量写入月度历史 |

### 专项项目接口 `/api/special-projects`

| 方法 | 路径 | 请求体 | 说明 |
|------|------|--------|------|
| POST | /create | SpecialProjectCreate | 创建专项项目 |
| POST | /list | SpecialProjectListRequest | 获取项目列表（分页，支持 status/keyword 筛选） |
| POST | /get | {id} | 获取单个项目 |
| POST | /update | SpecialProjectUpdateRequest（含 id） | 更新项目 |
| POST | /delete | {id} | 删除项目（级联删除目标） |
| POST | /budget/update | {id, used_days} | 更新预算使用 |
| POST | /targets/create | {project_id, target 字段} | 创建目标 |
| POST | /targets/update | {project_id, target_id, target 字段} | 更新目标 |
| POST | /targets/delete | {project_id, target_id} | 删除目标 |
| POST | /targets/progress | {project_id, target_id, current_value} | 更新目标进度 |

### 基础接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | / | API 信息 |
| GET | /health | 健康检查 |

## 测试规则

**任何代码修改后必须执行对应测试。**

### 按修改模块选择测试

| 修改模块 | 后端 | 前端 |
|---------|------|------|
| app/models/ 模型 | `pytest tests/test_database.py -v` | - |
| app/schemas/ 验证 | `pytest tests/test_schemas.py -v` | `npm test -- --testPathPattern=types` |
| app/crud/ 操作 | `pytest tests/test_crud.py -v` | - |
| app/api/ 路由 | `pytest tests/test_api.py -v` | - |
| services/api.ts | - | `npm test -- --testPathPattern=api.test` |
| 组件 | - | `npm test -- --testPathPattern=<组件名>` |
| 多模块 | `pytest tests/ -v` | `npm test` |

### 关联影响检查

大修改时需：检查调用关系 → 评估影响 → 同步修改相关代码 → 更新测试。

## Docker 部署

```bash
docker-compose up -d --build    # 构建并启动
docker-compose ps               # 查看状态
docker-compose logs -f          # 查看日志
docker-compose down             # 停止
docker-compose up -d --build    # 代码更新后重建
```

- 后端：`metric-backend`，端口 8000，volume 挂载 `metrics_final.db`
- 前端：`metric-frontend`，端口 80，nginx 反向代理 `/api/` → `backend:8000`
- 网络：`metric-network`
- 前端 `api.ts` 的 `baseURL` 必须为 `/api`（相对路径）

## 端口

| 服务 | 端口 |
|------|------|
| 后端 | 8000 |
| 前端开发 | 3000 |
| 前端生产 | 80 |

## 重要规则

1. **修改后必须执行测试** - 验证修改正确性
2. **数据库变更同步模型** - 修改 `app/models/` 后重启服务自动建表
3. **前后端联调注意端口** - 后端 8000，前端 3000，确保 CORS 配置正确
4. **大变动更新 README.md** - 引入新库时更新 requirements.txt
5. **所有代码文件使用 UTF-8 编码**
6. **后端用 Pydantic 验证，前端用 TypeScript 类型检查**
7. **后端包结构** - `app/` 包下分层：`models/`、`schemas/`、`crud/`、`api/`，import 路径为 `from app.xxx import Yyy`
8. **前后端交互统一使用 POST 请求** - 所有数据接口一律用 POST，参数通过请求体传递（仅 `GET /` 和 `GET /health` 保留 GET）
