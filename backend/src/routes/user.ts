import express from 'express';
import { Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requirePermission, requireAnyRole } from '../middleware/auth';
import AuthService from '../services/authService';
import { User, ApiResponse, PaginatedResponse, UserRole } from '../types/database';

const router = express.Router();

// 获取用户列表（仅管理员）
router.get('/', authenticate, requireAnyRole(['admin']), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword as string;
    const role = req.query.role as string;
    const isActive = req.query.isActive as string;
    
    const client = await pool.connect();
    
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;
      
      if (keyword) {
        paramCount++;
        whereClause += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR department ILIKE $${paramCount})`;
        params.push(`%${keyword}%`);
      }
      
      if (role) {
        paramCount++;
        whereClause += ` AND role = $${paramCount}`;
        params.push(role);
      }
      
      if (isActive !== undefined) {
        paramCount++;
        whereClause += ` AND is_active = $${paramCount}`;
        params.push(isActive === 'true');
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
      
      return res.status(200).json(response);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取用户详情
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 权限检查：只有管理员或用户自己可以查看详情
    if (req.user?.role !== 'admin' && req.user?.id !== id) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
        timestamp: new Date().toISOString()
      });
    }
    
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
      
      return res.status(200).json(response);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Get user detail error:', error);
    return res.status(500).json({
      success: false,
      message: '获取用户详情失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 创建用户（仅管理员）
router.post('/', authenticate, requireAnyRole(['admin']), async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    
    // 数据验证
    if (!userData.email || !userData.password || !userData.name || !userData.department || !userData.role) {
      return res.status(400).json({
        success: false,
        message: '邮箱、密码、姓名、部门和角色为必填项',
        timestamp: new Date().toISOString()
      });
    }
    
    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
        timestamp: new Date().toISOString()
      });
    }
    
    // 角色验证
    const allowedRoles: UserRole[] = ['admin', 'manager', 'analyst', 'viewer'];
    if (!allowedRoles.includes(userData.role)) {
      return res.status(400).json({
        success: false,
        message: '无效的用户角色',
        timestamp: new Date().toISOString()
      });
    }
    
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
      return res.status(201).json({
        success: true,
        data: result.data,
        message: '用户创建成功',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
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
      
      return res.status(200).json({
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
    return res.status(500).json({
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
      
      return res.status(200).json({
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
    return res.status(500).json({
      success: false,
      message: '更新用户状态失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取用户统计信息（仅管理员）
router.get('/stats/overview', authenticate, requireAnyRole(['admin']), async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
          COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_count,
          COUNT(CASE WHEN role = 'analyst' THEN 1 END) as analyst_count,
          COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewer_count,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_this_month,
          COUNT(CASE WHEN last_login >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as active_this_week
        FROM users
      `;
      
      const result = await client.query(statsQuery);
      const stats = result.rows[0];
      
      return res.status(200).json({
        success: true,
        data: {
          totalUsers: parseInt(stats.total_users),
          activeUsers: parseInt(stats.active_users),
          inactiveUsers: parseInt(stats.inactive_users),
          roleBreakdown: {
            admin: parseInt(stats.admin_count),
            manager: parseInt(stats.manager_count),
            analyst: parseInt(stats.analyst_count),
            viewer: parseInt(stats.viewer_count)
          },
          activityMetrics: {
            newThisMonth: parseInt(stats.new_this_month),
            activeThisWeek: parseInt(stats.active_this_week)
          }
        },
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Get user stats error:', error);
    return res.status(500).json({
      success: false,
      message: '获取用户统计信息失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 批量更新用户状态（仅管理员）
router.patch('/batch/status', authenticate, requireAnyRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { userIds, isActive } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户ID列表',
        timestamp: new Date().toISOString()
      });
    }
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: '请提供有效的状态值',
        timestamp: new Date().toISOString()
      });
    }
    
    // 不能包含自己的ID
    if (userIds.includes(req.user?.id)) {
      return res.status(400).json({
        success: false,
        message: '不能修改自己的状态',
        timestamp: new Date().toISOString()
      });
    }
    
    const client = await pool.connect();
    
    try {
      const placeholders = userIds.map((_, index) => `$${index + 2}`).join(',');
      const result = await client.query(
        `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id IN (${placeholders}) RETURNING id`,
        [isActive, ...userIds]
      );
      
      return res.status(200).json({
        success: true,
        message: `成功更新 ${result.rows.length} 个用户的状态`,
        data: { updatedCount: result.rows.length },
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Batch update users status error:', error);
    return res.status(500).json({
      success: false,
      message: '批量更新用户状态失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 修改密码
router.put('/:id/password', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // 权限检查：只有用户自己或管理员可以修改密码
    if (req.user?.role !== 'admin' && req.user?.id !== id) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少6位',
        timestamp: new Date().toISOString()
      });
    }
    
    // 非管理员必须提供当前密码
    if (req.user?.role !== 'admin' && !currentPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供当前密码',
        timestamp: new Date().toISOString()
      });
    }
    
    const client = await pool.connect();
    
    try {
      // 如果不是管理员，验证当前密码
      if (req.user?.role !== 'admin') {
        const userResult = await client.query('SELECT password_hash FROM users WHERE id = $1', [id]);
        
        if (userResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: '用户不存在',
            timestamp: new Date().toISOString()
          });
        }
        
        const bcrypt = require('bcryptjs');
        const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
        
        if (!isValidPassword) {
          return res.status(400).json({
            success: false,
            message: '当前密码错误',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // 加密新密码
      const bcrypt = require('bcryptjs');
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
      
      // 更新密码
      const result = await client.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
        [newPasswordHash, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(200).json({
        success: true,
        message: '密码修改成功',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({
      success: false,
      message: '修改密码失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 删除用户（软删除）
router.delete('/:id', authenticate, requireAnyRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 不能删除自己
    if (req.user?.id === id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户',
        timestamp: new Date().toISOString()
      });
    }
    
    const client = await pool.connect();
    
    try {
      // 检查用户是否存在
      const userResult = await client.query('SELECT id, name, role FROM users WHERE id = $1', [id]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      const user = userResult.rows[0];
      
      // 不能删除其他管理员
      if (user.role === 'admin') {
        return res.status(400).json({
          success: false,
          message: '不能删除管理员账户',
          timestamp: new Date().toISOString()
        });
      }
      
      // 软删除：禁用用户而不是真删除
      const result = await client.query(`
        UPDATE users SET
          is_active = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, name
      `, [id]);
      
      return res.status(200).json({
        success: true,
        data: { id: result.rows[0].id },
        message: `用户 "${result.rows[0].name}" 已删除`,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: '删除用户失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 