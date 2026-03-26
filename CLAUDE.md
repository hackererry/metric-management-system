# CLAUDE.md

## 项目概述

企业级指标管理与可视化看板系统，采用前后端分离架构，支持多维度指标分类、状态监控和数据可视化。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18.2 + TypeScript 4.9 | UI 框架 |
| 前端组件库 | Ant Design 5.12 | UI 组件库 |
| 前端可视化 | ECharts 5.4 | 数据可视化 |
| 前端路由 | React Router 6.20 | 路由管理 |
| 后端 | Python 3.9+ / FastAPI 0.104 | Web 框架 |
| ORM | SQLAlchemy 2.0 | 数据库操作 |
| 数据验证 | Pydantic 2.5 | 数据验证 |
| 数据库 | SQLite | 默认数据库 |

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
│   │   ├── components/           # React 组件
│   │   ├── pages/                # 页面组件
│   │   ├── services/             # API 服务
│   │   ├── types/                # TypeScript 类型
│   │   ├── App.tsx               # 根组件
│   │   ├── index.tsx             # 入口文件
│   │   └── setupTests.ts         # 测试环境配置
│   ├── public/                   # 静态资源
│   ├── build/                   # 构建输出
│   └── package.json
│
└── README.md
```

## 核心模块说明

### 后端 (backend/)

| 文件 | 说明 |
|------|------|
| `main.py` | FastAPI 应用入口，CORS 配置 |
| `database.py` | SQLAlchemy 模型定义，数据库连接 |
| `schemas.py` | Pydantic 数据模型，数据验证 |
| `crud.py` | CRUD 操作实现 |
| `routers.py` | API 路由定义 |

### 前端 (frontend/src/)

| 文件夹 | 说明 |
|--------|------|
| `components/` | React 组件 |
| `pages/` | 页面组件 |
| `services/` | API 服务层 |
| `types/` | TypeScript 类型定义 |

### 关键组件

| 文件 | 说明 |
|------|------|
| `AnnualMetricsCard.tsx` | 年度指标卡片 |
| `MetricCard.tsx` | 指标卡片 |
| `MetricChart.tsx` | 指标图表 |
| `MetricForm.tsx` | 指标表单 |
| `MetricTable.tsx` | 指标表格 |
| `ProductTeamRadarCard.tsx` | 产品团队雷达图 |

## 测试

### 重要规则：代码修改后必须执行测试

**任何代码修改后，都必须执行对应的测试程序：**

#### 后端测试

```bash
cd backend

# 运行所有测试
pytest tests/ -v

# 运行特定测试文件
pytest tests/test_api.py -v

# 运行特定测试类
pytest tests/test_api.py::TestMetricAPI -v

# 运行特定测试函数
pytest tests/test_api.py::TestMetricAPI::test_create_metric -v

# 显示详细输出
pytest tests/ -v -s

# 生成覆盖率报告
pytest tests/ --cov=. --cov-report=html
```

#### 前端测试

```bash
cd frontend

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

### 按修改内容选择测试

| 修改内容 | 后端测试命令 | 前端测试命令 |
|---------|------------|-------------|
| 修改 `database.py` 模型 | `pytest tests/test_database.py -v` | - |
| 修改 `schemas.py` 模型 | `pytest tests/test_schemas.py -v` | `npm test -- --testPathPattern=types` |
| 修改 `crud.py` 操作 | `pytest tests/test_crud.py -v` | - |
| 修改 `routers.py` 路由 | `pytest tests/test_api.py -v` | - |
| 修改 API 服务 | - | `npm test -- --testPathPattern=api.test` |
| 修改组件 | - | `npm test -- --testPathPattern=components` |
| 修改多个模块 | `pytest tests/ -v` | `npm test` |

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

### 关联影响检查

**程序如果有大的修改，需要考虑关联影响：**

1. **检查调用关系**：分析修改的函数/类被哪些其他模块调用
2. **影响评估**：评估修改是否会影响其他程序的正常使用
3. **同步修改**：如果影响其他模块，需要同比修改相关代码
4. **更新测试**：如果修改影响到其他模块的接口或行为，需要同步修改测试代码

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
| target_value | float | 目标值 |
| previous_value | float | 上期值 |
| trend | enum | 趋势（上升/下降/持平） |
| description | string | 描述 |
| is_active | bool | 是否启用 |

### 枚举值

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

## 常见命令

### 后端启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动服务
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 测试运行

```bash
# 后端测试
cd backend
pytest tests/ -v

# 前端测试
cd frontend
npm test
```

## 重要规则

### 规则1：代码修改后必须执行测试

任何代码修改后，都必须执行对应的测试程序验证修改正确性。

### 规则2：数据库变更需同步模型

如需修改数据库结构，需修改 `backend/database.py` 中的模型定义，然后重启服务自动创建新数据库。

### 规则3：前后端联调注意端口

- 后端默认端口: 8000
- 前端默认端口: 3000
- 确保 CORS 配置正确

### 规则4：代码文件、架构或脚本参数大的变动时，需要更新README.md，涉及到引入新库的，需要更新requirements.txt

## 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 | 8000 | FastAPI 服务 |
| 前端开发 | 3000 | React 开发服务器 |
| 前端生产 | build/ | 构建产物 |

## 编码规范

1. **所有代码文件使用 UTF-8 编码**
2. **后端使用 Pydantic 进行数据验证**
3. **前端使用 TypeScript 进行类型检查**

## 项目状态

- [x] 指标 CRUD 操作
- [x] 多维度分类（质量/效率/体验/经营）
- [x] 产品团队雷达图可视化
- [x] 状态监控与达标判定
- [x] 批量更新指标值
- [x] 后端单元测试（pytest）
- [x] 前端单元测试（Jest + React Testing Library）
