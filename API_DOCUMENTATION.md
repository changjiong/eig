# EIG 企业智能图谱 API 文档

## 概述

EIG API 是一个 RESTful API，提供企业数据管理、关系图谱分析、风险评估等功能。

**基础信息:**
- 基础URL: `http://localhost:3001/api/v1`
- 认证方式: JWT Bearer Token
- 数据格式: JSON
- 字符编码: UTF-8

## 认证

### 获取访问令牌

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户名",
      "role": "analyst"
    }
  }
}
```

### 使用访问令牌

在请求头中包含 JWT 令牌：
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API 端点

### 1. 认证相关 (Authentication)

#### 用户注册
```http
POST /auth/register
```

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名",
  "department": "技术部",
  "role": "analyst"
}
```

#### 用户登录
```http
POST /auth/login
```

#### 获取当前用户信息
```http
GET /auth/me
Authorization: Bearer {token}
```

#### 刷新令牌
```http
POST /auth/refresh
Authorization: Bearer {token}
```

### 2. 企业管理 (Enterprises)

#### 获取企业列表
```http
GET /enterprises?page=1&pageSize=20&search=关键词&industry=行业&riskLevel=风险等级
Authorization: Bearer {token}
```

**查询参数:**
- `page`: 页码 (默认: 1)
- `pageSize`: 每页数量 (默认: 20, 最大: 100)
- `search`: 搜索关键词
- `industry`: 行业筛选
- `riskLevel`: 风险等级 (low/medium/high)
- `status`: 状态 (active/inactive/dissolved)
- `sortBy`: 排序字段
- `sortOrder`: 排序方向 (asc/desc)

**响应示例:**
```json
{
  "success": true,
  "data": {
    "enterprises": [
      {
        "id": "uuid",
        "name": "企业名称",
        "legal_name": "企业法定名称",
        "credit_code": "统一社会信用代码",
        "industry": "软件和信息技术服务业",
        "legal_representative": "法定代表人",
        "registered_capital": 10000000,
        "address": "注册地址",
        "phone": "联系电话",
        "email": "邮箱",
        "website": "网站",
        "status": "active",
        "risk_level": "low",
        "svs": 85.5,
        "des": 78.2,
        "nis": 92.1,
        "pcs": 88.7,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 150,
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalPages": 8
    }
  }
}
```

#### 获取单个企业
```http
GET /enterprises/{id}
Authorization: Bearer {token}
```

#### 创建企业
```http
POST /enterprises
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "新企业名称",
  "legal_name": "法定名称",
  "credit_code": "统一社会信用代码",
  "industry": "行业",
  "legal_representative": "法定代表人",
  "registered_capital": 5000000,
  "address": "注册地址",
  "phone": "010-12345678",
  "email": "contact@company.com",
  "website": "https://www.company.com",
  "status": "active",
  "risk_level": "low"
}
```

#### 更新企业
```http
PUT /enterprises/{id}
Authorization: Bearer {token}
```

#### 删除企业
```http
DELETE /enterprises/{id}
Authorization: Bearer {token}
```

#### 获取企业统计信息
```http
GET /enterprises/{id}/statistics
Authorization: Bearer {token}
```

#### 获取企业关系
```http
GET /enterprises/{id}/relationships
Authorization: Bearer {token}
```

#### 批量重新计算评分
```http
POST /enterprises/batch-score
Authorization: Bearer {token}
```

### 3. 客户管理 (Clients)

#### 获取客户列表
```http
GET /clients?page=1&pageSize=20&search=关键词&status=状态&priority=优先级
Authorization: Bearer {token}
```

#### 创建客户
```http
POST /clients
Authorization: Bearer {token}

{
  "name": "客户姓名",
  "company": "客户公司",
  "industry": "行业",
  "position": "职位",
  "email": "client@company.com",
  "phone": "手机号码",
  "status": "potential",
  "priority": "medium",
  "assigned_to": "负责人ID",
  "estimated_value": 100000,
  "notes": "备注信息",
  "tags": ["标签1", "标签2"]
}
```

#### 更新客户状态
```http
PUT /clients/{id}/status
Authorization: Bearer {token}

{
  "status": "active",
  "notes": "状态变更说明"
}
```

#### 批量更新客户状态
```http
POST /clients/batch-status
Authorization: Bearer {token}

{
  "clientIds": ["id1", "id2", "id3"],
  "status": "active"
}
```

### 4. 图谱数据 (Graph)

#### 获取图谱数据
```http
GET /graph/data?centerNodeId={id}&depth=2&nodeTypes=enterprise,person
Authorization: Bearer {token}
```

