import { Pool } from 'pg';
import pool from '../config/database';
import { Enterprise, Relationship } from '../types/database';

// 本地类型定义
export interface RiskFactor {
  id: string;
  category: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  description: string;
  identifiedAt: Date;
  status: 'active' | 'monitoring' | 'resolved' | 'false_positive';
}

export interface RiskWarning {
  id: string;
  enterpriseId: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  createdAt: Date;
  isRead: boolean;
}

type RelationshipType = Relationship['relationshipType'];

export interface RiskAssessment {
  enterpriseId: string;
  enterpriseName: string;
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  overallRiskScore: number;
  riskFactors: Array<{
    id: string;
    category: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    description: string;
    identifiedAt: Date;
    status: 'active' | 'monitoring' | 'resolved' | 'false_positive';
  }>;
  networkRisk: {
    propagationScore: number;
    influencedByCount: number;
    influencingCount: number;
    criticalPaths: number;
  };
  financialRisk: {
    score: number;
    indicators: Array<{
      name: string;
      value: number;
      threshold: number;
      status: 'normal' | 'warning' | 'critical';
    }>;
  };
  assessmentDate: Date;
  validUntil: Date;
}

export interface RiskWarningFilters {
  isRead?: boolean;
  severity?: 'info' | 'warning' | 'critical' | string;
  limit?: number;
  enterpriseId?: string;
}

class RiskAssessmentService {
  private client: Pool;

  constructor() {
    this.client = pool;
  }

