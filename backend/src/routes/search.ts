import express from 'express';
import { Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requirePermission } from '../middleware/auth';
import { Enterprise, Client, ApiResponse } from '../types/database';

const router = express.Router();

// 全局搜索
router.get('/', authenticate, requirePermission('view_search'), async (req: Request, res: Response) => {
  try {
    const { query, type, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词',
        timestamp: new Date().toISOString()
      });
    }
    
    const searchLimit = Math.min(parseInt(limit as string), 100);
    const searchQuery = `%${query}%`;
    
    const client = await pool.connect();
    
    try {
      const results: any = {
        enterprises: [],
        clients: []
      };
      
      // 搜索企业
      if (!type || type === 'enterprise') {
        const enterpriseResult = await client.query(`
          SELECT id, name, industry, legal_representative, registered_capital, 
                 address, phone, email, website, status, risk_level, 
                 svs, des, nis, pcs, created_at, updated_at
          FROM enterprises
          WHERE (name ILIKE $1 OR legal_name ILIKE $1 OR industry ILIKE $1 
                 OR legal_representative ILIKE $1 OR address ILIKE $1)
            AND status = 'active'
          ORDER BY 
            CASE 
              WHEN name ILIKE $1 THEN 1
              WHEN legal_name ILIKE $1 THEN 2
              WHEN legal_representative ILIKE $1 THEN 3
              ELSE 4
            END,
            name
          LIMIT $2
        `, [searchQuery, searchLimit]);
        
        results.enterprises = enterpriseResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          industry: row.industry,
          legalRepresentative: row.legal_representative,
          registeredCapital: parseFloat(row.registered_capital),
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
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          type: 'enterprise'
        }));
      }
      
      // 搜索客户
      if (!type || type === 'client') {
        let clientWhereClause = `(name ILIKE $1 OR company ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1)`;
        const clientParams = [searchQuery, searchLimit];
        
        // 如果是viewer角色，只搜索分配给自己的客户
        if (req.user?.role === 'viewer') {
          clientWhereClause += ` AND assigned_to = $3`;
          clientParams.splice(1, 0, req.user.id); // 在索引1处插入user.id，其他参数后移
          clientParams[2] = searchLimit; // 更新limit参数位置
        }
        
        const clientResult = await client.query(`
          SELECT id, name, company, industry, position, email, phone, 
                 status, priority, assigned_to, assigned_to_name,
                 last_contact, next_follow_up, estimated_value, tags, created_at, updated_at
          FROM clients
          WHERE ${clientWhereClause}
          ORDER BY 
            CASE 
              WHEN name ILIKE $1 THEN 1
              WHEN company ILIKE $1 THEN 2
              WHEN email ILIKE $1 THEN 3
              ELSE 4
            END,
            name
          LIMIT $${clientParams.length}
        `, clientParams);
        
        results.clients = clientResult.rows.map(row => ({
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
          tags: row.tags || [],
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          type: 'client'
        }));
      }
      
      // 计算总结果数
      const totalResults = results.enterprises.length + results.clients.length;
      
      return res.status(200).json({
        success: true,
        data: {
          query,
          totalResults,
          results
        },
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Global search error:', error);
    return res.status(500).json({
      success: false,
      message: '搜索失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 搜索建议（用于自动完成）
router.get('/suggestions', authenticate, requirePermission('view_search'), async (req: Request, res: Response) => {
  try {
    const { query, type } = req.query;
    
    if (!query || (query as string).length < 2) {
      return res.status(200).json({
        success: true,
        data: { suggestions: [] },
        timestamp: new Date().toISOString()
      });
    }
    
    const searchQuery = `%${query}%`;
    const suggestions: any[] = [];
    
    const client = await pool.connect();
    
    try {
      // 企业名称建议
      if (!type || type === 'enterprise') {
        const enterpriseResult = await client.query(`
          SELECT DISTINCT name, industry, id
          FROM enterprises
          WHERE name ILIKE $1 AND status = 'active'
          ORDER BY name
          LIMIT 10
        `, [searchQuery]);
        
        suggestions.push(...enterpriseResult.rows.map(row => ({
          id: row.id,
          text: row.name,
          type: 'enterprise',
          subtitle: row.industry
        })));
      }
      
      // 客户建议
      if (!type || type === 'client') {
        let clientWhereClause = `name ILIKE $1`;
        const clientParams = [searchQuery];
        
        // 如果是viewer角色，只建议分配给自己的客户
        if (req.user?.role === 'viewer') {
          clientWhereClause += ` AND assigned_to = $2`;
          clientParams.push(req.user.id);
        }
        
        const clientResult = await client.query(`
          SELECT DISTINCT name, company, id
          FROM clients
          WHERE ${clientWhereClause}
          ORDER BY name
          LIMIT 10
        `, clientParams);
        
        suggestions.push(...clientResult.rows.map(row => ({
          id: row.id,
          text: row.name,
          type: 'client',
          subtitle: row.company
        })));
      }
      
      // 行业建议
      if (!type || type === 'industry') {
        const industryResult = await client.query(`
          SELECT DISTINCT industry, COUNT(*) as count
          FROM enterprises
          WHERE industry ILIKE $1 AND status = 'active'
          GROUP BY industry
          ORDER BY count DESC, industry
          LIMIT 10
        `, [searchQuery]);
        
        suggestions.push(...industryResult.rows.map(row => ({
          text: row.industry,
          type: 'industry',
          subtitle: `${row.count} 家企业`
        })));
      }
      
      return res.status(200).json({
        success: true,
        data: { suggestions: suggestions.slice(0, 20) }, // 最多返回20个建议
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Search suggestions error:', error);
    return res.status(500).json({
      success: false,
      message: '获取搜索建议失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 高级搜索
router.post('/advanced', authenticate, requirePermission('view_search'), async (req: Request, res: Response) => {
  try {
    const {
      keyword,
      entityType,
      filters,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 20
    } = req.body;
    
    const offset = (page - 1) * limit;
    const searchLimit = Math.min(limit, 100);
    
    const client = await pool.connect();
    
    try {
      let results: any[] = [];
      let total = 0;
      
      if (!entityType || entityType === 'enterprise') {
        let whereClause = 'WHERE status = \'active\'';
        const params: any[] = [];
        let paramCount = 0;
        
        // 关键词搜索
        if (keyword) {
          paramCount++;
          whereClause += ` AND (name ILIKE $${paramCount} OR legal_name ILIKE $${paramCount} OR industry ILIKE $${paramCount})`;
          params.push(`%${keyword}%`);
        }
        
        // 筛选条件
        if (filters) {
          if (filters.industry && filters.industry.length > 0) {
            paramCount++;
            whereClause += ` AND industry = ANY($${paramCount})`;
            params.push(filters.industry);
          }
          
          if (filters.riskLevel && filters.riskLevel.length > 0) {
            paramCount++;
            whereClause += ` AND risk_level = ANY($${paramCount})`;
            params.push(filters.riskLevel);
          }
          
          if (filters.registeredCapitalMin) {
            paramCount++;
            whereClause += ` AND registered_capital >= $${paramCount}`;
            params.push(filters.registeredCapitalMin);
          }
          
          if (filters.registeredCapitalMax) {
            paramCount++;
            whereClause += ` AND registered_capital <= $${paramCount}`;
            params.push(filters.registeredCapitalMax);
          }
          
          if (filters.establishDateStart) {
            paramCount++;
            whereClause += ` AND establish_date >= $${paramCount}`;
            params.push(filters.establishDateStart);
          }
          
          if (filters.establishDateEnd) {
            paramCount++;
            whereClause += ` AND establish_date <= $${paramCount}`;
            params.push(filters.establishDateEnd);
          }
        }
        
        // 验证排序字段
        const allowedSortFields = ['name', 'industry', 'registered_capital', 'establish_date', 'created_at'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        // 查询总数
        const countResult = await client.query(
          `SELECT COUNT(*) FROM enterprises ${whereClause}`,
          params
        );
        total = parseInt(countResult.rows[0].count);
        
        // 查询数据
        const enterpriseResult = await client.query(
          `SELECT * FROM enterprises ${whereClause} 
           ORDER BY ${safeSortBy} ${safeSortOrder}
           LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
          [...params, searchLimit, offset]
        );
        
        results = enterpriseResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          legalName: row.legal_name,
          creditCode: row.credit_code,
          registrationNumber: row.registration_number,
          industry: row.industry,
          establishDate: row.establish_date,
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
          updatedAt: new Date(row.updated_at),
          type: 'enterprise'
        }));
      }
      
      return res.status(200).json({
        success: true,
        data: {
          results,
          pagination: {
            page,
            limit: searchLimit,
            total,
            totalPages: Math.ceil(total / searchLimit)
          }
        },
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Advanced search error:', error);
    return res.status(500).json({
      success: false,
      message: '高级搜索失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 搜索历史记录
router.get('/history', authenticate, requirePermission('view_search'), async (req: Request, res: Response) => {
  try {
    // 这里可以实现搜索历史记录功能
    // 暂时返回空数组，后续可以添加搜索历史表
    return res.status(200).json({
      success: true,
      data: { history: [] },
      message: '搜索历史功能待实现',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get search history error:', error);
    return res.status(500).json({
      success: false,
      message: '获取搜索历史失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 热门搜索关键词
router.get('/popular', authenticate, requirePermission('view_search'), async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    
    try {
      // 获取热门行业
      const industryResult = await client.query(`
        SELECT industry, COUNT(*) as count
        FROM enterprises
        WHERE industry IS NOT NULL AND status = 'active'
        GROUP BY industry
        ORDER BY count DESC
        LIMIT 10
      `);
      
      // 获取热门企业（按网络影响评分）
      const enterpriseResult = await client.query(`
        SELECT name, nis
        FROM enterprises
        WHERE status = 'active' AND nis > 0
        ORDER BY nis DESC
        LIMIT 10
      `);
      
      return res.status(200).json({
        success: true,
        data: {
          popularIndustries: industryResult.rows.map(row => ({
            keyword: row.industry,
            count: parseInt(row.count)
          })),
          popularEnterprises: enterpriseResult.rows.map(row => ({
            keyword: row.name,
            score: parseFloat(row.nis)
          }))
        },
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Get popular searches error:', error);
    return res.status(500).json({
      success: false,
      message: '获取热门搜索失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;