# 产品运营平台

一个基于 React + TypeScript + Ant Design + FastAPI 的多维度指标管理与可视化看板系统。

## 项目结构

```
metric-management-system/
├── backend/                    # 后端代码
│   ├── main.py                # FastAPI主应用
│   ├── database.py            # 数据库配置和模型
│   ├── schemas.py             # Pydantic数据模型
│   ├── crud.py                # 数据库操作
│   ├── routers.py             # API路由
│   └── requirements.txt       # Python依赖
│
└── frontend/                   # 前端代码
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/        # 组件
    │   │   ├── MetricCard.tsx
    │   │   ├── MetricForm.tsx
    │   │   ├── MetricChart.tsx
    │   │   └── MetricTable.tsx
    │   ├── pages/             # 页面
    │   │   ├── Dashboard.tsx
    │   │   └── MetricManagement.tsx
    │   ├── services/          # API服务
    │   │   └── api.ts
    │   ├── types/             # 类型定义
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── App.css
    │   └── index.tsx
    ├── package.json
    └── tsconfig.json
```

## 功能特性

### 指标管理
- ✅ 新增/编辑/删除指标
- ✅ 多维度分类（总览、产品A/B/C）
- ✅ 多种数据类型（数值、百分比、趋势）
- ✅ 目标值设置与完成率计算
- ✅ 环比变化自动计算
- ✅ 启用/停用状态切换
- ✅ 关键词搜索和多条件筛选

### 数据看板
- ✅ 总览统计卡片
- ✅ 分类标签页切换
- ✅ 指标卡片展示
- ✅ ECharts图表可视化
- ✅ 响应式布局

### 技术特性
- ✅ RESTful API设计
- ✅ 自动生成API文档（Swagger/ReDoc）
- ✅ 请求参数校验
- ✅ TypeScript类型安全
- ✅ SQLite数据库（无需额外安装）

---

## 快速启动

### 前置要求
- Python 3.8+
- Node.js 16+
- npm 或 yarn

### 第一步：启动后端

```bash
# 进入后端目录
cd backend

# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动后端服务
python main.py
```

后端启动成功后：
- API服务: http://localhost:8000
- Swagger文档: http://localhost:8000/docs
- ReDoc文档: http://localhost:8000/redoc

### 第二步：启动前端

**新开一个终端窗口**

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install
# 或使用 yarn
# yarn install

# 启动开发服务器
npm start
```

前端启动成功后会自动打开浏览器访问 http://localhost:3000

---

## 功能验证说明

### 如何新增指标

1. 打开系统，点击左侧菜单「指标管理」
2. 点击右上角「新增指标」按钮
3. 填写表单：
   - 指标名称：如 "新用户注册数"
   - 指标编码：如 "new_users"（只支持英文、数字、下划线）
   - 所属分类：选择 "总览/产品A/产品B/产品C"
   - 数据类型：选择 "数值/百分比/趋势"
   - 当前值：输入数值
   - 目标值：可选，用于计算完成率
   - 上一周期值：可选，用于计算环比
   - 趋势：选择 "上升/下降/持平"
   - 指标描述：可选
4. 点击确定保存

### 如何在看板中查看

1. 点击左侧菜单「数据看板」
2. 系统会显示总览分类的指标
3. 点击不同分类标签（总览/产品A/产品B/产品C）查看对应指标
4. 每个指标卡片显示：
   - 当前值和单位
   - 目标完成率
   - 环比变化
   - 趋势箭头

### API验证

访问 http://localhost:8000/docs 可以：
- 查看所有API接口
- 在线测试API
- 查看请求/响应格式

---

## API接口说明

### 指标管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/metrics/ | 获取指标列表 |
| POST | /api/metrics/ | 创建指标 |
| GET | /api/metrics/{id} | 获取单个指标 |
| PUT | /api/metrics/{id} | 更新指标 |
| DELETE | /api/metrics/{id} | 删除指标 |
| GET | /api/metrics/category/{category} | 按分类获取指标 |
| GET | /api/metrics/stats | 获取分类统计 |
| POST | /api/metrics/batch-update | 批量更新值 |

---

## 数据库说明

系统使用 SQLite 数据库，首次启动时会自动创建 `metrics.db` 文件。

### 数据模型

```python
class Metric:
    id: int              # 主键
    name: str            # 指标名称
    code: str            # 指标编码（唯一）
    category: str        # 分类
    data_type: str       # 数据类型
    unit: str            # 单位
    value: float         # 当前值
    target_value: float  # 目标值
    previous_value: float # 上期值
    trend: str           # 趋势
    description: str     # 描述
    is_active: bool      # 是否启用
    created_at: datetime # 创建时间
    updated_at: datetime # 更新时间
```

---

## 测试数据

系统首次启动时会自动初始化测试数据，包括：
- 总览指标：总用户数、月活、留存率、收入、转化率
- 产品A：日活、收入、满意度、崩溃率
- 产品B：日活、收入、使用时长、付费率
- 产品C：日活、收入、订单量、客单价

---

## 常见问题

### Q: 后端启动失败？
A: 确保已安装 Python 3.8+ 和所有依赖

### Q: 前端无法连接后端？
A: 确保后端已启动在 8000 端口，检查 package.json 中的 proxy 配置

### Q: 如何重置数据？
A: 删除 backend/metrics.db 文件，重启后端即可重新初始化测试数据

---

## 技术栈

### 前端
- React 18
- TypeScript 5
- Ant Design 5
- ECharts 5
- React Router 6
- Axios

### 后端
- Python 3.8+
- FastAPI
- SQLAlchemy
- Pydantic
- SQLite
- Uvicorn
