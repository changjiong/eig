import pool from '../config/database';
import { PoolClient } from 'pg';

/**
 * 企业评分服务
 * 实现四个核心评分算法：SVS、DES、NIS、PCS
 */

export interface ScoringMetrics {
  svs: number; // 供应商价值评分 (Supplier Value Score)
  des: number; // 需求匹配评分 (Demand Engagement Score) 
  nis: number; // 网络影响力评分 (Network Influence Score)
  pcs: number; // 潜客转化评分 (Prospect Conversion Score)
}

export class ScoringService {
  
  /**
   * 计算企业综合评分
   * @param enterpriseId 企业ID
   * @returns 四个维度评分
   */
  static async calculateEnterpriseScore(enterpriseId: string): Promise<ScoringMetrics> {
    const client = await pool.connect();
    
    try {
      // 并行计算四个评分
      const [svsScore, desScore, nisScore, pcsScore] = await Promise.all([
        this.calculateSVS(client, enterpriseId),
        this.calculateDES(client, enterpriseId),
        this.calculateNIS(client, enterpriseId),
        this.calculatePCS(client, enterpriseId)
      ]);

      return {
        svs: Math.round(svsScore * 100) / 100, // 保留2位小数
        des: Math.round(desScore * 100) / 100,
        nis: Math.round(nisScore * 100) / 100,
        pcs: Math.round(pcsScore * 100) / 100
      };
    } finally {
      client.release();
    }
  }

