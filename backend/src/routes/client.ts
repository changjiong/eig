import express from 'express';
import { Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requirePermission, requireAnyRole } from '../middleware/auth';
import { Client, ApiResponse, PaginatedResponse } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 获取客户列表
router.get('/', authenticate, requirePermission('view_clients'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // 限制最大100条
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword as string;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const assignedTo = req.query.assignedTo as string;
    const sortBy = req.query.sortBy as string || 'created_at';
    const sortOrder = req.query.sortOrder as string || 'DESC';
    
    // 验证排序字段安全性
    const allowedSortFields = ['name', 'company', 'created_at', 'updated_at', 'last_contact', 'estimated_value'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const client = await pool.connect();
    
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;
      
      if (keyword) {
        paramCount++;
        whereClause += ` AND (name ILIKE $${paramCount} OR company ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        params.push(`%${keyword}%`);
      }
      
      if (status) {
        paramCount++;
        whereClause += ` AND status = $${paramCount}`;
        params.push(status);
      }
      
      if (priority) {
        paramCount++;
        whereClause += ` AND priority = $${paramCount}`;
        params.push(priority);
      }
      
      if (assignedTo) {
        paramCount++;
        whereClause += ` AND assigned_to = $${paramCount}`;
        params.push(assignedTo);
      }
      
      // 如果是viewer角色，只能看到分配给自己的客户
      if (req.user?.role === 'viewer') {
        paramCount++;
        whereClause += ` AND assigned_to = $${paramCount}`;
        params.push(req.user.id);
      }
      
      // 查询总数
      const countResult = await client.query(
        `SELECT COUNT(*) FROM clients ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);
      
      // 查询数据
      const result = await client.query(
        `SELECT * FROM clients ${whereClause} 
         ORDER BY ${safeSortBy} ${safeSortOrder} 
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        [...params, limit, offset]
      );
      
      const clients: Client[] = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        company: row.company,
        industry: row.industry,
        position: row.position,
        email: row.email,
        phone: row.phone,
        status: row.status,
        priority: row.priority,
        assignedTo: row.assigned_to,
        assignedToName: row.assigned_to_name,
        lastContact: row.last_contact ? new Date(row.last_contact) : undefined,
        nextFollowUp: row.next_follow_up ? new Date(row.next_follow_up) : undefined,
        estimatedValue: row.estimated_value ? parseFloat(row.estimated_value) : undefined,
        notes: row.notes,
        tags: row.tags || [],
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
      
      const response: PaginatedResponse<Client> = {
        success: true,
        data: clients,
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
    console.error('Get clients error:', error);
    return res.status(500).json({
      success: false,
      message: '获取客户列表失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取客户详情
router.get('/:id', authenticate, requirePermission('view_clients'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM clients WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '客户不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      const row = result.rows[0];
      const clientData: Client = {
        id: row.id,
        name: row.name,
        company: row.company,
        industry: row.industry,
        position: row.position,
        email: row.email,
        phone: row.phone,
        status: row.status,
        priority: row.priority,
        assignedTo: row.assigned_to,
        assignedToName: row.assigned_to_name,
        lastContact: row.last_contact ? new Date(row.last_contact) : undefined,
        nextFollowUp: row.next_follow_up ? new Date(row.next_follow_up) : undefined,
        estimatedValue: row.estimated_value ? parseFloat(row.estimated_value) : undefined,
        notes: row.notes,
        tags: row.tags || [],
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      
      const response: ApiResponse<Client> = {
        success: true,
        data: clientData,
        timestamp: new Date().toISOString()
      };
      
      return res.status(200).json(response);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Get client detail error:', error);
    return res.status(500).json({
      success: false,
      message: '获取客户详情失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 创建客户 - 增加数据验证
router.post('/', authenticate, requireAnyRole(['admin', 'manager']), async (req: Request, res: Response) => {
  try {
    const clientData = req.body;
    const userId = req.user?.id;
    
    // 数据验证
    if (!clientData.name || !clientData.company || !clientData.email) {
      return res.status(400).json({
        success: false,
        message: '客户姓名、公司名称和邮箱为必填项',
        timestamp: new Date().toISOString()
      });
    }
    
    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
        timestamp: new Date().toISOString()
      });
    }
    
    const client = await pool.connect();
    
    try {
      // 检查邮箱是否已存在
      const existingClient = await client.query(
        'SELECT id FROM clients WHERE email = $1',
        [clientData.email]
      );
      
      if (existingClient.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已被其他客户使用',
          timestamp: new Date().toISOString()
        });
      }
      
      const result = await client.query(`
        INSERT INTO clients (
          name, company, industry, position, email, phone, status, priority,
          assigned_to, assigned_to_name, last_contact, next_follow_up, 
          estimated_value, notes, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `, [
        clientData.name,
        clientData.company,
        clientData.industry,
        clientData.position,
        clientData.email,
        clientData.phone,
        clientData.status || 'potential',
        clientData.priority || 'medium',
        clientData.assignedTo || userId,
        clientData.assignedToName || req.user?.name,
        clientData.lastContact,
        clientData.nextFollowUp,
        clientData.estimatedValue,
        clientData.notes || '',
        clientData.tags || []
      ]);
      
      const row = result.rows[0];
      const newClient: Client = {
        id: row.id,
        name: row.name,
        company: row.company,
        industry: row.industry,
        position: row.position,
        email: row.email,
        phone: row.phone,
        status: row.status,
        priority: row.priority,
        assignedTo: row.assigned_to,
        assignedToName: row.assigned_to_name,
        lastContact: row.last_contact ? new Date(row.last_contact) : undefined,
        nextFollowUp: row.next_follow_up ? new Date(row.next_follow_up) : undefined,
        estimatedValue: row.estimated_value ? parseFloat(row.estimated_value) : undefined,
        notes: row.notes,
        tags: row.tags || [],
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      
      return res.status(201).json({
        success: true,
        data: newClient,
        message: '客户创建成功',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Create client error:', error);
    return res.status(500).json({
      success: false,
      message: '创建客户失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 更新客户 - 增加权限检查
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clientData = req.body;
    
    // 权限检查：只有admin/manager可以修改所有客户，其他用户只能修改分配给自己的客户
    if (!['admin', 'manager'].includes(req.user?.role || '')) {
      const checkResult = await pool.query(
        'SELECT assigned_to FROM clients WHERE id = $1',
        [id]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '客户不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      if (checkResult.rows[0].assigned_to !== req.user?.id) {
        return res.status(403).json({
          success: false,
          message: '您只能修改分配给您的客户',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // 邮箱格式验证（如果提供了邮箱）
    if (clientData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clientData.email)) {
        return res.status(400).json({
          success: false,
          message: '邮箱格式不正确',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE clients SET
          name = COALESCE($2, name),
          company = COALESCE($3, company),
          industry = COALESCE($4, industry),
          position = COALESCE($5, position),
          email = COALESCE($6, email),
          phone = COALESCE($7, phone),
          status = COALESCE($8, status),
          priority = COALESCE($9, priority),
          assigned_to = COALESCE($10, assigned_to),
          assigned_to_name = COALESCE($11, assigned_to_name),
          last_contact = COALESCE($12, last_contact),
          next_follow_up = COALESCE($13, next_follow_up),
          estimated_value = COALESCE($14, estimated_value),
          notes = COALESCE($15, notes),
          tags = COALESCE($16, tags),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [
        id,
        clientData.name,
        clientData.company,
        clientData.industry,
        clientData.position,
        clientData.email,
        clientData.phone,
        clientData.status,
        clientData.priority,
        clientData.assignedTo,
        clientData.assignedToName,
        clientData.lastContact,
        clientData.nextFollowUp,
        clientData.estimatedValue,
        clientData.notes,
        clientData.tags
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '客户不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      const row = result.rows[0];
      const updatedClient: Client = {
        id: row.id,
        name: row.name,
        company: row.company,
        industry: row.industry,
        position: row.position,
        email: row.email,
        phone: row.phone,
        status: row.status,
        priority: row.priority,
        assignedTo: row.assigned_to,
        assignedToName: row.assigned_to_name,
        lastContact: row.last_contact ? new Date(row.last_contact) : undefined,
        nextFollowUp: row.next_follow_up ? new Date(row.next_follow_up) : undefined,
        estimatedValue: row.estimated_value ? parseFloat(row.estimated_value) : undefined,
        notes: row.notes,
        tags: row.tags || [],
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      
      return res.status(200).json({
        success: true,
        data: updatedClient,
        message: '客户更新成功',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Update client error:', error);
    return res.status(500).json({
      success: false,
      message: '更新客户失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 删除客户 - 仅管理员权限
router.delete('/:id', authenticate, requireAnyRole(['admin', 'manager']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query('DELETE FROM clients WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '客户不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(200).json({
        success: true,
        message: '客户删除成功',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Delete client error:', error);
    return res.status(500).json({
      success: false,
      message: '删除客户失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 批量更新客户状态
router.patch('/batch/status', authenticate, requireAnyRole(['admin', 'manager']), async (req: Request, res: Response) => {
  try {
    const { clientIds, status } = req.body;
    
    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的客户ID列表',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!['active', 'potential', 'inactive', 'lost'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的客户状态',
        timestamp: new Date().toISOString()
      });
    }
    
    const client = await pool.connect();
    
    try {
      const placeholders = clientIds.map((_, index) => `$${index + 2}`).join(',');
      const result = await client.query(
        `UPDATE clients SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id IN (${placeholders}) RETURNING id`,
        [status, ...clientIds]
      );
      
      return res.status(200).json({
        success: true,
        message: `成功更新 ${result.rows.length} 个客户的状态`,
        data: { updatedCount: result.rows.length },
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Batch update clients status error:', error);
    return res.status(500).json({
      success: false,
      message: '批量更新客户状态失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取客户统计信息
router.get('/stats/overview', authenticate, requirePermission('view_clients'), async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      
      // 如果是viewer角色，只统计分配给自己的客户
      if (req.user?.role === 'viewer') {
        whereClause += ' AND assigned_to = $1';
        params.push(req.user.id);
      }
      
      // 获取各种统计数据
      const statsQuery = `
        SELECT 
          COUNT(*) as total_clients,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_clients,
          COUNT(CASE WHEN status = 'potential' THEN 1 END) as potential_clients,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_clients,
          COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_clients,
          COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
          COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
          COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority,
          SUM(COALESCE(estimated_value, 0)) as total_estimated_value,
          AVG(COALESCE(estimated_value, 0)) as avg_estimated_value,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_this_month,
          COUNT(CASE WHEN last_contact >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as contacted_this_week
        FROM clients ${whereClause}
      `;
      
      const result = await client.query(statsQuery, params);
      const stats = result.rows[0];
      
      return res.status(200).json({
        success: true,
        data: {
          totalClients: parseInt(stats.total_clients),
          statusBreakdown: {
            active: parseInt(stats.active_clients),
            potential: parseInt(stats.potential_clients),
            inactive: parseInt(stats.inactive_clients),
            lost: parseInt(stats.lost_clients)
          },
          priorityBreakdown: {
            high: parseInt(stats.high_priority),
            medium: parseInt(stats.medium_priority),
            low: parseInt(stats.low_priority)
          },
          businessMetrics: {
            totalEstimatedValue: parseFloat(stats.total_estimated_value) || 0,
            avgEstimatedValue: parseFloat(stats.avg_estimated_value) || 0,
            newThisMonth: parseInt(stats.new_this_month),
            contactedThisWeek: parseInt(stats.contacted_this_week)
          }
        },
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Get client stats error:', error);
    return res.status(500).json({
      success: false,
      message: '获取客户统计信息失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 添加客户跟进记录
router.post('/:id/follow-up', authenticate, requirePermission('view_clients'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes, nextFollowUp } = req.body;
    
    if (!notes) {
      return res.status(400).json({
        success: false,
        message: '跟进记录内容不能为空',
        timestamp: new Date().toISOString()
      });
    }
    
    const client = await pool.connect();
    
    try {
      // 更新客户的最后联系时间和下次跟进时间
      const updateResult = await client.query(
        `UPDATE clients SET 
           last_contact = CURRENT_TIMESTAMP,
           next_follow_up = $2,
           notes = CASE 
             WHEN notes IS NULL OR notes = '' THEN $3
             ELSE notes || E'\\n\\n--- ' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI') || ' ---\\n' || $3
           END,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 
         RETURNING *`,
        [id, nextFollowUp, notes]
      );
      
      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '客户不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(200).json({
        success: true,
        message: '跟进记录添加成功',
        data: {
          lastContact: new Date(),
          nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null
        },
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Add follow-up record error:', error);
    return res.status(500).json({
      success: false,
      message: '添加跟进记录失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;