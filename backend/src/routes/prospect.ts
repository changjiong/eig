import express, { Request, Response } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// 获取潜客列表
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', industry, score_min, status, priority } = req.query;
    
    let query = 'SELECT * FROM prospects WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (industry) {
      query += ` AND industry = $${paramIndex}`;
      params.push(industry);
      paramIndex++;
    }

    if (score_min) {
      query += ` AND ((pcs + svs + des + nis) / 4) >= $${paramIndex}`;
      params.push(score_min);
      paramIndex++;
    }

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

    query += ` ORDER BY ((pcs + svs + des + nis) / 4) DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string));
    params.push((parseInt(page as string) - 1) * parseInt(limit as string));

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM prospects WHERE 1=1');
    
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
    console.error('Error fetching prospects:', error);
    res.status(500).json({
      success: false,
      message: '获取潜客列表失败'
    });
  }
});

// 获取高优先级潜客（首页用）
router.get('/high-priority', authenticate, async (req: Request, res: Response) => {
  try {
    const { limit = '5' } = req.query;
    
    const result = await pool.query(
      'SELECT * FROM prospects WHERE priority = $1 ORDER BY ((pcs + svs + des + nis) / 4) DESC LIMIT $2',
      ['high', parseInt(limit as string)]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching high priority prospects:', error);
    res.status(500).json({
      success: false,
      message: '获取高优先级潜客失败'
    });
  }
});

// 获取单个潜客
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM prospects WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '潜客不存在'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching prospect:', error);
    res.status(500).json({
      success: false,
      message: '获取潜客详情失败'
    });
  }
});

// 创建潜客
router.post('/', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      industry, 
      registeredCapital, 
      employeeCount, 
      svs, 
      des, 
      nis, 
      pcs, 
      discoveryPath, 
      priority = 'medium',
      status = 'identified',
      contactInfo,
      notes
    } = req.body;
    const created_by = req.user?.id;
    
    if (!name || !industry) {
      return res.status(400).json({
        success: false,
        message: '企业名称和行业不能为空'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO prospects (name, industry, registered_capital, employee_count, svs, des, nis, pcs, 
                             discovery_path, priority, status, contact_info, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [name, industry, registeredCapital, employeeCount, svs, des, nis, pcs, 
       discoveryPath, priority, status, contactInfo, notes, created_by]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '潜客创建成功'
    });
  } catch (error) {
    console.error('Error creating prospect:', error);
    res.status(500).json({
      success: false,
      message: '创建潜客失败'
    });
  }
});

// 更新潜客
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, industry, registeredCapital, employeeCount, 
      svs, des, nis, pcs, discoveryPath, priority, status, 
      contactInfo, notes 
    } = req.body;
    
    // 检查潜客是否存在
    const existingProspect = await pool.query('SELECT * FROM prospects WHERE id = $1', [id]);
    if (existingProspect.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '潜客不存在'
      });
    }
    
    const result = await pool.query(
      `UPDATE prospects 
       SET name = $2, industry = $3, registered_capital = $4, employee_count = $5,
           svs = $6, des = $7, nis = $8, pcs = $9, discovery_path = $10,
           priority = $11, status = $12, contact_info = $13, notes = $14, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, name, industry, registeredCapital, employeeCount, 
       svs, des, nis, pcs, discoveryPath, priority, status, contactInfo, notes]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: '潜客更新成功'
    });
  } catch (error) {
    console.error('Error updating prospect:', error);
    res.status(500).json({
      success: false,
      message: '更新潜客失败'
    });
  }
});

// 删除潜客
router.delete('/:id', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM prospects WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '潜客不存在'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: '潜客删除成功'
    });
  } catch (error) {
    console.error('Error deleting prospect:', error);
    res.status(500).json({
      success: false,
      message: '删除潜客失败'
    });
  }
});

// 批量更新潜客状态
router.patch('/batch/status', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { prospect_ids, status } = req.body;
    
    if (!prospect_ids || !Array.isArray(prospect_ids) || prospect_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '潜客ID列表不能为空'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: '状态不能为空'
      });
    }
    
    const placeholders = prospect_ids.map((_, index) => `$${index + 2}`).join(', ');
    const result = await pool.query(
      `UPDATE prospects SET status = $1, updated_at = NOW() 
       WHERE id IN (${placeholders})
       RETURNING *`,
      [status, ...prospect_ids]
    );
    
    res.json({
      success: true,
      data: result.rows,
      message: `成功更新 ${result.rows.length} 个潜客的状态`
    });
  } catch (error) {
    console.error('Error batch updating prospect status:', error);
    res.status(500).json({
      success: false,
      message: '批量更新潜客状态失败'
    });
  }
});

export default router; 