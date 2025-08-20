# EIG 企业智能图谱 - 部署指南

## 目录
- [系统要求](#系统要求)
- [环境配置](#环境配置)
- [部署方式](#部署方式)
  - [Docker 部署](#docker-部署)
  - [手动部署](#手动部署)
  - [Kubernetes 部署](#kubernetes-部署)
- [监控和日志](#监控和日志)
- [安全配置](#安全配置)
- [性能优化](#性能优化)
- [故障排除](#故障排除)

## 系统要求

### 最低配置
- **CPU**: 2 核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **操作系统**: Linux (Ubuntu 20.04+, CentOS 8+) / macOS / Windows

### 推荐配置
- **CPU**: 4 核心
- **内存**: 8GB RAM
- **存储**: 50GB SSD
- **网络**: 1Gbps 带宽

### 软件依赖
- Docker 24.0+ 和 Docker Compose 2.0+
- Node.js 18+ (手动部署)
- PostgreSQL 15+ (手动部署)
- Nginx 1.20+ (可选)

## 环境配置

### 1. 克隆项目
```bash
git clone https://github.com/your-org/eig.git
cd eig
```

### 2. 环境变量配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

### 3. 重要配置项
```env
# 数据库配置
DB_PASSWORD=your-secure-database-password

# JWT 密钥 (生产环境必须更改)
JWT_SECRET=your-super-secret-jwt-key-256-bits-long

# CORS 来源
CORS_ORIGIN=https://your-domain.com

# SSL 证书路径 (HTTPS)
SSL_CERT_PATH=/path/to/your/cert.pem
SSL_KEY_PATH=/path/to/your/private.key
```

## 部署方式

### Docker 部署 (推荐)

#### 1. 基础部署
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 2. 生产环境部署
```bash
# 包含 Nginx 反向代理
docker-compose --profile production up -d

# 包含监控服务
docker-compose --profile monitoring up -d

# 包含日志收集
docker-compose --profile logging up -d

# 完整部署
docker-compose --profile production --profile monitoring --profile logging up -d
```

#### 3. 服务验证
```bash
# 检查健康状态
curl http://localhost:3001/health

# 检查前端访问
curl http://localhost:3000

# 检查数据库连接
docker-compose exec postgres psql -U eig_user -d eig_database -c "SELECT 1;"
```

### 手动部署

#### 1. 数据库设置
```bash
# 安装 PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE eig_database;
CREATE USER eig_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE eig_database TO eig_user;
\q
```

#### 2. 后端部署
```bash
cd backend

# 安装依赖
npm install

# 构建项目
npm run build

# 运行数据库迁移
npm run migrate

# 启动服务
npm start

# 或使用 PM2
npm install -g pm2
pm2 start dist/server.js --name eig-backend
```

#### 3. 前端部署
```bash
cd frontend

# 安装依赖
npm install

# 构建生产版本
npm run build

# 使用 Nginx 托管静态文件
sudo cp -r dist/* /var/www/html/
```

### Kubernetes 部署

#### 1. 创建命名空间
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: eig
```

#### 2. 数据库部署
```yaml
# k8s/postgres.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: eig
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: eig_database
        - name: POSTGRES_USER
          value: eig_user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

#### 3. 应用部署
```bash
# 应用所有配置
kubectl apply -f k8s/

# 查看状态
kubectl get pods -n eig

# 查看服务
kubectl get services -n eig
```

## 监控和日志

### 1. Prometheus 监控
访问 http://localhost:9090 查看 Prometheus 监控面板

### 2. Grafana 仪表板
访问 http://localhost:3003 查看 Grafana 仪表板
- 用户名: admin
- 密码: 在 .env 文件中配置

### 3. ELK 日志系统
访问 http://localhost:5601 查看 Kibana 日志分析

### 4. 应用监控端点
```bash
# 系统健康检查
curl http://localhost:3001/api/v1/monitoring/health

# 系统指标
curl http://localhost:3001/api/v1/monitoring/metrics

# API 统计
curl http://localhost:3001/api/v1/monitoring/api-stats
```

## 安全配置

### 1. SSL/TLS 配置
```nginx
# nginx/nginx.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. 防火墙配置
```bash
# UFW 防火墙规则
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. 数据库安全
```sql
-- 限制数据库用户权限
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO eig_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO eig_user;
```

## 性能优化

### 1. 数据库优化
```sql
-- 添加索引
CREATE INDEX idx_enterprises_name ON enterprises(name);
CREATE INDEX idx_enterprises_industry ON enterprises(industry);
CREATE INDEX idx_clients_status ON clients(status);

-- 更新统计信息
ANALYZE;

-- 配置 PostgreSQL
-- shared_buffers = 256MB
-- effective_cache_size = 1GB
-- work_mem = 4MB
```

### 2. 应用优化
```bash
# 启用 Gzip 压缩
# 在 nginx.conf 中添加
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# 启用缓存
# Redis 缓存配置
redis-cli config set maxmemory 100mb
redis-cli config set maxmemory-policy allkeys-lru
```

### 3. 容器资源限制
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## 故障排除

### 1. 常见问题

#### 数据库连接失败
```bash
# 检查数据库状态
docker-compose exec postgres pg_isready

# 查看数据库日志
docker-compose logs postgres

# 测试连接
docker-compose exec postgres psql -U eig_user -d eig_database -c "SELECT 1;"
```

#### 后端服务无法启动
```bash
# 查看后端日志
docker-compose logs backend

# 进入容器调试
docker-compose exec backend sh

# 检查环境变量
docker-compose exec backend env | grep DB_
```

#### 前端无法访问后端
```bash
# 检查网络连接
docker-compose exec frontend ping backend

# 查看 Nginx 配置
docker-compose exec nginx nginx -t

# 重新加载 Nginx
docker-compose exec nginx nginx -s reload
```

### 2. 性能问题

#### 慢查询诊断
```sql
-- 查看慢查询
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 查看锁等待
SELECT * FROM pg_stat_activity WHERE wait_event IS NOT NULL;
```

#### 内存使用监控
```bash
# 查看容器资源使用
docker stats

# 查看系统资源
htop
free -h
df -h
```

### 3. 日志分析

#### 应用日志
```bash
# 查看实时日志
docker-compose logs -f backend

# 过滤错误日志
docker-compose logs backend | grep ERROR

# 查看特定时间段日志
docker-compose logs --since="2024-01-01T00:00:00Z" backend
```

#### 系统日志
```bash
# 查看系统日志
journalctl -u docker
journalctl -f

# 查看磁盘空间
df -h
du -sh /var/lib/docker/
```

## 备份和恢复

### 1. 数据备份
```bash
# 数据库备份
docker-compose exec postgres pg_dump -U eig_user eig_database > backup.sql

# 完整备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U eig_user eig_database | gzip > backup_$DATE.sql.gz
```

### 2. 数据恢复
```bash
# 从备份恢复
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U eig_user eig_database
```

### 3. 自动备份
```bash
# 添加到 crontab
0 2 * * * /path/to/backup-script.sh
```

## 更新和维护

### 1. 应用更新
```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose build

# 滚动更新
docker-compose up -d --no-deps backend
```

### 2. 数据库迁移
```bash
# 运行迁移
docker-compose exec backend npm run migrate

# 回滚迁移
docker-compose exec backend npm run migrate:rollback
```

### 3. 健康检查
```bash
# 自动健康检查脚本
#!/bin/bash
curl -f http://localhost:3001/health || exit 1
curl -f http://localhost:3000 || exit 1
```

## 联系支持

如果遇到部署问题，请联系：
- 技术支持: support@eig.com
- 文档: https://docs.eig.com
- GitHub Issues: https://github.com/your-org/eig/issues