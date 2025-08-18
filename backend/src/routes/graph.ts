import express from 'express';
import { Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requirePermission } from '../middleware/auth';
import { GraphData, GraphNode, GraphLink, ApiResponse } from '../types/database';

const router = express.Router();

// 获取基础图谱数据
router.get('/', authenticate, requirePermission('view_graph'), async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const nodeType = req.query.nodeType as string;
    
    const client = await pool.connect();
    
    try {
      let nodes: GraphNode[] = [];
      
      if (!nodeType || nodeType === 'enterprise') {
        const enterpriseResult = await client.query(`
          SELECT id, name, industry, risk_level 
          FROM enterprises 
          WHERE status = 'active'
          LIMIT $1
        `, [limit]);
        
        const enterpriseNodes: GraphNode[] = enterpriseResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          type: 'enterprise' as const,
          value: Math.random() * 100 + 10,
          industry: row.industry,
          riskLevel: row.risk_level
        }));
        
        nodes = [...nodes, ...enterpriseNodes];
      }
      
      // 获取关系数据
      const relationshipResult = await client.query(`
        SELECT r.*, 
               e1.name as from_name, e2.name as to_name
        FROM relationships r
        LEFT JOIN enterprises e1 ON r.from_id = e1.id AND r.from_type = 'enterprise'
        LEFT JOIN enterprises e2 ON r.to_id = e2.id AND r.to_type = 'enterprise'
        WHERE r.from_type = 'enterprise' AND r.to_type = 'enterprise'
        LIMIT $1
      `, [limit]);
      
      const links: GraphLink[] = relationshipResult.rows.map(row => ({
        source: row.from_id,
        target: row.to_id,
        type: row.relationship_type,
        value: row.strength * 100,
        strength: row.strength
      }));
      
      const graphData: GraphData = {
        nodes,
        links
      };
      
      const response: ApiResponse<GraphData> = {
        success: true,
        data: graphData,
        timestamp: new Date().toISOString()
      };
      
      return res.status(200).json(response);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Get graph data error:', error);
    return res.status(500).json({
      success: false,
      message: '获取图谱数据失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取企业关系图谱
router.get('/enterprise/:id', authenticate, requirePermission('view_graph'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const depth = parseInt(req.query.depth as string) || 1;
    
    const client = await pool.connect();
    
    try {
      // 检查企业是否存在
      const enterpriseResult = await client.query(
        'SELECT id, name, industry, risk_level FROM enterprises WHERE id = $1',
        [id]
      );
      
      if (enterpriseResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '企业不存在',
          timestamp: new Date().toISOString()
        });
      }
      
      const centerNode = enterpriseResult.rows[0];
      const nodes: GraphNode[] = [{
        id: centerNode.id,
        name: centerNode.name,
        type: 'enterprise',
        value: 50,
        industry: centerNode.industry,
        riskLevel: centerNode.risk_level
      }];
      
      const nodeIds = new Set([id]);
      const links: GraphLink[] = [];
      
      // 递归获取关系数据
      for (let currentDepth = 0; currentDepth < depth; currentDepth++) {
        const currentNodes = Array.from(nodeIds);
        
        const relationshipResult = await client.query(`
          SELECT r.*, 
                 e1.name as from_name, e1.industry as from_industry, e1.risk_level as from_risk,
                 e2.name as to_name, e2.industry as to_industry, e2.risk_level as to_risk
          FROM relationships r
          LEFT JOIN enterprises e1 ON r.from_id = e1.id AND r.from_type = 'enterprise'
          LEFT JOIN enterprises e2 ON r.to_id = e2.id AND r.to_type = 'enterprise'
          WHERE (r.from_id = ANY($1) OR r.to_id = ANY($1))
            AND r.from_type = 'enterprise' AND r.to_type = 'enterprise'
        `, [currentNodes]);
        
        for (const row of relationshipResult.rows) {
          // 添加关系
          links.push({
            source: row.from_id,
            target: row.to_id,
            type: row.relationship_type,
            value: row.strength * 100,
            strength: row.strength
          });
          
          // 添加新节点
          if (!nodeIds.has(row.from_id)) {
            nodeIds.add(row.from_id);
            nodes.push({
              id: row.from_id,
              name: row.from_name,
              type: 'enterprise',
              value: Math.random() * 40 + 10,
              industry: row.from_industry,
              riskLevel: row.from_risk
            });
          }
          
          if (!nodeIds.has(row.to_id)) {
            nodeIds.add(row.to_id);
            nodes.push({
              id: row.to_id,
              name: row.to_name,
              type: 'enterprise',
              value: Math.random() * 40 + 10,
              industry: row.to_industry,
              riskLevel: row.to_risk
            });
          }
        }
      }
      
      const graphData: GraphData = {
        nodes,
        links
      };
      
      const response: ApiResponse<GraphData> = {
        success: true,
        data: graphData,
        timestamp: new Date().toISOString()
      };
      
      return res.status(200).json(response);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Get enterprise graph error:', error);
    return res.status(500).json({
      success: false,
      message: '获取企业关系图谱失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取两个实体间的最短路径
router.get('/path', authenticate, requirePermission('view_graph'), async (req: Request, res: Response) => {
  try {
    const { fromId, toId } = req.query;
    
    if (!fromId || !toId) {
      return res.status(400).json({
        success: false,
        message: '缺少fromId或toId参数',
        timestamp: new Date().toISOString()
      });
    }
    
    const client = await pool.connect();
    
    try {
      // 这里实现简单的路径查找算法
      // 实际应用中可能需要更复杂的图算法
      const relationshipResult = await client.query(`
        WITH RECURSIVE path_search AS (
          -- 基础情况：直接连接
          SELECT from_id, to_id, relationship_type, strength, 
                 ARRAY[from_id, to_id] as path, 1 as depth
          FROM relationships
          WHERE from_id = $1 OR to_id = $1
          
          UNION ALL
          
          -- 递归情况：扩展路径
          SELECT r.from_id, r.to_id, r.relationship_type, r.strength,
                 ps.path || r.to_id, ps.depth + 1
          FROM relationships r
          JOIN path_search ps ON (r.from_id = ps.to_id)
          WHERE ps.depth < 3 AND NOT (r.to_id = ANY(ps.path))
        )
        SELECT * FROM path_search
        WHERE $2 = ANY(path)
        ORDER BY depth
        LIMIT 10
      `, [fromId, toId]);
      
      const paths = relationshipResult.rows.map(row => ({
        path: row.path,
        depth: row.depth,
        relationships: [{
          type: row.relationship_type,
          strength: row.strength
        }]
      }));
      
      return res.status(200).json({
        success: true,
        data: { paths },
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Get path error:', error);
    return res.status(500).json({
      success: false,
      message: '获取关系路径失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;