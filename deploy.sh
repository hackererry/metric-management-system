#!/bin/bash
# 一键部署脚本

echo "========== 开始部署产品运营平台 =========="

# 项目根目录
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查Python
if ! command -v py &> /dev/null; then
    echo -e "${RED}错误: 未找到Python，请先安装Python 3.8+${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/4] 安装后端依赖...${NC}"
cd "$PROJECT_DIR/backend"
pip install -r requirements.txt -q

echo -e "${YELLOW}[2/4] 安装前端依赖...${NC}"
cd "$PROJECT_DIR/frontend"
npm install --legacy-peer-deps -q

echo -e "${YELLOW}[3/4] 构建前端...${NC}"
npm run build

echo -e "${YELLOW}[4/4] 启动服务...${NC}"
# 停止现有进程
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

# 启动后端
cd "$PROJECT_DIR/backend"
py main.py &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端（生产模式）
cd "$PROJECT_DIR/frontend"
npx serve -s build -l 3000 &
FRONTEND_PID=$!

echo -e "${GREEN}========== 部署完成 ==========${NC}"
echo -e "前端地址: http://localhost:3000"
echo -e "后端API: http://localhost:8000"
echo -e "API文档: http://localhost:8000/docs"
echo ""
echo "后端进程: $BACKEND_PID"
echo "前端进程: $FRONTEND_PID"
echo ""
echo "停止服务命令: kill $BACKEND_PID $FRONTEND_PID"
