import express from 'express';
import { Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requirePermission } from '../middleware/auth';
import { DataSource, DataImportTask, ApiResponse, PaginatedResponse } from '../types/database';

const router = express.Router();

// 获取数据源列表
router.get('/sources', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    const client = await pool.connect();
    
    try {
      // 查询总数
      const countResult = await client.query('SELECT COUNT(*) FROM data_sources');
      const total = parseInt(countResult.rows[0].count);
      
      // 查询数据
      const result = await client.query(`
        SELECT * FROM data_sources 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
      const dataSources: DataSource[] = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        status: row.status,
        lastSync: row.last_sync ? new Date(row.last_sync) : undefined,
        totalRecords: row.total_records,
        errorCount: row.error_count,
        config: row.config,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
      
      const response: PaginatedResponse<DataSource> = {
        success: true,
        data: dataSources,
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
    console.error('Get data sources error:', error);
    res.status(500).json({
      success: false,
      message: '获取数据源列表失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 创建数据源
router.post('/sources', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { name, type, config } = req.body;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO data_sources (name, type, config, status)
        VALUES ($1, $2, $3, 'disconnected')
        RETURNING *
      `, [name, type, config]);
      
      const row = result.rows[0];
      const dataSource: DataSource = {
        id: row.id,
        name: row.name,
        type: row.type,
        status: row.status,
        lastSync: row.last_sync ? new Date(row.last_sync) : undefined,
        totalRecords: row.total_records,
        errorCount: row.error_count,
        config: row.config,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      
      res.status(201).json({
        success: true,
        data: dataSource,
        message: '数据源创建成功',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Create data source error:', error);
    res.status(500).json({
      success: false,
      message: '创建数据源失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取导入任务列表
router.get('/tasks', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    
    const client = await pool.connect();
    
    try {
      let whereClause = '';
      const params: any[] = [limit, offset];
      
      if (status) {
        whereClause = 'WHERE status = $3';
        params.push(status);
      }
      
      // 查询总数
      const countQuery = status ? 
        'SELECT COUNT(*) FROM data_import_tasks WHERE status = $1' :
        'SELECT COUNT(*) FROM data_import_tasks';
      const countParams = status ? [status] : [];
      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);
      
      // 查询数据
      const result = await client.query(`
        SELECT * FROM data_import_tasks 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `, params);
      
      const tasks: DataImportTask[] = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        sourceId: row.source_id,
        sourceName: row.source_name,
        status: row.status,
        progress: row.progress,
        totalRecords: row.total_records,
        processedRecords: row.processed_records,
        errorRecords: row.error_records,
        startTime: row.start_time ? new Date(row.start_time) : undefined,
        endTime: row.end_time ? new Date(row.end_time) : undefined,
        errorMessage: row.error_message,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at)
      }));
      
      const response: PaginatedResponse<DataImportTask> = {
        success: true,
        data: tasks,
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
    console.error('Get import tasks error:', error);
    res.status(500).json({
      success: false,
      message: '获取导入任务列表失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 创建导入任务
router.post('/import', authenticate, requirePermission('import_data'), async (req: Request, res: Response) => {
  try {
    const { name, sourceId, sourceName } = req.body;
    const userId = req.user?.id;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO data_import_tasks (name, source_id, source_name, created_by, status)
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *
      `, [name, sourceId, sourceName, userId]);
      
      const row = result.rows[0];
      const task: DataImportTask = {
        id: row.id,
        name: row.name,
        sourceId: row.source_id,
        sourceName: row.source_name,
        status: row.status,
        progress: row.progress,
        totalRecords: row.total_records,
        processedRecords: row.processed_records,
        errorRecords: row.error_records,
        startTime: row.start_time ? new Date(row.start_time) : undefined,
        endTime: row.end_time ? new Date(row.end_time) : undefined,
        errorMessage: row.error_message,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at)
      };
      
      // 这里可以触发实际的数据导入处理
      // 比如将任务加入队列，由后台进程处理
      
      res.status(201).json({
        success: true,
        data: task,
        message: '导入任务创建成功，正在处理中...',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Create import task error:', error);
    res.status(500).json({
      success: false,
      message: '创建导入任务失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 更新任务状态（通常由后台进程调用）
router.put('/tasks/:id', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, progress, processedRecords, errorRecords, errorMessage } = req.body;
    
    const client = await pool.connect();
    
    try {
      const updateFields = [];
      const params = [id];
      let paramCount = 1;
      
      if (status !== undefined) {
        paramCount++;
        updateFields.push(`status = $${paramCount}`);
        params.push(status);
      }
      
      if (progress !== undefined) {
        paramCount++;
        updateFields.push(`progress = $${paramCount}`);
        params.push(progress);
      }
      
      if (processedRecords !== undefined) {
        paramCount++;
        updateFields.push(`processed_records = $${paramCount}`);
        params.push(processedRecords);
      }
      
      if (errorRecords !== undefined) {
        paramCount++;
        updateFields.push(`error_records = $${paramCount}`);
        params.push(errorRecords);
      }
      
      if (errorMessage !== undefined) {
        paramCount++;
        updateFields.push(`error_message = $${paramCount}`);
        params.push(errorMessage);
      }
      
      if (status === 'running') {
        updateFields.push('start_time = CURRENT_TIMESTAMP');
      } else if (status === 'completed' || status === 'failed') {
        updateFields.push('end_time = CURRENT_TIMESTAMP');
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有可更新的字段',
          timestamp: new Date().toISOString()
        });
      }
      
      const result = await client.query(`
        UPDATE data_import_tasks SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING *
      `, params);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '任务不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      const row = result.rows[0];
      const task: DataImportTask = {
        id: row.id,
        name: row.name,
        sourceId: row.source_id,
        sourceName: row.source_name,
        status: row.status,
        progress: row.progress,
        totalRecords: row.total_records,
        processedRecords: row.processed_records,
        errorRecords: row.error_records,
        startTime: row.start_time ? new Date(row.start_time) : undefined,
        endTime: row.end_time ? new Date(row.end_time) : undefined,
        errorMessage: row.error_message,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at)
      };
      
      res.status(200).json({
        success: true,
        data: task,
        message: '任务状态更新成功',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: '更新任务失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 