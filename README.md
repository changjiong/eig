# EIG - 企业智能图谱系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)

> 一个基于现代Web技术栈构建的企业智能图谱系统，专注于企业关系网络分析、风险评估和客户管理。

## 📖 项目概览

EIG (Enterprise Intelligence Graph) 是一个企业智能图谱系统，旨在构建企业关系网络的分析平台，支持：

- 🏢 **企业数据管理** - 完整的企业信息管理和维护
- 🕸️ **关系网络分析** - 可视化企业间复杂关系
- ⚠️ **风险评估** - 智能风险识别和预警
- 👥 **客户管理** - 全方位客户生命周期管理
- 📊 **数据可视化** - 直观的图表和图谱展示
- 🔐 **权限管理** - 基于角色的精细化权限控制

## 🚀 技术架构

### 前端技术栈
- **框架**: React 18.2 + TypeScript 5.7 + Vite 6.3
- **UI库**: shadcn/ui + Tailwind CSS 3
- **路由**: React Router 6.22
- **图表**: D3.js 7.8 + Recharts 2.15
- **状态管理**: Zustand 5.0

### 后端技术栈
- **框架**: Express 5.1 + TypeScript 5.9
- **数据库**: PostgreSQL 
- **认证**: JWT + bcryptjs
- **安全**: Helmet + CORS
- **日志**: Morgan

## 📁 项目结构

```
EIG/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── components/       # React组件
│   │   ├── pages/           # 页面组件
│   │   ├── contexts/        # React上下文
│   │   ├── services/        # API服务
│   │   └── types/           # 类型定义
│   ├── package.json
│   └── README.md
├── backend/                 # 后端API
│   ├── src/
│   │   ├── config/          # 配置文件
│   │   ├── controllers/     # 控制器
│   │   ├── middleware/      # 中间件
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由定义
│   │   ├── services/        # 业务逻辑
│   │   └── types/           # 类型定义
│   ├── scripts/             # 脚本文件
│   ├── package.json
│   └── README.md
└── README.md               # 项目主文档
```

## 🏗️ 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 12+
- npm 或 yarn 或 bun

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd EIG
```

2. **安装前端依赖**
```bash
cd frontend
npm install
```

3. **安装后端依赖**
```bash
cd ../backend
npm install
```

4. **配置数据库**
```bash
# 创建PostgreSQL数据库
createdb eig_database

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库连接等配置

# 初始化数据库
npm run db:init
```

5. **启动开发环境**
```bash
# 启动后端服务 (终端1)
cd backend
npm run dev

# 启动前端服务 (终端2)  
cd frontend
npm run dev
```

6. **访问应用**
- 前端: http://localhost:5173
- 后端API: http://localhost:3001
- 健康检查: http://localhost:3001/health

### 测试账号

系统提供以下测试账号：

| 角色 | 邮箱 | 密码 | 权限描述 |
|------|------|------|----------|
| 管理员 | admin@eig.com | admin123 | 所有功能权限 |
| 经理 | manager@eig.com | manager123 | 业务管理权限 |
| 分析师 | analyst@eig.com | analyst123 | 数据分析权限 |
| 查看员 | viewer@eig.com | viewer123 | 基础查看权限 |

## ✅ 已完成功能

### 基础架构 (90%)
- [x] 前后端分离架构
- [x] TypeScript配置
- [x] 开发环境配置
- [x] 项目结构规范

### 认证系统 (95%)
- [x] JWT token认证
- [x] 角色权限控制 (admin/manager/analyst/viewer)
- [x] 权限中间件
- [x] 前端认证上下文
- [x] 登录/登出功能

### 数据库设计 (90%)
- [x] 完整表结构设计
- [x] 用户、企业、客户、关系表
- [x] 数据源管理表
- [x] 索引优化
- [x] 数据库初始化脚本
- [x] 种子数据

### 后端API框架 (25%)
- [x] Express服务器配置
- [x] 认证路由 (`/auth`)
- [x] 企业管理路由 (`/enterprises`) - 部分完成
- [x] 完整的错误处理
- [x] CORS和安全配置

### 前端页面结构 (20%)
- [x] 路由保护机制
- [x] 主要页面组件框架
- [x] UI组件库集成 (shadcn/ui)
- [x] 响应式布局准备

## 🔄 待完成功能

### 核心业务功能
- [ ] 企业关系图谱可视化 (D3.js)
- [ ] 关系路径分析算法  
- [ ] 数据源连接器
- [ ] 批量数据导入
- [ ] 客户管理完整功能
- [ ] 全文搜索系统
- [ ] 风险评估算法
- [ ] 预警机制

### 技术完善
- [ ] 剩余API路由实现
- [ ] 前端页面功能实现
- [ ] API接口对接
- [ ] 数据可视化图表
- [ ] 单元测试
- [ ] 集成测试
- [ ] Docker部署配置

## 📈 开发进度

**整体完成度: ~35%**

| 模块 | 进度 | 状态 |
|------|------|------|
| 项目架构和基础设施 | 90% | ✅ 已完成 |
| 认证授权系统 | 95% | ✅ 已完成 |
| 数据库设计 | 90% | ✅ 已完成 |
| 后端API实现 | 25% | 🔄 进行中 |
| 前端页面功能 | 20% | 🔄 进行中 |
| 业务逻辑实现 | 5% | ❌ 待开始 |
| 测试和部署 | 0% | ❌ 待开始 |

## 🎯 API 端点

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

### 客户管理 (待实现)
- `GET /api/v1/clients` - 获取客户列表
- `GET /api/v1/clients/:id` - 获取客户详情
- `POST /api/v1/clients` - 创建客户
- `PUT /api/v1/clients/:id` - 更新客户

### 图谱数据 (待实现)
- `GET /api/v1/graph` - 获取图谱数据
- `GET /api/v1/graph/enterprise/:id` - 获取企业关系图谱
- `GET /api/v1/graph/path` - 获取关系路径

## 🔐 权限系统

系统采用基于角色的权限控制(RBAC)：

### 角色定义
- **admin** - 系统管理员：所有权限
- **manager** - 部门经理：管理权限  
- **analyst** - 数据分析师：分析权限
- **viewer** - 客户经理：查看权限

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

## 🛠️ 开发命令

### 后端
```bash
cd backend
npm run dev        # 开发模式启动
npm run build      # 构建项目
npm start          # 生产环境启动
npm run db:init    # 初始化数据库
```

### 前端
```bash
cd frontend
npm run dev        # 开发模式启动
npm run build      # 构建项目
npm run preview    # 预览构建结果
npm run lint       # 代码检查
```

## 📝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🤝 支持

如果你觉得这个项目对你有帮助，请给一个 ⭐️ 支持！

如有问题或建议，请提交 [Issue](https://github.com/your-username/EIG/issues)。

---

**EIG Team** © 2025