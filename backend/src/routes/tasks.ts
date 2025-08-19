import express, { Request, Response } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// 获取任务列表
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      type, 
      assignee_id, 
      entity_type 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (type) {
      whereClause += ` AND type = $${paramIndex++}`;
      params.push(type);
    }
    
    if (assignee_id) {
      whereClause += ` AND assignee_id = $${paramIndex++}`;
      params.push(assignee_id);
    }
    
    if (entity_type) {
      whereClause += ` AND entity_type = $${paramIndex++}`;
      params.push(entity_type);
    }

    const client = await pool.connect();
    
    try {
      // 获取总数
      const countResult = await client.query(
        `SELECT COUNT(*) FROM tasks WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // 获取任务列表
      const result = await client.query(
        `SELECT 
           t.*,
           u.name as assignee_name
         FROM tasks t
         LEFT JOIN users u ON t.assignee_id = u.id
         WHERE ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, limit, offset]
      );

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          total,
          page: Number(page),
          pageSize: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        },
        timestamp: new Date().toISOString()
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务列表失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取单个任务
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `SELECT 
           t.*,
           u.name as assignee_name,
           creator.name as creator_name
         FROM tasks t
         LEFT JOIN users u ON t.assignee_id = u.id
         LEFT JOIN users creator ON t.created_by = creator.id
         WHERE t.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '任务不存在',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
        timestamp: new Date().toISOString()
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('获取任务详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务详情失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 创建任务
router.post('/', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      type,
      priority = 3,
      assignee_id,
      entity_id,
      entity_type,
      due_date,
      metadata = {}
    } = req.body;

    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: '标题和类型为必填字段',
        timestamp: new Date().toISOString()
      });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO tasks (
           title, description, type, priority, 
           assignee_id, entity_id, entity_type, 
           due_date, metadata
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          title, description, type, priority,
          assignee_id, entity_id, entity_type,
          due_date, JSON.stringify(metadata)
        ]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: '任务创建成功',
        timestamp: new Date().toISOString()
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({
      success: false,
      message: '创建任务失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 更新任务
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      assignee_id,
      due_date,
      metadata
    } = req.body;

    const client = await pool.connect();
    
    try {
      // 检查任务是否存在
      const existingTask = await client.query(
        'SELECT * FROM tasks WHERE id = $1',
        [id]
      );

      if (existingTask.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '任务不存在',
          timestamp: new Date().toISOString()
        });
      }

      // 更新任务
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updateFields.push(`title = $${paramIndex++}`);
        params.push(title);
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        params.push(description);
      }
      if (status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        params.push(status);
        
        // 如果状态改为完成，设置完成时间
        if (status === 'completed') {
          updateFields.push(`completed_at = $${paramIndex++}`);
          params.push(new Date());
        }
      }
      if (priority !== undefined) {
        updateFields.push(`priority = $${paramIndex++}`);
        params.push(priority);
      }
      if (assignee_id !== undefined) {
        updateFields.push(`assignee_id = $${paramIndex++}`);
        params.push(assignee_id);
      }
      if (due_date !== undefined) {
        updateFields.push(`due_date = $${paramIndex++}`);
        params.push(due_date);
      }
      if (metadata !== undefined) {
        updateFields.push(`metadata = $${paramIndex++}`);
        params.push(JSON.stringify(metadata));
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id); // 添加WHERE条件的参数

      const result = await client.query(
        `UPDATE tasks SET ${updateFields.join(', ')} 
         WHERE id = $${paramIndex} 
         RETURNING *`,
        params
      );

      res.json({
        success: true,
        data: result.rows[0],
        message: '任务更新成功',
        timestamp: new Date().toISOString()
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('更新任务失败:', error);
    res.status(500).json({
      success: false,
      message: '更新任务失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 删除任务
router.delete('/:id', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'DELETE FROM tasks WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '任务不存在',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: '任务删除成功',
        timestamp: new Date().toISOString()
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({
      success: false,
      message: '删除任务失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 批量更新任务状态
router.patch('/batch/status', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { task_ids, status } = req.body;

    if (!Array.isArray(task_ids) || !status) {
      return res.status(400).json({
        success: false,
        message: '任务ID列表和状态为必填字段',
        timestamp: new Date().toISOString()
      });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `UPDATE tasks 
         SET status = $1, 
             completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ANY($2::UUID[])
         RETURNING id, status`,
        [status, task_ids]
      );

      res.json({
        success: true,
        data: result.rows,
        message: `成功更新 ${result.rows.length} 个任务状态`,
        timestamp: new Date().toISOString()
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('批量更新任务状态失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新任务状态失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 