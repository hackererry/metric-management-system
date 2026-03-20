@echo off
chcp 65001 >nul
echo ========== 开始部署产品运营平台 ==========

set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo [1/4] 安装后端依赖...
cd /d "%PROJECT_DIR%backend"
pip install -r requirements.txt -q

echo [2/4] 安装前端依赖...
cd /d "%PROJECT_DIR%frontend"
call npm install --legacy-peer-deps -q

echo [3/4] 构建前端...
call npm run build

echo [4/4] 启动服务...
:: 停止现有进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

:: 启动后端
cd /d "%PROJECT_DIR%backend"
start "Backend" py main.py

:: 等待后端启动
timeout /t 3 /nobreak >nul

:: 启动前端（使用http-server）
cd /d "%PROJECT_DIR%frontend\build"
start "Frontend" python -m http.server 3000

echo ========== 部署完成 ==========
echo 前端地址: http://localhost:3000
echo 后端API: http://localhost:8000
echo API文档: http://localhost:8000/docs
echo.
pause
