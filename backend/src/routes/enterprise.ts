import express from 'express';
import { Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requirePermission } from '../middleware/auth';
import { Enterprise, ApiResponse, PaginatedResponse } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 获取企业列表
router.get('/', authenticate, requirePermission('view_enterprise'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const keyword = req.query.keyword as string;
    const industry = req.query.industry as string;
    
    const client = await pool.connect();
    
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;
      
      if (keyword) {
        paramCount++;
        whereClause += ` AND (name ILIKE $${paramCount} OR legal_name ILIKE $${paramCount})`;
        params.push(`%${keyword}%`);
      }
      
      if (industry) {
        paramCount++;
        whereClause += ` AND industry = $${paramCount}`;
        params.push(industry);
      }
      
      // 查询总数
      const countResult = await client.query(
        `SELECT COUNT(*) FROM enterprises ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);
      
      // 查询数据
      const result = await client.query(
        `SELECT * FROM enterprises ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        [...params, limit, offset]
      );
      
      const enterprises: Enterprise[] = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        legalName: row.legal_name,
        creditCode: row.credit_code,
        registrationNumber: row.registration_number,
        industry: row.industry,
        establishDate: new Date(row.establish_date),
        registeredCapital: parseFloat(row.registered_capital),
        businessScope: row.business_scope,
        legalRepresentative: row.legal_representative,
        address: row.address,
        phone: row.phone,
        email: row.email,
        website: row.website,
        status: row.status,
        riskLevel: row.risk_level,
        svs: parseFloat(row.svs),
        des: parseFloat(row.des),
        nis: parseFloat(row.nis),
        pcs: parseFloat(row.pcs),
        supplierCount: row.supplier_count,
        customerCount: row.customer_count,
        partnerCount: row.partner_count,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
      
      const response: PaginatedResponse<Enterprise> = {
        success: true,
        data: enterprises,
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
    console.error('Get enterprises error:', error);
    res.status(500).json({
      success: false,
      message: '获取企业列表失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取企业详情
router.get('/:id', authenticate, requirePermission('view_enterprise'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM enterprises WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '企业不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      const row = result.rows[0];
      const enterprise: Enterprise = {
        id: row.id,
        name: row.name,
        legalName: row.legal_name,
        creditCode: row.credit_code,
        registrationNumber: row.registration_number,
        industry: row.industry,
        establishDate: new Date(row.establish_date),
        registeredCapital: parseFloat(row.registered_capital),
        businessScope: row.business_scope,
        legalRepresentative: row.legal_representative,
        address: row.address,
        phone: row.phone,
        email: row.email,
        website: row.website,
        status: row.status,
        riskLevel: row.risk_level,
        svs: parseFloat(row.svs),
        des: parseFloat(row.des),
        nis: parseFloat(row.nis),
        pcs: parseFloat(row.pcs),
        supplierCount: row.supplier_count,
        customerCount: row.customer_count,
        partnerCount: row.partner_count,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      
      const response: ApiResponse<Enterprise> = {
        success: true,
        data: enterprise,
        timestamp: new Date().toISOString()
      };
      
      return res.status(200).json(response);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Get enterprise detail error:', error);
    return res.status(500).json({
      success: false,
      message: '获取企业详情失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 创建企业
router.post('/', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const enterpriseData = req.body;
    
    const client = await pool.connect();
    
    try {
      // 检查统一社会信用代码是否已存在
      if (enterpriseData.creditCode) {
        const existingResult = await client.query(
          'SELECT id FROM enterprises WHERE credit_code = $1',
          [enterpriseData.creditCode]
        );
        
        if (existingResult.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: '统一社会信用代码已存在',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      const result = await client.query(`
        INSERT INTO enterprises (
          name, legal_name, credit_code, registration_number, industry,
          establish_date, registered_capital, business_scope, legal_representative,
          address, phone, email, website, status, risk_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `, [
        enterpriseData.name,
        enterpriseData.legalName,
        enterpriseData.creditCode,
        enterpriseData.registrationNumber,
        enterpriseData.industry,
        enterpriseData.establishDate,
        enterpriseData.registeredCapital,
        enterpriseData.businessScope,
        enterpriseData.legalRepresentative,
        enterpriseData.address,
        enterpriseData.phone,
        enterpriseData.email,
        enterpriseData.website,
        enterpriseData.status || 'active',
        enterpriseData.riskLevel || 'low'
      ]);
      
      const row = result.rows[0];
      const enterprise: Enterprise = {
        id: row.id,
        name: row.name,
        legalName: row.legal_name,
        creditCode: row.credit_code,
        registrationNumber: row.registration_number,
        industry: row.industry,
        establishDate: new Date(row.establish_date),
        registeredCapital: parseFloat(row.registered_capital),
        businessScope: row.business_scope,
        legalRepresentative: row.legal_representative,
        address: row.address,
        phone: row.phone,
        email: row.email,
        website: row.website,
        status: row.status,
        riskLevel: row.risk_level,
        svs: parseFloat(row.svs),
        des: parseFloat(row.des),
        nis: parseFloat(row.nis),
        pcs: parseFloat(row.pcs),
        supplierCount: row.supplier_count,
        customerCount: row.customer_count,
        partnerCount: row.partner_count,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      
      return res.status(201).json({
        success: true,
        data: enterprise,
        message: '企业创建成功',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Create enterprise error:', error);
    return res.status(500).json({
      success: false,
      message: '创建企业失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 更新企业
router.put('/:id', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const enterpriseData = req.body;
    
    const client = await pool.connect();
    
    try {
      // 检查企业是否存在
      const existingResult = await client.query('SELECT id FROM enterprises WHERE id = $1', [id]);
      
      if (existingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '企业不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      const result = await client.query(`
        UPDATE enterprises SET
          name = COALESCE($2, name),
          legal_name = COALESCE($3, legal_name),
          industry = COALESCE($4, industry),
          business_scope = COALESCE($5, business_scope),
          legal_representative = COALESCE($6, legal_representative),
          address = COALESCE($7, address),
          phone = COALESCE($8, phone),
          email = COALESCE($9, email),
          website = COALESCE($10, website),
          status = COALESCE($11, status),
          risk_level = COALESCE($12, risk_level),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [
        id,
        enterpriseData.name,
        enterpriseData.legalName,
        enterpriseData.industry,
        enterpriseData.businessScope,
        enterpriseData.legalRepresentative,
        enterpriseData.address,
        enterpriseData.phone,
        enterpriseData.email,
        enterpriseData.website,
        enterpriseData.status,
        enterpriseData.riskLevel
      ]);
      
      const row = result.rows[0];
      const enterprise: Enterprise = {
        id: row.id,
        name: row.name,
        legalName: row.legal_name,
        creditCode: row.credit_code,
        registrationNumber: row.registration_number,
        industry: row.industry,
        establishDate: new Date(row.establish_date),
        registeredCapital: parseFloat(row.registered_capital),
        businessScope: row.business_scope,
        legalRepresentative: row.legal_representative,
        address: row.address,
        phone: row.phone,
        email: row.email,
        website: row.website,
        status: row.status,
        riskLevel: row.risk_level,
        svs: parseFloat(row.svs),
        des: parseFloat(row.des),
        nis: parseFloat(row.nis),
        pcs: parseFloat(row.pcs),
        supplierCount: row.supplier_count,
        customerCount: row.customer_count,
        partnerCount: row.partner_count,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      
      return res.status(200).json({
        success: true,
        data: enterprise,
        message: '企业更新成功',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Update enterprise error:', error);
    return res.status(500).json({
      success: false,
      message: '更新企业失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 删除企业（软删除）
router.delete('/:id', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    try {
      // 检查企业是否存在
      const existingResult = await client.query('SELECT id, name FROM enterprises WHERE id = $1', [id]);
      
      if (existingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '企业不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      // 软删除：将状态设置为 inactive
      const result = await client.query(`
        UPDATE enterprises SET
          status = 'inactive',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, name
      `, [id]);
      
      return res.status(200).json({
        success: true,
        data: { id: result.rows[0].id },
        message: `企业 "${result.rows[0].name}" 已删除`,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Delete enterprise error:', error);
    return res.status(500).json({
      success: false,
      message: '删除企业失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 计算企业评分
router.post('/:id/calculate-score', authenticate, requirePermission('view_enterprise'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    try {
      // 检查企业是否存在
      const enterpriseResult = await client.query('SELECT id FROM enterprises WHERE id = $1', [id]);
      
      if (enterpriseResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '企业不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      // 这里可以添加复杂的评分计算逻辑
      // 暂时返回随机生成的评分用于演示
      const scores = {
        svs: Math.random() * 100, // 供应商稳定性评分
        des: Math.random() * 100, // 数据完整性评分
        nis: Math.random() * 100, // 网络影响评分
        pcs: Math.random() * 100  // 付款能力评分
      };
      
      // 更新企业评分
      await client.query(`
        UPDATE enterprises SET
          svs = $2,
          des = $3,
          nis = $4,
          pcs = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id, scores.svs, scores.des, scores.nis, scores.pcs]);
      
      return res.status(200).json({
        success: true,
        data: scores,
        message: '企业评分计算完成',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Calculate enterprise score error:', error);
    return res.status(500).json({
      success: false,
      message: '计算企业评分失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 