  /**
   * SVS - 供应商价值评分算法
   * 基于财务健康度、公司规模、风险等级、行业地位
   */
  private static async calculateSVS(client: PoolClient, enterpriseId: string): Promise<number> {
    // 获取企业基础信息
    const enterpriseResult = await client.query(`
      SELECT registered_capital, establish_date, status, risk_level, industry,
             supplier_count, customer_count, partner_count
      FROM enterprises 
      WHERE id = $1
    `, [enterpriseId]);

    if (enterpriseResult.rows.length === 0) {
      return 0;
    }

    const enterprise = enterpriseResult.rows[0];
    let score = 0;

    // 1. 财务健康度评分 (30%)
    const financialScore = await this.calculateFinancialHealth(client, enterpriseId, enterprise);
    score += financialScore * 0.3;

    // 2. 公司规模评分 (25%)
    const scaleScore = this.calculateCompanyScale(enterprise);
    score += scaleScore * 0.25;

    // 3. 风险等级评分 (25%)
    const riskScore = this.calculateRiskScore(enterprise.risk_level);
    score += riskScore * 0.25;

    // 4. 网络连接度评分 (20%)
    const networkScore = this.calculateNetworkConnectivity(enterprise);
    score += networkScore * 0.2;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * DES - 需求匹配评分算法
   * 基于客户关系质量、业务互动频率、合作深度、依赖程度
   */
  private static async calculateDES(client: PoolClient, enterpriseId: string): Promise<number> {
    let score = 0;

    // 1. 客户关系质量评分 (35%)
    const clientQualityScore = await this.calculateClientQuality(client, enterpriseId);
    score += clientQualityScore * 0.35;

    // 2. 业务互动频率评分 (30%)
    const interactionScore = await this.calculateInteractionFrequency(client, enterpriseId);
    score += interactionScore * 0.3;

    // 3. 合作深度评分 (20%)
    const cooperationScore = await this.calculateCooperationDepth(client, enterpriseId);
    score += cooperationScore * 0.2;

    // 4. 市场活跃度评分 (15%)
    const marketActivityScore = await this.calculateMarketActivity(client, enterpriseId);
    score += marketActivityScore * 0.15;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * NIS - 网络影响力评分算法
   * 基于供应链影响力、投资网络、担保网络、行业关联度
   */
  private static async calculateNIS(client: PoolClient, enterpriseId: string): Promise<number> {
    let score = 0;

    // 1. 供应链影响力评分 (30%)
    const supplyChainScore = await this.calculateSupplyChainInfluence(client, enterpriseId);
    score += supplyChainScore * 0.3;

    // 2. 投资网络影响力评分 (25%)
    const investmentNetworkScore = await this.calculateInvestmentNetworkInfluence(client, enterpriseId);
    score += investmentNetworkScore * 0.25;

    // 3. 担保网络影响力评分 (25%)
    const guaranteeNetworkScore = await this.calculateGuaranteeNetworkInfluence(client, enterpriseId);
    score += guaranteeNetworkScore * 0.25;

    // 4. 行业关联度评分 (20%)
    const industryConnectivityScore = await this.calculateIndustryConnectivity(client, enterpriseId);
    score += industryConnectivityScore * 0.2;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * PCS - 潜客转化评分算法
   * 基于转化历史、沟通质量、需求匹配度、决策周期
   */
  private static async calculatePCS(client: PoolClient, enterpriseId: string): Promise<number> {
    let score = 0;

    // 1. 历史转化表现评分 (40%)
    const conversionHistoryScore = await this.calculateConversionHistory(client, enterpriseId);
    score += conversionHistoryScore * 0.4;

    // 2. 沟通互动质量评分 (30%)
    const communicationScore = await this.calculateCommunicationQuality(client, enterpriseId);
    score += communicationScore * 0.3;

    // 3. 需求匹配度评分 (20%)
    const demandMatchScore = await this.calculateDemandMatch(client, enterpriseId);
    score += demandMatchScore * 0.2;

    // 4. 决策能力评分 (10%)
    const decisionCapabilityScore = await this.calculateDecisionCapability(client, enterpriseId);
    score += decisionCapabilityScore * 0.1;

    return Math.min(100, Math.max(0, score));
  }

  // ==================== 辅助计算方法 ====================

  /**
   * 计算财务健康度
   */
  private static async calculateFinancialHealth(
    client: PoolClient, 
    enterpriseId: string, 
    enterprise: any
  ): Promise<number> {
    // 获取最新财务数据
    const financialResult = await client.query(`
      SELECT revenue, profit, total_assets, total_liabilities, debt_ratio, roe, roa
      FROM financial_data 
      WHERE enterprise_id = $1 
      ORDER BY year DESC, quarter DESC NULLS LAST 
      LIMIT 1
    `, [enterpriseId]);

    let score = 50; // 基础分数

    if (financialResult.rows.length > 0) {
      const financial = financialResult.rows[0];
      
      // ROE评分
      if (financial.roe > 0.15) score += 20;
      else if (financial.roe > 0.08) score += 10;
      else if (financial.roe < 0) score -= 20;

      // 资产负债率评分
      if (financial.debt_ratio < 0.4) score += 15;
      else if (financial.debt_ratio < 0.6) score += 5;
      else if (financial.debt_ratio > 0.8) score -= 15;

      // 盈利能力评分
      if (financial.profit > 0) score += 15;
      else if (financial.profit < 0) score -= 20;
    }

    // 注册资本评分
    if (enterprise.registered_capital) {
      if (enterprise.registered_capital >= 100000000) score += 10; // 1亿以上
      else if (enterprise.registered_capital >= 10000000) score += 5; // 1千万以上
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 计算公司规模评分
   */
  private static calculateCompanyScale(enterprise: any): number {
    let score = 40;

    // 注册资本评分
    if (enterprise.registered_capital) {
      const capital = enterprise.registered_capital;
      if (capital >= 500000000) score += 30; // 5亿以上
      else if (capital >= 100000000) score += 25; // 1亿以上
      else if (capital >= 50000000) score += 20; // 5千万以上
      else if (capital >= 10000000) score += 15; // 1千万以上
      else if (capital >= 1000000) score += 10; // 100万以上
    }

    // 成立时间评分（公司历史）
    if (enterprise.establish_date) {
      const yearsInBusiness = (new Date().getFullYear() - new Date(enterprise.establish_date).getFullYear());
      if (yearsInBusiness >= 10) score += 15;
      else if (yearsInBusiness >= 5) score += 10;
      else if (yearsInBusiness >= 2) score += 5;
    }

    // 连接数评分
    const totalConnections = (enterprise.supplier_count || 0) + 
                           (enterprise.customer_count || 0) + 
                           (enterprise.partner_count || 0);
    if (totalConnections >= 100) score += 15;
    else if (totalConnections >= 50) score += 10;
    else if (totalConnections >= 20) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 计算风险评分
   */
  private static calculateRiskScore(riskLevel: string): number {
    switch (riskLevel) {
      case 'low': return 90;
      case 'medium': return 60;
      case 'high': return 30;
      default: return 50;
    }
  }

  /**
   * 计算网络连接度评分
   */
  private static calculateNetworkConnectivity(enterprise: any): number {
    const supplierCount = enterprise.supplier_count || 0;
    const customerCount = enterprise.customer_count || 0;
    const partnerCount = enterprise.partner_count || 0;

    let score = 20; // 基础分

    // 供应商网络评分
    if (supplierCount >= 50) score += 25;
    else if (supplierCount >= 20) score += 15;
    else if (supplierCount >= 5) score += 10;

    // 客户网络评分
    if (customerCount >= 100) score += 25;
    else if (customerCount >= 50) score += 15;
    else if (customerCount >= 10) score += 10;

    // 合作伙伴网络评分
    if (partnerCount >= 20) score += 30;
    else if (partnerCount >= 10) score += 20;
    else if (partnerCount >= 5) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 计算客户关系质量
   */
  private static async calculateClientQuality(client: PoolClient, enterpriseId: string): Promise<number> {
    const clientResult = await client.query(`
      SELECT COUNT(*) as total_clients,
             AVG(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_ratio,
             AVG(estimated_value) as avg_value
      FROM clients 
      WHERE id IN (
        SELECT to_id FROM relationships 
        WHERE from_id = $1 AND relationship_type = 'supply'
      )
    `, [enterpriseId]);

    if (clientResult.rows.length === 0) {
      return 30; // 无客户数据，给基础分
    }

    const { total_clients, active_ratio, avg_value } = clientResult.rows[0];
    let score = 20;

    // 客户数量评分
    if (total_clients >= 50) score += 30;
    else if (total_clients >= 20) score += 20;
    else if (total_clients >= 5) score += 10;

    // 活跃客户比例评分
    if (active_ratio >= 0.8) score += 25;
    else if (active_ratio >= 0.6) score += 15;
    else if (active_ratio >= 0.4) score += 10;

    // 客户价值评分
    if (avg_value >= 1000000) score += 25; // 平均价值100万以上
    else if (avg_value >= 500000) score += 15;
    else if (avg_value >= 100000) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 计算互动频率评分
   */
  private static async calculateInteractionFrequency(client: PoolClient, enterpriseId: string): Promise<number> {
    // 获取最近3个月的任务和事件数据
    const taskResult = await client.query(`
      SELECT COUNT(*) as task_count
      FROM tasks 
      WHERE entity_id = $1 
        AND created_at >= NOW() - INTERVAL '3 months'
    `, [enterpriseId]);

    const eventResult = await client.query(`
      SELECT COUNT(*) as event_count
      FROM events 
      WHERE enterprise_id = $1 
        AND event_date >= NOW() - INTERVAL '3 months'
    `, [enterpriseId]);

    const taskCount = parseInt(taskResult.rows[0]?.task_count || '0');
    const eventCount = parseInt(eventResult.rows[0]?.event_count || '0');
    
    let score = 20; // 基础分

    // 任务活跃度评分
    if (taskCount >= 20) score += 40;
    else if (taskCount >= 10) score += 30;
    else if (taskCount >= 5) score += 20;
    else if (taskCount >= 1) score += 10;

    // 事件活跃度评分
    if (eventCount >= 10) score += 40;
    else if (eventCount >= 5) score += 30;
    else if (eventCount >= 3) score += 20;
    else if (eventCount >= 1) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 其他辅助方法的占位符实现
   * 实际项目中应根据具体业务需求完善这些算法
   */
  private static async calculateCooperationDepth(client: PoolClient, enterpriseId: string): Promise<number> {
    // 基于关系强度和合作类型计算合作深度
    const result = await client.query(`
      SELECT AVG(strength) as avg_strength, COUNT(*) as relationship_count
      FROM relationships 
      WHERE from_id = $1 OR to_id = $1
    `, [enterpriseId]);

    const { avg_strength, relationship_count } = result.rows[0] || {};
    
    let score = (parseFloat(avg_strength || '0.5') * 80); // 基于关系强度
    if (relationship_count >= 20) score += 20;
    else if (relationship_count >= 10) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private static async calculateMarketActivity(client: PoolClient, enterpriseId: string): Promise<number> {
    // 基于新闻资讯和市场活动计算市场活跃度
    const newsResult = await client.query(`
      SELECT COUNT(*) as news_count,
             AVG(CASE WHEN sentiment = 'positive' THEN 1 
                     WHEN sentiment = 'neutral' THEN 0.5 
                     ELSE 0 END) as sentiment_score
      FROM news 
      WHERE enterprise_id = $1 
        AND published_at >= NOW() - INTERVAL '6 months'
    `, [enterpriseId]);

    const { news_count, sentiment_score } = newsResult.rows[0] || {};
    
    let score = 30; // 基础分
    
    // 新闻数量评分
    if (news_count >= 20) score += 35;
    else if (news_count >= 10) score += 25;
    else if (news_count >= 5) score += 15;

    // 情感评分
    score += (parseFloat(sentiment_score || '0.5') * 35);

    return Math.min(100, Math.max(0, score));
  }

  // 其他NIS和PCS相关的辅助方法
  private static async calculateSupplyChainInfluence(client: PoolClient, enterpriseId: string): Promise<number> {
    const result = await client.query(`
      SELECT COUNT(*) as supply_relationships
      FROM relationships 
      WHERE (from_id = $1 OR to_id = $1) 
        AND relationship_type IN ('supply', 'partnership')
    `, [enterpriseId]);

    const count = parseInt(result.rows[0]?.supply_relationships || '0');
    return Math.min(100, 20 + (count * 2)); // 基础分20，每个供应链关系加2分
  }

  private static async calculateInvestmentNetworkInfluence(client: PoolClient, enterpriseId: string): Promise<number> {
    const result = await client.query(`
      SELECT COUNT(*) as investment_relationships, AVG(strength) as avg_strength
      FROM relationships 
      WHERE (from_id = $1 OR to_id = $1) 
        AND relationship_type = 'investment'
    `, [enterpriseId]);

    const { investment_relationships, avg_strength } = result.rows[0] || {};
    const count = parseInt(investment_relationships || '0');
    const strength = parseFloat(avg_strength || '0.5');
    
    return Math.min(100, 10 + (count * 15) + (strength * 50));
  }

  private static async calculateGuaranteeNetworkInfluence(client: PoolClient, enterpriseId: string): Promise<number> {
    const result = await client.query(`
      SELECT COUNT(*) as guarantee_relationships
      FROM relationships 
      WHERE (from_id = $1 OR to_id = $1) 
        AND relationship_type = 'guarantee'
    `, [enterpriseId]);

    const count = parseInt(result.rows[0]?.guarantee_relationships || '0');
    return Math.min(100, 15 + (count * 5)); // 基础分15，每个担保关系加5分
  }

  private static async calculateIndustryConnectivity(client: PoolClient, enterpriseId: string): Promise<number> {
    // 获取同行业企业连接数
    const result = await client.query(`
      SELECT COUNT(DISTINCT r.to_id) as same_industry_connections
      FROM relationships r
      JOIN enterprises e1 ON r.from_id = e1.id
      JOIN enterprises e2 ON r.to_id = e2.id
      WHERE r.from_id = $1 
        AND e1.industry = e2.industry
    `, [enterpriseId]);

    const count = parseInt(result.rows[0]?.same_industry_connections || '0');
    return Math.min(100, 30 + (count * 3)); // 基础分30，每个同行业连接加3分
  }

  private static async calculateConversionHistory(client: PoolClient, enterpriseId: string): Promise<number> {
    // 基于潜客表中该企业的转化情况
    const result = await client.query(`
      SELECT status, COUNT(*) as count
      FROM prospects 
      WHERE seed_enterprise_id = $1 
      GROUP BY status
    `, [enterpriseId]);

    let totalProspects = 0;
    let convertedProspects = 0;

    result.rows.forEach(row => {
      totalProspects += parseInt(row.count);
      if (row.status === 'converted') {
        convertedProspects += parseInt(row.count);
      }
    });

    if (totalProspects === 0) return 40; // 无历史数据，给基础分

    const conversionRate = convertedProspects / totalProspects;
    return Math.min(100, 20 + (conversionRate * 80)); // 转化率越高分数越高
  }

  private static async calculateCommunicationQuality(client: PoolClient, enterpriseId: string): Promise<number> {
    // 基于任务完成情况和事件重要性评估沟通质量
    const taskResult = await client.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks
      FROM tasks 
      WHERE entity_id = $1
    `, [enterpriseId]);

    const { total_tasks, completed_tasks } = taskResult.rows[0] || {};
    
    if (total_tasks === 0) return 50; // 无沟通数据，给中等分

    const completionRate = parseInt(completed_tasks) / parseInt(total_tasks);
    return Math.min(100, 30 + (completionRate * 70)); // 任务完成率代表沟通质量
  }

  private static async calculateDemandMatch(client: PoolClient, enterpriseId: string): Promise<number> {
    // 基于企业业务范围和客户需求的匹配度
    const enterpriseResult = await client.query(`
      SELECT business_scope, industry 
      FROM enterprises 
      WHERE id = $1
    `, [enterpriseId]);

    if (enterpriseResult.rows.length === 0) return 40;

    // 简化版本：基于业务范围文本长度和行业匹配度
    const { business_scope, industry } = enterpriseResult.rows[0];
    
    let score = 40; // 基础分
    
    // 业务范围完整性评分
    if (business_scope && business_scope.length > 200) score += 30;
    else if (business_scope && business_scope.length > 100) score += 20;
    else if (business_scope && business_scope.length > 50) score += 10;

    // 行业清晰度评分
    if (industry && industry.length > 0) score += 30;

    return Math.min(100, Math.max(0, score));
  }

  private static async calculateDecisionCapability(client: PoolClient, enterpriseId: string): Promise<number> {
    // 基于企业规模和决策响应速度评估决策能力
    const result = await client.query(`
      SELECT registered_capital, establish_date
      FROM enterprises 
      WHERE id = $1
    `, [enterpriseId]);

    if (result.rows.length === 0) return 50;

    const { registered_capital, establish_date } = result.rows[0];
    
    let score = 30; // 基础分

    // 注册资本越大，决策能力越强（资金实力）
    if (registered_capital >= 100000000) score += 40; // 1亿以上
    else if (registered_capital >= 10000000) score += 30; // 1千万以上
    else if (registered_capital >= 1000000) score += 20; // 100万以上

    // 成立时间越长，决策经验越丰富
    if (establish_date) {
      const years = new Date().getFullYear() - new Date(establish_date).getFullYear();
      if (years >= 10) score += 30;
      else if (years >= 5) score += 20;
      else if (years >= 2) score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }
}

export default ScoringService; 