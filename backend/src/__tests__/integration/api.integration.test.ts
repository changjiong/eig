import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// 导入所有路由
import authRoutes from '../../routes/auth';
import enterpriseRoutes from '../../routes/enterprise';
import clientRoutes from '../../routes/client';
import graphRoutes from '../../routes/graph';
import dataRoutes from '../../routes/data';
import userRoutes from '../../routes/user';
import searchRoutes from '../../routes/search';

// 创建完整的测试应用
const createTestApp = () => {
  const app = express();
  
  // 中间件
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // 路由
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/enterprises', enterpriseRoutes);
  app.use('/api/v1/clients', clientRoutes);
  app.use('/api/v1/graph', graphRoutes);
  app.use('/api/v1/data', dataRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/search', searchRoutes);
  
  return app;
};

describe('API Integration Tests', () => {
  let app: express.Application;
  let authToken: string;
  let testUserId: string;
  let testEnterpriseId: string;

  const testUser = {
    email: 'integration-test@example.com',
    password: 'IntegrationTest123!',
    name: 'Integration Test User',
    department: 'QA',
    role: 'admin'
  };

  const testEnterprise = {
    name: '集成测试企业有限公司',
    legal_name: '集成测试企业有限公司',
    credit_code: '91110000000000999X',
    industry: '软件和信息技术服务业',
    legal_representative: '李四',
    registered_capital: 5000000,
    address: '北京市海淀区集成测试街道1号',
    phone: '010-99999999',
    email: 'integration@testcompany.com',
    status: 'active',
    risk_level: 'low'
  };

  beforeAll(async () => {
    app = createTestApp();
  });

  describe('Complete User Journey', () => {
    it('should complete user registration flow', async () => {
      // 1. 注册用户
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe(testUser.email);
      testUserId = registerResponse.body.data.user.id;
    });

    it('should complete user login flow', async () => {
      // 2. 用户登录
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.token).toBeDefined();
      authToken = loginResponse.body.data.token;
    });

    it('should get current user info', async () => {
      // 3. 获取当前用户信息
      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.data.email).toBe(testUser.email);
    });
  });

  describe('Enterprise Management Flow', () => {
    it('should create an enterprise', async () => {
      const response = await request(app)
        .post('/api/v1/enterprises')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testEnterprise)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(testEnterprise.name);
      testEnterpriseId = response.body.data.id;
    });

    it('should get enterprises list', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enterprises).toBeDefined();
      expect(Array.isArray(response.body.data.enterprises)).toBe(true);
    });

    it('should get specific enterprise', async () => {
      const response = await request(app)
        .get(`/api/v1/enterprises/${testEnterpriseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testEnterpriseId);
      expect(response.body.data.name).toBe(testEnterprise.name);
    });

    it('should update enterprise', async () => {
      const updateData = {
        phone: '010-88888888',
        risk_level: 'medium'
      };

      const response = await request(app)
        .put(`/api/v1/enterprises/${testEnterpriseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.phone).toBe(updateData.phone);
      expect(response.body.data.risk_level).toBe(updateData.risk_level);
    });

    it('should get enterprise statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/enterprises/${testEnterpriseId}/statistics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
    });
  });

  describe('Search Functionality', () => {
    it('should perform basic search', async () => {
      const response = await request(app)
        .post('/api/v1/search')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          keyword: '集成测试',
          entityType: 'enterprises',
          page: 1,
          pageSize: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeDefined();
    });

    it('should perform advanced search', async () => {
      const response = await request(app)
        .post('/api/v1/search/advanced')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          keyword: '集成测试',
          entityType: 'enterprises',
          filters: {
            industry: '软件和信息技术服务业',
            riskLevel: 'medium'
          },
          sortBy: 'name',
          sortOrder: 'asc'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeDefined();
    });

    it('should get search suggestions', async () => {
      const response = await request(app)
        .get('/api/v1/search/suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ keyword: '集成' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions).toBeDefined();
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
    });
  });

  describe('Data Management Flow', () => {
    it('should get data sources', async () => {
      const response = await request(app)
        .get('/api/v1/data/sources')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sources).toBeDefined();
    });

    it('should get import tasks', async () => {
      const response = await request(app)
        .get('/api/v1/data/import-tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toBeDefined();
    });
  });

  describe('User Management', () => {
    it('should get users list (admin only)', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
    });

    it('should get specific user', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUserId);
    });

    it('should update user profile', async () => {
      const updateData = {
        name: 'Updated Integration Test User',
        department: 'Engineering'
      };

      const response = await request(app)
        .put(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.department).toBe(updateData.department);
    });
  });

  describe('Graph Data Operations', () => {
    it('should get graph data', async () => {
      const response = await request(app)
        .get('/api/v1/graph/data')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ centerNodeId: testEnterpriseId, depth: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nodes).toBeDefined();
      expect(response.body.data.links).toBeDefined();
    });

    it('should get relationships', async () => {
      const response = await request(app)
        .get('/api/v1/graph/relationships')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.relationships).toBeDefined();
    });

    it('should get graph statistics', async () => {
      const response = await request(app)
        .get('/api/v1/graph/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized requests', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('访问令牌缺失');
    });

    it('should handle invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的访问令牌');
    });

    it('should handle not found resources', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/v1/enterprises/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid data', async () => {
      const invalidEnterprise = {
        name: '', // 空名称
        industry: '无效行业'
      };

      const response = await request(app)
        .post('/api/v1/enterprises')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEnterprise)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/v1/enterprises')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ page: 1, pageSize: 5 })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/enterprises')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, pageSize: 50 })
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // 5秒内响应
    });
  });

  // 清理测试数据
  afterAll(async () => {
    if (testEnterpriseId) {
      await request(app)
        .delete(`/api/v1/enterprises/${testEnterpriseId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }

    if (testUserId) {
      await request(app)
        .delete(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });
});