import express, { Request, Response } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// 获取任务列表
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', status, priority, assigned_to } = req.query;
    
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (assigned_to) {
      query += ` AND assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string));
    params.push((parseInt(page as string) - 1) * parseInt(limit as string));

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM tasks WHERE 1=1');
    
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
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: '获取任务列表失败'
    });
  }
});

// 获取单个任务
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: '获取任务详情失败'
    });
  }
});

// 创建任务
router.post('/', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { title, description, priority = 'medium', assigned_to, due_date, tags } = req.body;
    const created_by = req.user?.id;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '任务标题不能为空'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO tasks (title, description, priority, status, assigned_to, due_date, tags, created_by)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7)
       RETURNING *`,
      [title, description, priority, assigned_to, due_date, tags, created_by]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '任务创建成功'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: '创建任务失败'
    });
  }
});

// 更新任务
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, assigned_to, due_date, tags } = req.body;
    
    // 检查任务是否存在
    const existingTask = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (existingTask.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    const result = await pool.query(
      `UPDATE tasks 
       SET title = $2, description = $3, priority = $4, status = $5, 
           assigned_to = $6, due_date = $7, tags = $8, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, title, description, priority, status, assigned_to, due_date, tags]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: '任务更新成功'
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: '更新任务失败'
    });
  }
});

// 删除任务
router.delete('/:id', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: '任务删除成功'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: '删除任务失败'
    });
  }
});

// 批量更新任务状态
router.patch('/batch/status', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { task_ids, status } = req.body;
    
    if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '任务ID列表不能为空'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: '状态不能为空'
      });
    }
    
    const placeholders = task_ids.map((_, index) => `$${index + 2}`).join(', ');
    const result = await pool.query(
      `UPDATE tasks SET status = $1, updated_at = NOW() 
       WHERE id IN (${placeholders})
       RETURNING *`,
      [status, ...task_ids]
    );
    
    res.json({
      success: true,
      data: result.rows,
      message: `成功更新 ${result.rows.length} 个任务的状态`
    });
  } catch (error) {
    console.error('Error batch updating task status:', error);
    res.status(500).json({
      success: false,
      message: '批量更新任务状态失败'
    });
  }
});

export default router; 