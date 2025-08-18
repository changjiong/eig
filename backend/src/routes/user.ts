import express from 'express';
import { Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requirePermission } from '../middleware/auth';
import AuthService from '../services/authService';
import { User, ApiResponse, PaginatedResponse, UserRole } from '../types/database';

const router = express.Router();

// 获取用户列表（仅管理员）
router.get('/', authenticate, requirePermission('user_management'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const role = req.query.role as string;
    
    const client = await pool.connect();
    
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;
      
      if (role) {
        paramCount++;
        whereClause += ` AND role = $${paramCount}`;
        params.push(role);
      }
      
      // 查询总数
      const countResult = await client.query(
        `SELECT COUNT(*) FROM users ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);
      
      // 查询数据
      const result = await client.query(
        `SELECT id, email, name, department, role, permissions, avatar, is_active, last_login, created_at, updated_at
         FROM users ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        [...params, limit, offset]
      );
      
      const users: User[] = result.rows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        department: row.department,
        role: row.role,
        permissions: row.permissions || [],
        avatar: row.avatar,
        isActive: row.is_active,
        lastLogin: row.last_login ? new Date(row.last_login) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
      
      const response: PaginatedResponse<User> = {
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取用户详情（仅管理员）
router.get('/:id', authenticate, requirePermission('user_management'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT id, email, name, department, role, permissions, avatar, is_active, last_login, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      const row = result.rows[0];
      const user: User = {
        id: row.id,
        email: row.email,
        name: row.name,
        department: row.department,
        role: row.role,
        permissions: row.permissions || [],
        avatar: row.avatar,
        isActive: row.is_active,
        lastLogin: row.last_login ? new Date(row.last_login) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      
      const response: ApiResponse<User> = {
        success: true,
        data: user,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 创建用户（仅管理员）
router.post('/', authenticate, requirePermission('user_management'), async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    
    const result = await AuthService.createUser({
      email: userData.email,
      name: userData.name,
      department: userData.department,
      role: userData.role as UserRole,
      permissions: userData.permissions || [],
      avatar: userData.avatar,
      isActive: userData.isActive !== false, // 默认为true
      password: userData.password
    });
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 更新用户（仅管理员）
router.put('/:id', authenticate, requirePermission('user_management'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    
    const client = await pool.connect();
    
    try {
      // 检查用户是否存在
      const existingResult = await client.query('SELECT id FROM users WHERE id = $1', [id]);
      
      if (existingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      const result = await client.query(`
        UPDATE users SET
          name = COALESCE($2, name),
          department = COALESCE($3, department),
          role = COALESCE($4, role),
          permissions = COALESCE($5, permissions),
          avatar = COALESCE($6, avatar),
          is_active = COALESCE($7, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, name, department, role, permissions, avatar, is_active, last_login, created_at, updated_at
      `, [
        id,
        userData.name,
        userData.department,
        userData.role,
        userData.permissions,
        userData.avatar,
        userData.isActive
      ]);
      
      const row = result.rows[0];
      const user: User = {
        id: row.id,
        email: row.email,
        name: row.name,
        department: row.department,
        role: row.role,
        permissions: row.permissions || [],
        avatar: row.avatar,
        isActive: row.is_active,
        lastLogin: row.last_login ? new Date(row.last_login) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      
      res.status(200).json({
        success: true,
        data: user,
        message: '用户更新成功',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: '更新用户失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 禁用/启用用户（仅管理员）
router.patch('/:id/status', authenticate, requirePermission('user_management'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive字段必须为布尔值',
        timestamp: new Date().toISOString()
      });
    }
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE users SET
          is_active = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, name, department, role, permissions, avatar, is_active, last_login, created_at, updated_at
      `, [id, isActive]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      const row = result.rows[0];
      const user: User = {
        id: row.id,
        email: row.email,
        name: row.name,
        department: row.department,
        role: row.role,
        permissions: row.permissions || [],
        avatar: row.avatar,
        isActive: row.is_active,
        lastLogin: row.last_login ? new Date(row.last_login) : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      
      res.status(200).json({
        success: true,
        data: user,
        message: `用户已${isActive ? '启用' : '禁用'}`,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: '更新用户状态失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 