**查询参数:**
- `centerNodeId`: 中心节点ID
- `depth`: 关系深度 (1-3)
- `nodeTypes`: 节点类型过滤
- `relationshipTypes`: 关系类型过滤

**响应示例:**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "node-id",
        "name": "节点名称",
        "type": "enterprise",
        "properties": {
          "industry": "软件业",
          "risk_level": "low"
        }
      }
    ],
    "links": [
      {
        "source": "source-id",
        "target": "target-id",
        "type": "investment",
        "strength": 0.8,
        "properties": {
          "amount": 1000000,
          "date": "2024-01-01"
        }
      }
    ]
  }
}
```

#### 获取关系列表
```http
GET /graph/relationships
Authorization: Bearer {token}
```

#### 创建关系
```http
POST /graph/relationships
Authorization: Bearer {token}

{
  "from_id": "源节点ID",
  "from_type": "enterprise",
  "to_id": "目标节点ID",
  "to_type": "enterprise",
  "relationship_type": "investment",
  "strength": 0.8,
  "is_directional": true,
  "description": "关系描述",
  "metadata": {
    "amount": 1000000,
    "date": "2024-01-01"
  }
}
```

#### 获取最短路径
```http
GET /graph/shortest-path?fromId={id1}&toId={id2}&maxDepth=5
Authorization: Bearer {token}
```

#### 影响力分析
```http
POST /graph/influence-analysis
Authorization: Bearer {token}

{
  "nodeId": "分析节点ID",
  "depth": 3,
  "algorithm": "pagerank"
}
```

### 5. 搜索功能 (Search)

#### 基础搜索
```http
POST /search
Authorization: Bearer {token}

{
  "keyword": "搜索关键词",
  "entityType": "enterprises",
  "page": 1,
  "pageSize": 20
}
```

#### 高级搜索
```http
POST /search/advanced
Authorization: Bearer {token}

{
  "keyword": "搜索关键词",
  "entityType": "enterprises",
  "filters": {
    "industry": "软件业",
    "riskLevel": "low",
    "registeredCapitalMin": 1000000,
    "registeredCapitalMax": 100000000
  },
  "sortBy": "name",
  "sortOrder": "asc",
  "page": 1,
  "pageSize": 20
}
```

#### 搜索建议
```http
GET /search/suggestions?keyword=关键词&limit=10
Authorization: Bearer {token}
```

### 6. 数据管理 (Data)

#### 获取数据源
```http
GET /data/sources
Authorization: Bearer {token}
```

#### 创建数据源
```http
POST /data/sources
Authorization: Bearer {token}

{
  "name": "数据源名称",
  "type": "database",
  "config": {
    "host": "localhost",
    "port": 5432,
    "database": "source_db",
    "username": "user",
    "password": "password"
  }
}
```

#### 获取导入任务
```http
GET /data/import-tasks?status=pending&page=1&pageSize=20
Authorization: Bearer {token}
```

#### 创建导入任务
```http
POST /data/import-tasks
Authorization: Bearer {token}

{
  "name": "数据导入任务",
  "source_id": "数据源ID",
  "source_name": "数据源名称",
  "config": {
    "table": "enterprises",
    "mapping": {
      "name": "enterprise_name",
      "industry": "industry_code"
    }
  }
}
```

#### 文件上传
```http
POST /data/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: <Excel/CSV文件>
type: "enterprises"
```

### 7. 用户管理 (Users)

#### 获取用户列表 (管理员)
```http
GET /users?page=1&pageSize=20&role=analyst&status=active
Authorization: Bearer {token}
```

#### 获取用户详情
```http
GET /users/{id}
Authorization: Bearer {token}
```

#### 更新用户
```http
PUT /users/{id}
Authorization: Bearer {token}

{
  "name": "更新后的姓名",
  "department": "新部门",
  "role": "manager"
}
```

#### 删除用户 (软删除)
```http
DELETE /users/{id}
Authorization: Bearer {token}
```

#### 修改密码
```http
PUT /users/{id}/password
Authorization: Bearer {token}

