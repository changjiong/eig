import express, { Request, Response } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// 获取事件列表
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', event_type, importance_min, enterprise_id } = req.query;
    
    let query = 'SELECT * FROM events WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (event_type) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(event_type);
      paramIndex++;
    }

    if (importance_min) {
      query += ` AND importance >= $${paramIndex}`;
      params.push(importance_min);
      paramIndex++;
    }

    if (enterprise_id) {
      query += ` AND enterprise_id = $${paramIndex}`;
      params.push(enterprise_id);
      paramIndex++;
    }

    query += ` ORDER BY date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string));
    params.push((parseInt(page as string) - 1) * parseInt(limit as string));

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM events WHERE 1=1');
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: '获取事件列表失败'
    });
  }
});

// 获取单个事件
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '事件不存在'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: '获取事件详情失败'
    });
  }
});

// 创建事件
router.post('/', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      description, 
      event_type, 
      enterprise_id, 
      date, 
      importance = 50, 
      source, 
      metadata 
    } = req.body;
    const created_by = req.user?.id;
    
    if (!title || !event_type || !enterprise_id) {
      return res.status(400).json({
        success: false,
        message: '标题、事件类型和企业ID不能为空'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO events (title, description, event_type, enterprise_id, date, importance, source, metadata, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, description, event_type, enterprise_id, date, importance, source, metadata, created_by]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '事件创建成功'
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: '创建事件失败'
    });
  }
});

// 更新事件
router.put('/:id', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, event_type, enterprise_id, date, importance, source, metadata } = req.body;
    
    // 检查事件是否存在
    const existingEvent = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (existingEvent.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '事件不存在'
      });
    }
    
    const result = await pool.query(
      `UPDATE events 
       SET title = $2, description = $3, event_type = $4, enterprise_id = $5, 
           date = $6, importance = $7, source = $8, metadata = $9, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, title, description, event_type, enterprise_id, date, importance, source, metadata]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: '事件更新成功'
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: '更新事件失败'
    });
  }
});

// 删除事件
router.delete('/:id', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '事件不存在'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: '事件删除成功'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: '删除事件失败'
    });
  }
});

export default router; 