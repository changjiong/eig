import express from 'express';
import { Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requirePermission } from '../middleware/auth';
import { Client, ApiResponse, PaginatedResponse } from '../types/database';

const router = express.Router();

// 获取客户列表
router.get('/', authenticate, requirePermission('view_clients'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword as string;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    
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
      
      // 查询总数
      const countResult = await client.query(
        `SELECT COUNT(*) FROM clients ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);
      
      // 查询数据
      const result = await client.query(
        `SELECT * FROM clients ${whereClause} 
         ORDER BY created_at DESC 
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
      
      res.status(200).json(response);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
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
      
      res.status(200).json(response);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Get client detail error:', error);
    res.status(500).json({
      success: false,
      message: '获取客户详情失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 创建客户
router.post('/', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const clientData = req.body;
    const userId = req.user?.id;
    
    const client = await pool.connect();
    
    try {
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
      
      res.status(201).json({
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
    res.status(500).json({
      success: false,
      message: '创建客户失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 更新客户
router.put('/:id', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clientData = req.body;
    
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
      
      res.status(200).json({
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
    res.status(500).json({
      success: false,
      message: '更新客户失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 删除客户
router.delete('/:id', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
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
      
      res.status(200).json({
        success: true,
        message: '客户删除成功',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: '删除客户失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;