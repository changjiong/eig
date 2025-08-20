import request from 'supertest';
import express from 'express';
import { pool } from '../config/database';
import authRoutes from '../routes/auth';
import AuthService from '../services/authService';

// 创建测试app
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

describe('Authentication API', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
    department: 'IT',
    role: 'analyst'
  };

  beforeAll(async () => {
    // 确保测试用户不存在
    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  afterAll(async () => {
    // 清理测试数据
    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('注册成功');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it('should fail to register with duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱已被注册');
    });

    it('should fail to register with invalid email', async () => {
      const invalidUser = { ...testUser, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to register with weak password', async () => {
      const weakPasswordUser = { ...testUser, email: 'weak@test.com', password: '123' };
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to register with missing required fields', async () => {
      const incompleteUser = { email: 'incomplete@test.com' };
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(incompleteUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /login', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('登录成功');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should fail to login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱或密码错误');
    });

    it('should fail to login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱或密码错误');
    });

    it('should fail to login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /me (with authentication)', () => {
    let authToken: string;

    beforeAll(async () => {
      // 登录获取token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      authToken = loginResponse.body.data.token;
    });

    it('should get current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.password_hash).toBeUndefined();
    });

    it('should fail to get user info without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('访问令牌缺失');
    });

    it('should fail to get user info with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的访问令牌');
    });
  });
});

describe('AuthService', () => {
  const testUser = {
    email: 'service-test@example.com',
    password: 'TestPassword123!',
    name: 'Service Test User',
    department: 'QA',
    role: 'viewer' as const
  };

  beforeAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const result = await AuthService.createUser(testUser);
      
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe(testUser.email);
      expect(result.data?.password_hash).toBeUndefined();
    });

    it('should fail to create duplicate user', async () => {
      const result = await AuthService.createUser(testUser);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('邮箱已被注册');
    });
  });

  describe('validateCredentials', () => {
    it('should validate correct credentials', async () => {
      const result = await AuthService.validateCredentials(testUser.email, testUser.password);
      
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe(testUser.email);
    });

    it('should reject incorrect password', async () => {
      const result = await AuthService.validateCredentials(testUser.email, 'WrongPassword');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('邮箱或密码错误');
    });

    it('should reject non-existent user', async () => {
      const result = await AuthService.validateCredentials('nonexistent@test.com', testUser.password);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('邮箱或密码错误');
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const user = { id: 'test-id', email: testUser.email, role: testUser.role };
      const token = AuthService.generateToken(user);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      // 首先获取一个真实用户
      const userQuery = 'SELECT id, email, role FROM users WHERE email = $1';
      const userResult = await pool.query(userQuery, [testUser.email]);
      const user = userResult.rows[0];
      
      const token = AuthService.generateToken(user);
      const result = await AuthService.verifyToken(token);
      
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe(testUser.email);
    });

    it('should reject invalid token', async () => {
      const result = await AuthService.verifyToken('invalid-token');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('无效的访问令牌');
    });
  });

  describe('hasPermission', () => {
    it('should correctly check permissions for admin', () => {
      const admin = { role: 'admin', permissions: [] };
      
      expect(AuthService.hasPermission(admin as any, 'manage_users')).toBe(true);
      expect(AuthService.hasPermission(admin as any, 'view_dashboard')).toBe(true);
    });

    it('should correctly check permissions for viewer', () => {
      const viewer = { role: 'viewer', permissions: [] };
      
      expect(AuthService.hasPermission(viewer as any, 'manage_users')).toBe(false);
      expect(AuthService.hasPermission(viewer as any, 'view_dashboard')).toBe(true);
    });
  });
});

describe('Password Security', () => {
  it('should hash passwords securely', async () => {
    const password = 'TestPassword123!';
    const user = {
      email: 'hash-test@example.com',
      password,
      name: 'Hash Test',
      department: 'Security',
      role: 'analyst' as const
    };

    // 清理
    await pool.query('DELETE FROM users WHERE email = $1', [user.email]);

    // 创建用户
    const createResult = await AuthService.createUser(user);
    expect(createResult.success).toBe(true);

    // 验证密码被正确哈希
    const userQuery = 'SELECT password_hash FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [user.email]);
    const storedHash = userResult.rows[0].password_hash;

    expect(storedHash).not.toBe(password);
    expect(storedHash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format

    // 清理
    await pool.query('DELETE FROM users WHERE email = $1', [user.email]);
  });
});