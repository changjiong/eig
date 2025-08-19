const { Pool } = require('pg');
const path = require('path');

// 数据库配置
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'eig_db'
});

async function generateRiskData() {
  const client = await pool.connect();
  
  try {
    console.log('开始生成风险评估测试数据...');
    
    // 获取现有企业IDs
    const enterpriseResult = await client.query('SELECT id FROM enterprises ORDER BY created_at LIMIT 50');
    const enterpriseIds = enterpriseResult.rows.map(row => row.id);
    
    if (enterpriseIds.length === 0) {
      console.log('没有找到企业数据，请先生成企业测试数据');
      return;
    }
    
    console.log(`找到${enterpriseIds.length}个企业，开始生成风险因子...`);
    
    // 风险因子类型和类别
    const riskCategories = ['financial', 'legal', 'operational', 'market', 'reputation'];
    const riskTypes = [
      'debt_default', 'cash_flow_shortage', 'asset_quality_decline',
      'lawsuit_pending', 'regulatory_violation', 'compliance_issue',
      'supply_chain_disruption', 'production_capacity_decline', 'quality_issue',
      'market_demand_decline', 'competition_intensify', 'price_volatility',
      'negative_media', 'customer_complaint', 'public_relations_crisis'
    ];
    const severities = ['low', 'medium', 'high', 'critical'];
    const statuses = ['active', 'monitoring', 'resolved', 'false_positive'];
    
    // 生成风险因子
    for (let i = 0; i < Math.min(enterpriseIds.length * 2, 200); i++) {
      const enterpriseId = enterpriseIds[Math.floor(Math.random() * enterpriseIds.length)];
      const category = riskCategories[Math.floor(Math.random() * riskCategories.length)];
      const type = riskTypes[Math.floor(Math.random() * riskTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const description = generateRiskDescription(category, type, severity);
      const identifiedAt = new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000);
      const impact = Math.floor(Math.random() * 100);
      const probability = Math.random();
      
      await client.query(`
        INSERT INTO risk_factors (
          enterprise_id, category, type, severity, description,
          impact, probability, status, identified_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [enterpriseId, category, type, severity, description, impact, probability, status, identifiedAt]);
      
      if ((i + 1) % 20 === 0) {
        console.log(`已生成${i + 1}个风险因子...`);
      }
    }
    
    console.log('风险因子生成完成，开始生成风险预警...');
    
    // 生成风险预警
    const warningTypes = ['new_risk', 'risk_escalation', 'guarantee_chain', 'financial_anomaly'];
    const warningSeverities = ['info', 'warning', 'critical'];
    
    // 获取企业名称
    const enterpriseNamesResult = await client.query('SELECT id, name FROM enterprises ORDER BY created_at LIMIT 50');
    const enterpriseMap = new Map(enterpriseNamesResult.rows.map(row => [row.id, row.name]));
    
    for (let i = 0; i < Math.min(enterpriseIds.length, 100); i++) {
      const enterpriseId = enterpriseIds[Math.floor(Math.random() * enterpriseIds.length)];
      const enterpriseName = enterpriseMap.get(enterpriseId) || '未知企业';
      const warningType = warningTypes[Math.floor(Math.random() * warningTypes.length)];
      const severity = warningSeverities[Math.floor(Math.random() * warningSeverities.length)];
      const isRead = Math.random() > 0.3; // 70%已读
      
      const message = generateWarningMessage(warningType, severity, enterpriseName);
      const createdAt = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
      
      await client.query(`
        INSERT INTO risk_warnings (
          enterprise_id, enterprise_name, warning_type, severity, message, is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [enterpriseId, enterpriseName, warningType, severity, message, isRead, createdAt]);
      
      if ((i + 1) % 10 === 0) {
        console.log(`已生成${i + 1}个风险预警...`);
      }
    }
    
    console.log('风险评估测试数据生成完成！');
    
    // 统计信息
    const riskFactorCount = await client.query('SELECT COUNT(*) FROM risk_factors');
    const riskWarningCount = await client.query('SELECT COUNT(*) FROM risk_warnings');
    
    console.log(`\n生成统计:`);
    console.log(`- 风险因子: ${riskFactorCount.rows[0].count} 条`);
    console.log(`- 风险预警: ${riskWarningCount.rows[0].count} 条`);
    
  } catch (error) {
    console.error('生成风险数据时出错:', error);
    throw error;
  } finally {
    client.release();
  }
}

function generateRiskDescription(category, type, severity) {
  const descriptions = {
    financial: {
      debt_default: '企业存在债务违约风险',
      cash_flow_shortage: '现金流出现短缺问题',
      asset_quality_decline: '资产质量出现下降趋势'
    },
    legal: {
      lawsuit_pending: '涉及重大法律诉讼案件',
      regulatory_violation: '违反相关监管规定',
      compliance_issue: '合规管理存在漏洞'
    },
    operational: {
      supply_chain_disruption: '供应链出现严重中断',
      production_capacity_decline: '生产能力明显下降',
      quality_issue: '产品质量问题频发'
    },
    market: {
      market_demand_decline: '市场需求大幅下降',
      competition_intensify: '市场竞争加剧',
      price_volatility: '价格波动剧烈'
    },
    reputation: {
      negative_media: '负面媒体报道增多',
      customer_complaint: '客户投诉量上升',
      public_relations_crisis: '公关危机事件'
    }
  };
  
  const base = descriptions[category]?.[type] || '发现潜在风险因子';
  const severityModifier = {
    low: '，需要持续关注',
    medium: '，建议加强监控',
    high: '，需要立即处理',
    critical: '，紧急情况，需要马上采取行动'
  };
  
  return base + (severityModifier[severity] || '');
}

function generateWarningMessage(warningType, severity, enterpriseName) {
  const messages = {
    new_risk: `${enterpriseName}发现新的风险因子`,
    risk_escalation: `${enterpriseName}风险等级出现升级`,
    guarantee_chain: `${enterpriseName}担保链存在风险传导`,
    financial_anomaly: `${enterpriseName}财务数据出现异常`
  };
  
  const base = messages[warningType] || `${enterpriseName}发现风险预警`;
  
  if (severity === 'critical') {
    return base + '，情况紧急，请立即关注处理';
  } else if (severity === 'warning') {
    return base + '，建议尽快关注处理';
  } else {
    return base + '，请关注后续发展';
  }
}

// 运行脚本
generateRiskData()
  .then(() => {
    console.log('数据生成完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  }); 