{
  "currentPassword": "当前密码",
  "newPassword": "新密码"
}
```

### 8. 系统监控 (Monitoring)

#### 健康检查
```http
GET /monitoring/health
```

#### 系统状态 (管理员)
```http
GET /monitoring/status
Authorization: Bearer {token}
```

#### 实时指标 (管理员)
```http
GET /monitoring/metrics
Authorization: Bearer {token}
```

#### API统计 (管理员)
```http
GET /monitoring/api-stats
Authorization: Bearer {token}
```

### 9. 优化工具 (Optimization)

#### 性能报告 (管理员)
```http
GET /optimization/performance-report
Authorization: Bearer {token}
```

#### 慢查询分析 (管理员)
```http
GET /optimization/slow-queries?minDuration=1000
Authorization: Bearer {token}
```

#### 数据库健康评分 (管理员)
```http
GET /optimization/health-score
Authorization: Bearer {token}
```

### 10. 安全管理 (Security)

#### 获取安全统计 (管理员)
```http
GET /security/stats
Authorization: Bearer {token}
```

#### 生成CSRF令牌
```http
POST /security/csrf-token
Authorization: Bearer {token}
```

#### 修改密码
```http
POST /security/change-password
Authorization: Bearer {token}

{
  "currentPassword": "当前密码",
  "newPassword": "新密码"
}
```

## 错误处理

### 标准错误响应格式

```json
{
  "success": false,
  "message": "错误描述",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/v1/enterprises",
  "details": {
    "field": "具体错误字段",
    "value": "错误值"
  }
}
```

### 常见错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | VALIDATION_ERROR | 请求参数验证失败 |
| 401 | AUTHENTICATION_ERROR | 认证失败 |
| 403 | AUTHORIZATION_ERROR | 权限不足 |
| 404 | NOT_FOUND_ERROR | 资源不存在 |
| 409 | CONFLICT_ERROR | 资源冲突 |
| 429 | RATE_LIMIT_ERROR | 请求频率超限 |
| 500 | INTERNAL_SERVER_ERROR | 服务器内部错误 |

## 限流规则

| 端点类型 | 限制 | 时间窗口 |
|----------|------|----------|
| 登录 | 5次失败 | 15分钟 |
| 搜索 | 20次 | 1分钟 |
| 数据导入 | 5次 | 1小时 |
| API调用 | 1000次 | 1小时 |

## SDK 示例

### JavaScript/TypeScript

```javascript
class EIGApiClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(method, endpoint, data = null) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    return await response.json();
  }

  // 获取企业列表
  async getEnterprises(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/enterprises?${query}`);
  }

  // 创建企业
  async createEnterprise(data) {
    return this.request('POST', '/enterprises', data);
  }

  // 搜索
  async search(keyword, options = {}) {
    return this.request('POST', '/search', {
      keyword,
      ...options
    });
  }
}

// 使用示例
const client = new EIGApiClient('http://localhost:3001/api/v1', 'your-jwt-token');

const enterprises = await client.getEnterprises({
  page: 1,
  pageSize: 20,
  search: '科技'
});
```

### Python

```python
import requests
import json

class EIGApiClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }

    def request(self, method, endpoint, data=None):
        url = f"{self.base_url}{endpoint}"
        response = requests.request(
            method, url, 
            headers=self.headers, 
            json=data
        )
        return response.json()

    def get_enterprises(self, **params):
        query = "&".join([f"{k}={v}" for k, v in params.items()])
        return self.request('GET', f'/enterprises?{query}')

    def create_enterprise(self, data):
        return self.request('POST', '/enterprises', data)

    def search(self, keyword, **options):
        data = {'keyword': keyword, **options}
        return self.request('POST', '/search', data)

# 使用示例
client = EIGApiClient('http://localhost:3001/api/v1', 'your-jwt-token')

enterprises = client.get_enterprises(page=1, pageSize=20, search='科技')
```

## 最佳实践

### 1. 认证和安全
- 妥善保管JWT令牌，不要在客户端明文存储
- 定期刷新令牌
- 使用HTTPS进行生产环境部署
- 实现CSRF保护

### 2. 错误处理
- 始终检查API响应的success字段
- 根据不同错误码实现相应的错误处理逻辑
- 实现重试机制，特别是对于网络错误

### 3. 性能优化
- 使用分页避免大量数据传输
- 合理使用缓存
- 避免频繁的API调用
- 使用批量操作接口

### 4. 数据格式
- 确保日期时间使用ISO 8601格式
- 数值字段注意精度问题
- 字符串字段注意长度限制

## 版本控制

当前API版本: v1

版本更新时会在以下方面保持向后兼容：
- 现有端点的URL路径
- 请求和响应的核心字段
- 认证机制

不保证向后兼容的变更：
- 新增可选字段
- 废弃字段（会提前通知）
- 性能优化相关的内部实现

## 支持和联系

- API文档: https://docs.eig.com/api
- 技术支持: api-support@eig.com
- GitHub Issues: https://github.com/your-org/eig/issues
- 更新日志: https://docs.eig.com/changelog