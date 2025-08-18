import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import appConfig from '../config/app';
import { User, LoginRequest, LoginResponse, ApiResponse, UserRole, Permission } from '../types/database';

// 角色权限映射
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_dashboard', 'view_enterprise', 'view_graph', 'view_prospects',
    'view_search', 'view_clients', 'manage_data', 'manage_system',
    'export_data', 'import_data', 'user_management'
  ],
  manager: [
    'view_dashboard', 'view_enterprise', 'view_graph', 'view_prospects',
    'view_search', 'view_clients', 'manage_data', 'export_data', 'import_data'
  ],
  analyst: [
    'view_dashboard', 'view_enterprise', 'view_graph', 'view_prospects',
    'view_search', 'view_clients', 'export_data'
  ],
  viewer: [
    'view_dashboard', 'view_enterprise', 'view_graph', 'view_prospects', 'view_search'
  ]
};

export class AuthService {
  // 用户登录
  static async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const client = await pool.connect();
      
      try {
        // 查找用户
        const result = await client.query(
          'SELECT * FROM users WHERE email = $1 AND is_active = true',
          [credentials.email]
        );
        
        if (result.rows.length === 0) {
          return {
            success: false,
            message: '邮箱或密码错误',
            timestamp: new Date().toISOString()
          };
        }
        
        const user = result.rows[0];
        
        // 验证密码
        const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
        
        if (!isValidPassword) {
          return {
            success: false,
            message: '邮箱或密码错误',
            timestamp: new Date().toISOString()
          };
        }
        
        // 更新最后登录时间
        await client.query(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
          [user.id]
        );
        
        // 生成JWT token
        const token = jwt.sign(
          { 
            userId: user.id,
            email: user.email,
            role: user.role
          },
          appConfig.jwt.secret,
          { expiresIn: appConfig.jwt.expiresIn }
        );
        
        // 计算token过期时间
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        
        const userResponse: Omit<User, 'id'> = {
          email: user.email,
          name: user.name,
          department: user.department,
          role: user.role,
          permissions: ROLE_PERMISSIONS[user.role as UserRole] || [],
          avatar: user.avatar,
          isActive: user.is_active,
          lastLogin: user.last_login ? new Date(user.last_login) : undefined,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at)
        };
        
        return {
          success: true,
          data: {
            user: userResponse,
            token,
            expiresAt: expiresAt.toISOString()
          },
          message: '登录成功',
          timestamp: new Date().toISOString()
        };
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: '登录服务暂时不可用，请稍后重试',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // 验证token
  static async verifyToken(token: string): Promise<ApiResponse<User>> {
    try {
      const decoded = jwt.verify(token, appConfig.jwt.secret) as any;
      
      const client = await pool.connect();
      
      try {
        const result = await client.query(
          'SELECT * FROM users WHERE id = $1 AND is_active = true',
          [decoded.userId]
        );
        
        if (result.rows.length === 0) {
          return {
            success: false,
            message: '用户不存在或已被禁用',
            timestamp: new Date().toISOString()
          };
        }
        
        const user = result.rows[0];
        const userResponse: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          department: user.department,
          role: user.role,
          permissions: ROLE_PERMISSIONS[user.role as UserRole] || [],
          avatar: user.avatar,
          isActive: user.is_active,
          lastLogin: user.last_login ? new Date(user.last_login) : undefined,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at)
        };
        
        return {
          success: true,
          data: userResponse,
          timestamp: new Date().toISOString()
        };
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return {
          success: false,
          message: '无效的访问令牌',
          timestamp: new Date().toISOString()
        };
      }
      
      console.error('Token verification error:', error);
      return {
        success: false,
        message: '令牌验证失败',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // 创建用户（仅供管理员使用）
  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'> & { password: string }): Promise<ApiResponse<User>> {
    try {
      const client = await pool.connect();
      
      try {
        // 检查邮箱是否已存在
        const existingUser = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [userData.email]
        );
        
        if (existingUser.rows.length > 0) {
          return {
            success: false,
            message: '该邮箱已被使用',
            timestamp: new Date().toISOString()
          };
        }
        
        // 加密密码
        const passwordHash = await bcrypt.hash(userData.password, appConfig.security.saltRounds);
        
        // 创建用户
        const result = await client.query(`
          INSERT INTO users (
            email, password_hash, name, department, role, permissions, avatar, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          userData.email,
          passwordHash,
          userData.name,
          userData.department,
          userData.role,
          userData.permissions,
          userData.avatar,
          userData.isActive
        ]);
        
        const newUser = result.rows[0];
        const userResponse: User = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          department: newUser.department,
          role: newUser.role,
          permissions: ROLE_PERMISSIONS[newUser.role as UserRole] || [],
          avatar: newUser.avatar,
          isActive: newUser.is_active,
          lastLogin: undefined,
          createdAt: new Date(newUser.created_at),
          updatedAt: new Date(newUser.updated_at)
        };
        
        return {
          success: true,
          data: userResponse,
          message: '用户创建成功',
          timestamp: new Date().toISOString()
        };
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        message: '用户创建失败',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // 检查权限
  static hasPermission(user: User, permission: Permission): boolean {
    return user.permissions.includes(permission);
  }
  
  // 检查角色
  static hasRole(user: User, role: UserRole): boolean {
    return user.role === role;
  }
  
  // 检查多个角色
  static hasAnyRole(user: User, roles: UserRole[]): boolean {
    return roles.includes(user.role);
  }
}

export default AuthService; 