  /**
   * 评估企业风险
   */
  async assessEnterpriseRisk(enterpriseId: string): Promise<RiskAssessment> {
    const client = await this.client.connect();
    
    try {
      // 获取企业基本信息
      const enterpriseResult = await client.query(
        'SELECT * FROM enterprises WHERE id = $1',
        [enterpriseId]
      );
      
      if (enterpriseResult.rows.length === 0) {
        throw new Error('企业不存在');
      }
      
      const enterprise: Enterprise = enterpriseResult.rows[0];
      
      // 获取企业的风险因子
      const riskFactorsResult = await client.query(`
        SELECT 
          rf.*,
          e.name as enterprise_name
        FROM risk_factors rf
        LEFT JOIN enterprises e ON rf.enterprise_id = e.id
        WHERE rf.enterprise_id = $1 
        AND rf.status IN ('active', 'monitoring')
        ORDER BY rf.severity DESC, rf.identified_at DESC
      `, [enterpriseId]);
      
      const riskFactors = riskFactorsResult.rows.map(row => ({
        id: row.id,
        category: row.category,
        type: row.type,
        severity: row.severity,
        score: this.calculateRiskFactorScore(row),
        description: row.description,
        identifiedAt: new Date(row.identified_at),
        status: row.status
      }));
      
      // 计算网络风险
      const networkRisk = await this.assessNetworkRisk(enterpriseId);
      
      // 计算财务风险
      const financialRisk = await this.assessFinancialRisk(enterpriseId);
      
      // 计算整体风险评分
      const overallRiskScore = this.calculateOverallRiskScore(riskFactors, networkRisk, financialRisk);
      
      // 确定风险等级
      const overallRiskLevel = this.determineRiskLevel(overallRiskScore);
      
      // 检查是否需要生成新的预警
      await this.checkAndGenerateWarnings(enterpriseId, enterprise.name, overallRiskLevel, riskFactors);
      
      const assessmentDate = new Date();
      const validUntil = new Date(assessmentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天有效期
      
      return {
        enterpriseId,
        enterpriseName: enterprise.name,
        overallRiskLevel,
        overallRiskScore,
        riskFactors,
        networkRisk,
        financialRisk,
        assessmentDate,
        validUntil
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * 批量评估企业风险
   */
  async batchAssessRisk(enterpriseIds: string[]): Promise<Map<string, RiskAssessment>> {
    const results = new Map<string, RiskAssessment>();
    
    // 并发处理，但限制并发数量
    const batchSize = 5;
    for (let i = 0; i < enterpriseIds.length; i += batchSize) {
      const batch = enterpriseIds.slice(i, i + batchSize);
      
      const promises = batch.map(async (enterpriseId) => {
        try {
          const assessment = await this.assessEnterpriseRisk(enterpriseId);
          return { enterpriseId, assessment };
        } catch (error) {
          console.error(`Failed to assess risk for enterprise ${enterpriseId}:`, error);
          return { enterpriseId, assessment: null };
        }
      });
      
      const batchResults = await Promise.all(promises);
      
      for (const { enterpriseId, assessment } of batchResults) {
        if (assessment) {
          results.set(enterpriseId, assessment);
        }
      }
    }
    
    return results;
  }

  /**
   * 获取风险预警列表
   */
  async getRiskWarnings(filters: RiskWarningFilters = {}): Promise<RiskWarning[]> {
    const client = await this.client.connect();
    
    try {
      let query = `
        SELECT 
          rw.*,
          e.name as enterprise_name,
          rf.type as risk_factor_type,
          rf.category as risk_factor_category
        FROM risk_warnings rw
        LEFT JOIN enterprises e ON rw.enterprise_id = e.id
        LEFT JOIN risk_factors rf ON rw.risk_factor_id = rf.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      if (filters.isRead !== undefined) {
        query += ` AND rw.is_read = $${paramIndex}`;
        params.push(filters.isRead);
        paramIndex++;
      }
      
      if (filters.severity && filters.severity !== 'all') {
        query += ` AND rw.severity = $${paramIndex}`;
        params.push(filters.severity);
        paramIndex++;
      }
      
      if (filters.enterpriseId) {
        query += ` AND rw.enterprise_id = $${paramIndex}`;
        params.push(filters.enterpriseId);
        paramIndex++;
      }
      
      query += ` ORDER BY rw.created_at DESC`;
      
      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
      }
      
      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        enterpriseId: row.enterprise_id,
        enterpriseName: row.enterprise_name || row.enterprise_name,
        warningType: row.warning_type,
        severity: row.severity,
        message: row.message,
        riskFactorId: row.risk_factor_id,
        createdAt: new Date(row.created_at),
        isRead: row.is_read,
        resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
        resolvedBy: row.resolved_by
      }));
      
    } finally {
      client.release();
    }
  }

  /**
   * 创建风险预警
   */
  async createRiskWarning(
    enterpriseId: string,
    warningType: 'new_risk' | 'risk_escalation' | 'guarantee_chain' | 'financial_anomaly',
    severity: 'info' | 'warning' | 'critical',
    message: string,
    riskFactorId?: string
  ): Promise<string> {
    const client = await this.client.connect();
    
    try {
      // 获取企业名称
      const enterpriseResult = await client.query(
        'SELECT name FROM enterprises WHERE id = $1',
        [enterpriseId]
      );
      
      if (enterpriseResult.rows.length === 0) {
        throw new Error('企业不存在');
      }
      
      const enterpriseName = enterpriseResult.rows[0].name;
      
      const result = await client.query(`
        INSERT INTO risk_warnings (
          enterprise_id, enterprise_name, warning_type, severity, message, risk_factor_id
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [enterpriseId, enterpriseName, warningType, severity, message, riskFactorId]);
      
      return result.rows[0].id;
      
    } finally {
      client.release();
    }
  }

  /**
   * 标记预警为已读
   */
  async markWarningAsRead(warningId: string): Promise<void> {
    const client = await this.client.connect();
    
    try {
      await client.query(
        'UPDATE risk_warnings SET is_read = true WHERE id = $1',
        [warningId]
      );
    } finally {
      client.release();
    }
  }

  /**
   * 评估网络风险
   */
  private async assessNetworkRisk(enterpriseId: string): Promise<RiskAssessment['networkRisk']> {
    const client = await this.client.connect();
    
    try {
      // 获取企业的关系网络
      const relationshipsResult = await client.query(`
        SELECT 
          relationship_type,
          strength,
          COUNT(*) as count
        FROM enterprise_relationships 
        WHERE from_enterprise_id = $1 OR to_enterprise_id = $1
        GROUP BY relationship_type, strength
      `, [enterpriseId]);
      
      // 计算网络风险传播分数
      let propagationScore = 0;
      let influencedByCount = 0;
      let influencingCount = 0;
      
      for (const row of relationshipsResult.rows) {
        const weight = this.getRelationshipWeight(row.relationship_type, row.strength);
        const count = parseInt(row.count);
        
        propagationScore += weight * count;
        
        if (['supplier', 'guarantor'].includes(row.relationship_type)) {
          influencedByCount += count;
        } else {
          influencingCount += count;
        }
      }
      
      // 计算关键路径数量（简化版本）
      const criticalPaths = Math.min(influencedByCount * influencingCount / 10, 20);
      
      return {
        propagationScore: Math.min(propagationScore, 100),
        influencedByCount,
        influencingCount,
        criticalPaths
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * 评估财务风险
   */
  private async assessFinancialRisk(enterpriseId: string): Promise<RiskAssessment['financialRisk']> {
    const client = await this.client.connect();
    
    try {
      // 获取企业财务数据
      const financialResult = await client.query(`
        SELECT * FROM financial_data 
        WHERE enterprise_id = $1 
        ORDER BY year DESC 
        LIMIT 3
      `, [enterpriseId]);
      
      const indicators: Array<{
        name: string;
        value: number;
        threshold: number;
        status: 'normal' | 'warning' | 'critical';
      }> = [];
      let totalScore = 0;
      
      if (financialResult.rows.length > 0) {
        const latestData = financialResult.rows[0];
        
        // 资产负债率
        const debtRatio = (latestData.total_debt / latestData.total_assets) * 100;
        indicators.push({
          name: '资产负债率',
          value: debtRatio,
          threshold: 70,
          status: debtRatio > 80 ? 'critical' : debtRatio > 70 ? 'warning' : 'normal'
        });
        
        // 流动比率
        const currentRatio = latestData.current_assets / latestData.current_liabilities;
        indicators.push({
          name: '流动比率',
          value: currentRatio,
          threshold: 1.2,
          status: currentRatio < 1 ? 'critical' : currentRatio < 1.2 ? 'warning' : 'normal'
        });
        
        // 净利润率
        const profitMargin = (latestData.net_profit / latestData.revenue) * 100;
        indicators.push({
          name: '净利润率',
          value: profitMargin,
          threshold: 5,
          status: profitMargin < 0 ? 'critical' : profitMargin < 5 ? 'warning' : 'normal'
        });
        
        // 计算财务风险分数
        totalScore = indicators.reduce((sum, indicator) => {
          if (indicator.status === 'critical') return sum + 30;
          if (indicator.status === 'warning') return sum + 15;
          return sum + 5;
        }, 0);
      } else {
        // 没有财务数据也是一种风险
        totalScore = 20;
        indicators.push({
          name: '数据缺失',
          value: 0,
          threshold: 1,
          status: 'warning'
        });
      }
      
      return {
        score: Math.min(totalScore, 100),
        indicators
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * 计算单个风险因子的分数
   */
  private calculateRiskFactorScore(riskFactor: any): number {
    const severityScores = {
      'low': 10,
      'medium': 25,
      'high': 50,
      'critical': 80
    };
    
    const categoryMultipliers = {
      'financial': 1.2,
      'legal': 1.1,
      'operational': 1.0,
      'market': 0.9,
      'reputation': 0.8
    };
    
    const baseScore = severityScores[riskFactor.severity as keyof typeof severityScores] || 0;
    const multiplier = categoryMultipliers[riskFactor.category as keyof typeof categoryMultipliers] || 1.0;
    
    return Math.round(baseScore * multiplier);
  }

  /**
   * 计算整体风险评分
   */
  private calculateOverallRiskScore(
    riskFactors: RiskAssessment['riskFactors'],
    networkRisk: RiskAssessment['networkRisk'],
    financialRisk: RiskAssessment['financialRisk']
  ): number {
    // 风险因子权重40%
    const riskFactorScore = riskFactors.reduce((sum, factor) => sum + factor.score, 0) * 0.4;
    
    // 网络风险权重30%
    const networkScore = networkRisk.propagationScore * 0.3;
    
    // 财务风险权重30%
    const financeScore = financialRisk.score * 0.3;
    
    return Math.min(Math.round(riskFactorScore + networkScore + financeScore), 100);
  }

  /**
   * 确定风险等级
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * 获取关系类型权重
   */
  private getRelationshipWeight(type: string, strength: number): number {
    const typeWeights = {
      'supplier': 1.2,
      'customer': 1.0,
      'partner': 0.8,
      'investor': 1.5,
      'guarantor': 2.0,
      'subsidiary': 1.8,
      'competitor': 0.5
    };
    
    const baseWeight = typeWeights[type as keyof typeof typeWeights] || 1.0;
    return baseWeight * strength;
  }

  /**
   * 检查并生成预警
   */
  private async checkAndGenerateWarnings(
    enterpriseId: string,
    enterpriseName: string,
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    riskFactors: RiskAssessment['riskFactors']
  ): Promise<void> {
    // 如果风险等级为高或严重，生成风险升级预警
    if (riskLevel === 'high' || riskLevel === 'critical') {
      const severity = riskLevel === 'critical' ? 'critical' : 'warning';
      const message = `企业风险等级已${riskLevel === 'critical' ? '升至严重' : '提升至高风险'}，建议立即关注`;
      
      try {
        await this.createRiskWarning(
          enterpriseId,
          'risk_escalation',
          severity,
          message
        );
      } catch (error) {
        console.error('Failed to create risk warning:', error);
      }
    }
    
    // 检查新的严重风险因子
    const criticalFactors = riskFactors.filter(factor => factor.severity === 'critical');
    if (criticalFactors.length > 0) {
      const firstCriticalFactor = criticalFactors[0];
      if (firstCriticalFactor) {
        const message = `发现${criticalFactors.length}个严重风险因子，需要紧急处理`;
        
        try {
          await this.createRiskWarning(
            enterpriseId,
            'new_risk',
            'critical',
            message,
            firstCriticalFactor.id
          );
        } catch (error) {
          console.error('Failed to create critical risk warning:', error);
        }
      }
    }
  }
}

export default new RiskAssessmentService(); 