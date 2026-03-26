# 前端 Dockerfile - 多阶段构建

# 阶段1: 构建应用
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 设置生产环境变量并构建
ENV REACT_APP_API_URL=http://backend:8000
RUN npm run build

# 阶段2: 使用 Nginx 服务静态文件
FROM nginx:alpine

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/build /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
