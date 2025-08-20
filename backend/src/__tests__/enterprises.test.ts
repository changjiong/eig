import request from 'supertest';
import express from 'express';
import { pool } from '../config/database';
import { authenticate } from '../middleware/auth';
import enterpriseRoutes from '../routes/enterprise';

// 创建测试app
const app = express();
app.use(express.json());

// Mock authentication middleware for testing
const mockAuth = (req: any, res: any, next: any) => {
  req.user = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'admin',
    permissions: ['view_enterprise', 'manage_enterprise']
  };
  next();
};

app.use('/api/v1/enterprises', mockAuth, enterpriseRoutes);

describe('Enterprise API', () => {
  const testEnterprise = {
    name: '测试企业有限公司',
    legal_name: '测试企业有限公司',
    credit_code: '91110000000000001X',
    industry: '软件和信息技术服务业',
    legal_representative: '张三',
    registered_capital: 10000000,
    address: '北京市朝阳区测试街道1号',
    phone: '010-12345678',
    email: 'test@testcompany.com',
    website: 'https://www.testcompany.com',
    status: 'active',
    risk_level: 'low'
  };

  let createdEnterpriseId: string;

  beforeAll(async () => {
    // 清理可能存在的测试数据
    await pool.query('DELETE FROM enterprises WHERE name = $1', [testEnterprise.name]);
  });

  afterAll(async () => {
    // 清理测试数据
    if (createdEnterpriseId) {
      await pool.query('DELETE FROM enterprises WHERE id = $1', [createdEnterpriseId]);
    }
    await pool.query('DELETE FROM enterprises WHERE name = $1', [testEnterprise.name]);
  });

  describe('POST /api/v1/enterprises', () => {
    it('should create a new enterprise successfully', async () => {
      const response = await request(app)
        .post('/api/v1/enterprises')
        .send(testEnterprise)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('企业创建成功');
      expect(response.body.data.name).toBe(testEnterprise.name);
      expect(response.body.data.id).toBeDefined();

      createdEnterpriseId = response.body.data.id;
    });

    it('should fail to create enterprise with duplicate credit code', async () => {
      const duplicateEnterprise = {
        ...testEnterprise,
        name: '另一个测试企业',
        credit_code: testEnterprise.credit_code
      };

      const response = await request(app)
        .post('/api/v1/enterprises')
        .send(duplicateEnterprise)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('统一社会信用代码已存在');
    });

    it('should fail to create enterprise with invalid data', async () => {
      const invalidEnterprise = {
        name: '', // 空名称
        industry: testEnterprise.industry
      };

      const response = await request(app)
        .post('/api/v1/enterprises')
        .send(invalidEnterprise)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to create enterprise with invalid credit code format', async () => {
      const invalidCreditCodeEnterprise = {
        ...testEnterprise,
        name: '无效信用代码企业',
        credit_code: 'INVALID_CODE'
      };

      const response = await request(app)
        .post('/api/v1/enterprises')
        .send(invalidCreditCodeEnterprise)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/enterprises', () => {
    it('should get enterprises list with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises')
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enterprises).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(10);
    });

    it('should filter enterprises by search keyword', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises')
        .query({ search: '测试企业' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enterprises.length).toBeGreaterThan(0);
      expect(response.body.data.enterprises[0].name).toContain('测试企业');
    });

    it('should filter enterprises by industry', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises')
        .query({ industry: '软件和信息技术服务业' })
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.enterprises.length > 0) {
        expect(response.body.data.enterprises[0].industry).toBe('软件和信息技术服务业');
      }
    });

    it('should filter enterprises by risk level', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises')
        .query({ riskLevel: 'low' })
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.enterprises.length > 0) {
        expect(response.body.data.enterprises[0].risk_level).toBe('low');
      }
    });

    it('should sort enterprises by different fields', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises')
        .query({ sortBy: 'name', sortOrder: 'asc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enterprises).toBeDefined();
    });
  });

  describe('GET /api/v1/enterprises/:id', () => {
    it('should get enterprise by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/enterprises/${createdEnterpriseId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdEnterpriseId);
      expect(response.body.data.name).toBe(testEnterprise.name);
    });

    it('should return 404 for non-existent enterprise', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/v1/enterprises/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('企业不存在');
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises/invalid-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/enterprises/:id', () => {
    it('should update enterprise successfully', async () => {
      const updateData = {
        name: '更新后的测试企业有限公司',
        phone: '010-87654321',
        risk_level: 'medium'
      };

      const response = await request(app)
        .put(`/api/v1/enterprises/${createdEnterpriseId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('企业信息更新成功');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.phone).toBe(updateData.phone);
      expect(response.body.data.risk_level).toBe(updateData.risk_level);
    });

    it('should return 404 when updating non-existent enterprise', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = { name: '不存在的企业' };

      const response = await request(app)
        .put(`/api/v1/enterprises/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('企业不存在');
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        risk_level: 'invalid_level' // 无效的风险等级
      };

      const response = await request(app)
        .put(`/api/v1/enterprises/${createdEnterpriseId}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/enterprises/:id', () => {
    let toDeleteId: string;

    beforeAll(async () => {
      // 创建一个企业用于删除测试
      const createResponse = await request(app)
        .post('/api/v1/enterprises')
        .send({
          ...testEnterprise,
          name: '待删除的测试企业',
          credit_code: '91110000000000002Y'
        });
      
      toDeleteId = createResponse.body.data.id;
    });

    it('should delete enterprise successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/enterprises/${toDeleteId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('企业删除成功');
    });

    it('should return 404 when deleting non-existent enterprise', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app)
        .delete(`/api/v1/enterprises/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('企业不存在');
    });
  });

  describe('GET /api/v1/enterprises/:id/statistics', () => {
    it('should get enterprise statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/enterprises/${createdEnterpriseId}/statistics`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.enterprise).toBeDefined();
      expect(response.body.data.statistics).toBeDefined();
    });
  });

  describe('GET /api/v1/enterprises/:id/relationships', () => {
    it('should get enterprise relationships', async () => {
      const response = await request(app)
        .get(`/api/v1/enterprises/${createdEnterpriseId}/relationships`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.relationships).toBeDefined();
      expect(Array.isArray(response.body.data.relationships)).toBe(true);
    });
  });

  describe('POST /api/v1/enterprises/batch-score', () => {
    it('should recalculate scores for all enterprises', async () => {
      const response = await request(app)
        .post('/api/v1/enterprises/batch-score')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('评分计算完成');
      expect(response.body.data.processedCount).toBeDefined();
    });
  });

  describe('Enterprise Search and Filtering', () => {
    it('should handle complex search queries', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises')
        .query({
          search: '测试',
          industry: '软件和信息技术服务业',
          riskLevel: 'low',
          status: 'active',
          sortBy: 'registered_capital',
          sortOrder: 'desc'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enterprises).toBeDefined();
    });

    it('should handle empty search results', async () => {
      const response = await request(app)
        .get('/api/v1/enterprises')
        .query({ search: 'NonExistentCompany12345' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enterprises).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });
  });

  describe('Enterprise Validation', () => {
    it('should validate required fields', async () => {
      const incompleteEnterprise = {
        // name 字段缺失
        industry: '制造业'
      };

      const response = await request(app)
        .post('/api/v1/enterprises')
        .send(incompleteEnterprise)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const invalidEmailEnterprise = {
        ...testEnterprise,
        name: '邮箱格式错误企业',
        credit_code: '91110000000000003Z',
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .post('/api/v1/enterprises')
        .send(invalidEmailEnterprise)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate registered capital range', async () => {
      const invalidCapitalEnterprise = {
        ...testEnterprise,
        name: '注册资本无效企业',
        credit_code: '91110000000000004A',
        registered_capital: -1000 // 负数
      };

      const response = await request(app)
        .post('/api/v1/enterprises')
        .send(invalidCapitalEnterprise)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});