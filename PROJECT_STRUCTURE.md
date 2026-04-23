# 产品运营平台

## 项目结构

```
metric-management-system/
├── backend/                         # 后端代码
│   ├── main.py                     # FastAPI主应用入口
│   ├── database.py                 # 数据库模型和测试数据
│   ├── schemas.py                  # Pydantic数据验证模型
│   ├── crud.py                     # 数据库CRUD操作
│   ├── routers.py                 # API路由定义
│   ├── requirements.txt            # Python依赖
│   └── metrics.db                  # SQLite数据库文件
│
└── frontend/                        # 前端代码
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── MetricCard.tsx     # 指标卡片组件
    │   │   ├── MetricForm.tsx     # 指标表单组件
    │   │   ├── MetricChart.tsx   # 图表组件(当前未使用)
    │   │   └── MetricTable.tsx    # 指标列表组件
    ├── pages/
    │   │   ├── Dashboard.tsx     # 数据看板页面
    │   │   └── MetricManagement.tsx  # 指标管理页面
    ├── services/
    │   └── api.ts                  # API服务封装
    ├── types/
    │   └── index.ts              # TypeScript类型定义
    ├── App.tsx                    # 主应用组件
    ├── App.css                   # 样式文件
    ├── index.tsx                # 入口文件
    ├── package.json
    ├── tsconfig.json
    └── .env                        # 环境配置
```

---

## 技术栈

### 后端
- **Python 3.8+**
- **FastAPI** - Web框架
- **SQLAlchemy** - ORM
- **Pydantic** - 数据验证
- **SQLite** - 数据库

### 前端
- **React 18**
- **TypeScript**
- **Ant Design 5** - UI组件库
- **Axios** - HTTP客户端
- **React Router 6** - 路由

---

## 启动步骤

### 后端启动

```bash
cd backend

# 创建虚拟环境（推荐）
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

后端启动后访问:
- API服务: http://localhost:8000
- API文档: http://localhost:8000/docs
- ReDoc文档: http://localhost:8000/redoc

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

前端启动后访问: http://localhost:3000

---

## 功能验证

### 新增指标

1. 打开前端页面 http://localhost:3000
2. 点击左侧菜单「指标管理」
3. 点击「新增指标」按钮
4. 填写表单:
   - **指标名称**: 如 "新用户注册数"
   - **指标编码**: 如 "new_users" (英文、数字、下划线)
   - **所属分类**: 选择 总览/产品A/产品B/产品C
   - **指标类型**: 选择 业务指标 或 研发指标
   - **数据类型**: 选择 数值/百分比/趋势
   - **当前值**: 输入数值
   - **达标值**: 可选，用于计算完成率
   - **单位**: 如 "人"、"万元"、"%"
   - **趋势**: 选择 上升/下降/持平
   - **描述**: 指标说明
5. 点击确定保存

### 查看看板

1. 点击左侧菜单「数据看板」
2. 查看各产品团队的指标卡片
3. 点击任意卡片，查看详细指标列表
4. 业务指标和研发指标分开展示

---

## API接口

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | /api/metrics/ | 获取指标列表 |
| POST | /api/metrics/ | 创建指标 |
| GET | /api/metrics/{id} | 获取单个指标 |
| PUT | /api/metrics/{id} | 更新指标 |
| DELETE | /api/metrics/{id} | 删除指标 |
| GET | /api/metrics/category/{category} | 按分类获取指标 |
| GET | /api/metrics/category/{category}/grouped | 按分类获取分组指标 |
| GET | /api/metrics/stats | 获取统计信息 |
| POST | /api/metrics/batch-update | 批量更新值 |

---

## 测试数据

系统启动时自动初始化测试数据，包含:

### 总览
- 业务指标: 用户数、活跃用户、收入、转化率
- 研发指标: API响应时间、服务可用性、代码覆盖率、Bug修复率

### 产品A/B/C
- 业务指标: 日活、收入、满意度等
- 研发指标: 崩溃率、启动时间、接口成功率等
