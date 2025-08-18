# EIG Backend API

企业智能图谱后端API服务

## 🚀 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 12+
- npm 或 yarn

### 安装步骤

1. **安装依赖**
```bash
cd backend
npm install
```

2. **安装TypeScript类型定义**
```bash
npm install -D @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/pg @types/uuid @types/morgan typescript ts-node nodemon
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，设置数据库连接等配置
```

4. **设置数据库**
```bash
# 创建PostgreSQL数据库
createdb eig_database

# 运行数据库初始化（开发中...）
npm run db:init
```

5. **启动开发服务器**
```bash
npm run dev
```

## 📁 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   │   ├── app.ts       # 应用配置
│   │   └── database.ts  # 数据库配置
│   ├── controllers/     # 控制器层
│   ├── middleware/      # 中间件
│   │   └── auth.ts      # 认证中间件
│   ├── models/          # 数据模型
│   ├── routes/          # 路由定义
│   │   ├── auth.ts      # 认证路由
│   │   ├── enterprise.ts # 企业路由
│   │   ├── client.ts    # 客户路由
│   │   ├── graph.ts     # 图谱路由
│   │   ├── data.ts      # 数据管理路由
│   │   └── user.ts      # 用户管理路由
│   ├── services/        # 服务层
│   │   └── authService.ts # 认证服务
│   ├── types/           # 类型定义
│   │   └── database.ts  # 数据库类型
│   ├── utils/           # 工具函数
│   └── server.ts        # 主服务器入口
├── package.json
├── tsconfig.json
└── README.md
```

## 🌐 API端点

### 认证相关
- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/auth/me` - 获取当前用户信息
- `POST /api/v1/auth/logout` - 用户登出
- `POST /api/v1/auth/refresh` - 刷新token

### 企业数据
- `GET /api/v1/enterprises` - 获取企业列表
- `GET /api/v1/enterprises/:id` - 获取企业详情
- `POST /api/v1/enterprises` - 创建企业
- `PUT /api/v1/enterprises/:id` - 更新企业
- `DELETE /api/v1/enterprises/:id` - 删除企业

### 客户管理
- `GET /api/v1/clients` - 获取客户列表
- `GET /api/v1/clients/:id` - 获取客户详情
- `POST /api/v1/clients` - 创建客户
- `PUT /api/v1/clients/:id` - 更新客户
- `DELETE /api/v1/clients/:id` - 删除客户

### 图谱数据
- `GET /api/v1/graph` - 获取图谱数据
- `GET /api/v1/graph/enterprise/:id` - 获取企业关系图谱
- `GET /api/v1/graph/path` - 获取两个实体间的关系路径

### 数据管理
- `GET /api/v1/data/sources` - 获取数据源列表
- `GET /api/v1/data/tasks` - 获取导入任务列表
- `POST /api/v1/data/import` - 创建数据导入任务

### 用户管理
- `GET /api/v1/users` - 获取用户列表（管理员）
- `POST /api/v1/users` - 创建用户（管理员）
- `PUT /api/v1/users/:id` - 更新用户（管理员）

## 🔐 认证与权限

系统使用JWT进行认证，支持基于角色的权限控制：

### 角色类型
- `admin` - 系统管理员（所有权限）
- `manager` - 部门经理（管理权限）
- `analyst` - 数据分析师（分析权限）
- `viewer` - 客户经理（查看权限）

### 权限列表
- `view_dashboard` - 查看工作台
- `view_enterprise` - 查看企业数据
- `view_graph` - 查看图谱
- `view_prospects` - 查看潜在客户
- `view_search` - 使用搜索功能
- `view_clients` - 查看客户
- `manage_data` - 管理数据
- `manage_system` - 系统管理
- `export_data` - 导出数据
- `import_data` - 导入数据
- `user_management` - 用户管理

## 🗄️ 数据库架构

### 主要数据表
- `users` - 用户表
- `enterprises` - 企业表
- `persons` - 人员表
- `products` - 产品表
- `relationships` - 关系表
- `clients` - 客户表
- `data_sources` - 数据源表
- `data_import_tasks` - 数据导入任务表
- `system_configs` - 系统配置表
- `operation_logs` - 操作日志表

## 🔧 开发命令

```bash
# 开发模式启动
npm run dev

# 构建项目
npm run build

# 启动生产服务
npm start

# 运行测试
npm test
```

## 🌍 环境配置

### 开发环境 (.env)
```bash
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eig_database
DB_USER=eig_user
DB_PASSWORD=eig_password
JWT_SECRET=eig_jwt_secret_key_2025_very_secure
CORS_ORIGIN=http://localhost:5173
```

### 生产环境
根据实际部署环境调整配置参数。

## 📝 开发状态

- [x] 项目结构搭建
- [x] TypeScript配置
- [x] 认证系统（JWT）
- [x] 认证中间件
- [x] 基础路由框架
- [x] 数据库类型定义
- [ ] 数据库连接和表结构
- [ ] 完整的API路由实现
- [ ] 数据模型和服务层
- [ ] 单元测试
- [ ] API文档

## 🚧 注意事项

1. 当前版本处于开发阶段，部分功能尚未实现
2. 需要先安装并配置PostgreSQL数据库
3. 请确保环境变量配置正确
4. 生产环境请使用强密码和安全的JWT密钥

## 📞 技术支持

如有问题，请联系开发团队。 