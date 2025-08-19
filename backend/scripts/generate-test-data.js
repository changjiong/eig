const { Pool } = require('pg');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'eig_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});


// 辅助函数：生成随机数
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => +(Math.random() * (max - min) + min).toFixed(decimals);
const randomBool = () => Math.random() > 0.5;
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// 辅助函数：生成UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 中文企业名称池
const companyNames = [
  '华泰科技有限公司', '金融科技集团', '蓝海投资公司', '星辰智能科技', '汇丰贸易有限公司',
  '东方电子科技', '创新软件开发', '智慧物联科技', '绿色能源集团', '数字化转型公司',
  '云端服务科技', '智能制造企业', '新材料研发中心', '生物医药公司', '环保科技集团',
  '互联网金融平台', '人工智能研究院', '区块链技术公司', '大数据分析中心', '量子计算实验室',
  '新能源汽车制造', '半导体芯片设计', '医疗器械研发', '教育科技平台', '文化传媒集团',
  '农业科技公司', '食品安全检测', '建筑工程集团', '房地产开发商', '物流运输企业',
  '电商平台运营', '社交媒体公司', '游戏开发工作室', '影视制作公司', '音乐娱乐集团',
  '体育产业投资', '旅游服务平台', '酒店管理集团', '餐饮连锁企业', '零售商贸公司',
  '时尚设计工作室', '珠宝首饰制造', '化妆品研发', '个人护理用品', '家居用品制造',
  '汽车零部件供应', '机械设备制造', '电力设备公司', '通信基础设施', '网络安全服务',
  '数据中心运营', '云计算服务商', '软件即服务平台', '移动应用开发', '虚拟现实技术',
  '增强现实解决方案', '物联网平台', '智能家居系统', '工业自动化', '机器人技术公司',
  '无人机制造商', '3D打印服务', '激光技术应用', '光电科技研发', '新材料应用',
  '环境监测服务', '废物处理技术', '水处理工程', '大气治理公司', '土壤修复技术',
  '可再生能源开发', '储能技术研究', '智能电网建设', '电动汽车充电', '氢能源开发',
  '生物技术研究', '基因工程应用', '细胞治疗技术', '精准医疗平台', '数字健康服务',
  '远程医疗系统', '医学影像分析', '药物研发外包', '临床试验服务', '医疗数据分析',
  '在线教育平台', '职业技能培训', '企业培训服务', '知识管理系统', '学习分析平台',
  '教育内容开发', '虚拟实验室', '在线考试系统', '学生信息管理', '校园智能化',
  '金融科技创新', '数字货币交易', '移动支付平台', '风险管理系统', '信贷评估服务',
  '保险科技应用', '财富管理平台', '投资咨询服务', '资产管理公司', '私募股权基金'
];

// 行业分类
const industries = [
  '信息技术', '金融服务', '制造业', '房地产', '医疗健康',
  '新能源', '教育培训', '文化娱乐', '零售商贸', '物流运输',
  '农业科技', '生物医药', '环保科技', '建筑工程', '汽车制造'
];

// 事件类型和描述模板
const eventTypes = {
  'financing': [
    '完成A轮融资', '获得Pre-A轮投资', '完成B轮融资', 'C轮融资成功',
    '天使轮投资到位', '战略投资者入股', 'IPO上市申请', '定向增发完成'
  ],
  'investment': [
    '收购竞争对手', '战略投资合作', '设立子公司', '海外业务拓展',
    '技术授权合作', '成立合资企业', '股权投资项目', '并购整合'
  ],
  'litigation': [
    '专利侵权诉讼', '商标纠纷案件', '合同违约纠纷', '劳动争议案件',
    '产品质量诉讼', '知识产权争议', '股东权益纠纷', '债务违约案件'
  ],
  'merger': [
    '企业合并重组', '资产重组方案', '股权转让协议', '业务整合计划',
    '品牌合并统一', '组织架构调整', '管理层变更', '战略联盟'
  ],
  'partnership': [
    '战略合作协议', '技术合作伙伴', '销售渠道合作', '供应链合作',
    '品牌联名合作', '研发合作项目', '市场拓展合作', '资源共享协议'
  ],
  'regulation': [
    '行业监管政策', '合规整改通知', '资质认证获得', '环保要求调整',
    '税收政策变化', '进出口政策', '数据保护规定', '安全生产标准'
  ]
};

// 风险因子类型和描述
const riskFactorTypes = {
  'guarantee_chain': ['担保链风险', '互保圈风险', '对外担保过度', '担保代偿风险'],
  'financial': ['资金链紧张', '流动性不足', '负债率过高', '盈利能力下降'],
  'legal': ['法律诉讼风险', '合规违规风险', '知识产权纠纷', '监管处罚'],
  'policy': ['政策调整影响', '行业监管变化', '税收政策风险', '环保政策'],
  'credit': ['信用评级下调', '逾期还款记录', '银行授信收紧', '商业信誉受损'],
  'market': ['市场竞争加剧', '行业前景不明', '客户集中风险', '供应商依赖'],
  'operational': ['管理层变动', '核心技术人员流失', '生产安全事故', '质量控制问题']
};

// 产品类型和特点
const productTypes = {
  '流动资金贷款': {
    features: ['审批快速', '利率优惠', '随借随还', '额度循环'],
    benefits: ['资金周转灵活', '降低融资成本', '提高资金效率', '简化申请流程']
  },
  '固定资产贷款': {
    features: ['期限较长', '额度较大', '分期投放', '专款专用'],
    benefits: ['支持设备采购', '扩大生产规模', '技术升级改造', '固定资产投资']
  },
  '供应链金融': {
    features: ['基于真实贸易', '风险可控', '操作便捷', '在线申请'],
    benefits: ['盘活应收账款', '加速资金回笼', '优化现金流', '降低融资门槛']
  },
  '票据贴现': {
    features: ['手续简便', '放款迅速', '成本较低', '风险分散'],
    benefits: ['提前获得资金', '减少资金占用', '提高资金效率', '降低管理成本']
  },
  '信用证融资': {
    features: ['国际贸易', '银行信用', '风险保障', '期限灵活'],
    benefits: ['促进国际贸易', '降低交易风险', '提升商业信誉', '扩大业务规模']
  }
};

// 新闻类型和关键词
const newsTypes = {
  'business': ['业务拓展', '市场开发', '客户合作', '服务升级', '品牌建设'],
  'financing': ['融资消息', '投资动态', '资本市场', '估值变化', '股权变动'],
  'partnership': ['合作伙伴', '战略联盟', '技术合作', '渠道合作', '生态建设'],
  'legal': ['法律事务', '合规管理', '知识产权', '法规政策', '风险控制'],
  'product': ['产品发布', '技术创新', '功能升级', '用户体验', '市场反馈'],
  'regulation': ['监管政策', '行业标准', '合规要求', '资质认证', '政策解读']
};

// 营销策略类型
const strategyTypes = {
  'presentation': ['产品推介会', '客户答谢会', '行业论坛', '技术交流会'],
  'partnership': ['战略合作', '渠道拓展', '联合营销', '生态建设'],
  'event': ['品牌活动', '展会参与', '路演活动', '客户体验'],
  'digital': ['数字营销', '社交媒体', '内容营销', '精准投放']
};

// 获取现有数据
async function getExistingData() {
  const usersResult = await pool.query('SELECT id FROM users LIMIT 10');
  const enterprisesResult = await pool.query('SELECT id, name FROM enterprises LIMIT 50');
  
  return {
    userIds: usersResult.rows.map(row => row.id),
    enterprises: enterprisesResult.rows
  };
}

// 生成任务数据
async function generateTasks(existingData, count = 150) {
  console.log('🔄 Generating tasks data...');
  
  const taskTypes = ['entity_review', 'relationship_review', 'event_verification', 'data_verification'];
  const priorities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['pending', 'in_progress', 'completed', 'rejected'];
  
  const tasks = [];
  for (let i = 0; i < count; i++) {
    const taskType = randomChoice(taskTypes);
    const priorityNum = randomChoice([1, 2, 3, 4, 5]); // 数字优先级
    const status = randomChoice(statuses);
    const assignee = randomChoice(existingData.userIds);
    const enterprise = randomChoice(existingData.enterprises);
    
    const titleMap = {
      'entity_review': `企业信息审核 - ${randomChoice(companyNames)}`,
      'relationship_review': `关系链审核 - 投资关系确认`,
      'event_verification': `事件验证 - ${randomChoice(['融资事件', '并购事件', '合作事件'])}核实`,
      'data_verification': `数据验证 - ${randomChoice(['财务数据', '基本信息', '风险数据'])}校验`
    };
    
    const task = {
      title: titleMap[taskType],
      description: `请完成${titleMap[taskType]}的相关工作，确保数据准确性和完整性。`,
      type: taskType,
      priority: priorityNum,
      status,
      assignee_id: assignee,
      entity_id: enterprise.id,
      entity_type: 'enterprise',
      due_date: randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      metadata: JSON.stringify({tags: [taskType, `priority_${priorityNum}`]})
    };
    
    tasks.push(task);
  }
  
  // 批量插入
  for (const task of tasks) {
    await pool.query(`
      INSERT INTO tasks (title, description, type, priority, status, assignee_id, entity_id, entity_type, due_date, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [task.title, task.description, task.type, task.priority, task.status, 
        task.assignee_id, task.entity_id, task.entity_type, task.due_date, task.metadata]);
  }
  
  console.log(`✅ Generated ${count} tasks`);
}

// 生成事件数据
async function generateEvents(existingData, count = 120) {
  console.log('🔄 Generating events data...');
  
  const events = [];
  for (let i = 0; i < count; i++) {
    const eventType = randomChoice(Object.keys(eventTypes));
    const enterprise = randomChoice(existingData.enterprises);
    const eventTemplate = randomChoice(eventTypes[eventType]);
    
    const event = {
      title: `${enterprise.name}${eventTemplate}`,
      description: `${enterprise.name}于近期${eventTemplate}，涉及金额${randomInt(100, 10000)}万元。`,
      event_type: eventType,
      enterprise_id: enterprise.id,
      enterprise_name: enterprise.name,
      date: randomDate(new Date(2024, 0, 1), new Date()),
      importance: randomInt(30, 100),
      source: randomChoice(['企业公告', '行业资讯', '媒体报道', '监管公告', '内部消息']),
      source_url: `https://example.com/news/${generateUUID()}`,
      metadata: JSON.stringify({
        amount: randomInt(100, 10000),
        currency: 'CNY',
        participants: [enterprise.name]
      }),
      is_processed: randomBool()
    };
    
    events.push(event);
  }
  
  // 批量插入
  for (const event of events) {
    await pool.query(`
      INSERT INTO events (title, description, event_type, enterprise_id, enterprise_name, date, 
                         importance, source, source_url, metadata, is_processed)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [event.title, event.description, event.event_type, event.enterprise_id, event.enterprise_name,
        event.date, event.importance, event.source, event.source_url, event.metadata,
        event.is_processed]);
  }
  
  console.log(`✅ Generated ${count} events`);
}

// 生成潜客数据
async function generateProspects(existingData, count = 100) {
  console.log('🔄 Generating prospects data...');
  
  const discoveryMethods = ['supply_chain', 'investment_network', 'industry_analysis', 'competitor_analysis', 'market_research'];
  const statuses = ['discovered', 'contacted', 'interested', 'converted', 'rejected'];
  const priorities = ['low', 'medium', 'high'];
  
  const prospects = [];
  for (let i = 0; i < count; i++) {
    const name = randomChoice(companyNames);
    const industry = randomChoice(industries);
    const seedEnterprise = randomChoice(existingData.enterprises);
    
    const prospect = {
      name,
      industry,
      registered_capital: randomInt(1000000, 500000000),
      employee_count: randomInt(10, 2000),
      svs: randomFloat(60, 100),
      des: randomFloat(60, 100),
      nis: randomFloat(60, 100), 
      pcs: randomFloat(60, 100),
      discovery_path: `通过${seedEnterprise.name}的${randomChoice(['供应链关系', '投资关系', '合作关系', '竞争关系'])}发现该潜在客户`,
      discovery_method: randomChoice(discoveryMethods),
      seed_enterprise_id: seedEnterprise.id,
      confidence_score: randomFloat(70, 95),
      status: randomChoice(statuses),
      assigned_to: randomChoice(existingData.userIds),
      contact_info: JSON.stringify({
        phone: `138${randomInt(10000000, 99999999)}`,
        email: `contact@${name.replace(/[^a-zA-Z]/g, '').toLowerCase()}.com`,
        address: `${randomChoice(['北京市', '上海市', '深圳市', '广州市', '杭州市'])}某某区某某街道`
      }),
      notes: `该企业在${industry}领域具有较强实力，具备合作潜力。`
    };
    
    prospects.push(prospect);
  }
  
  // 批量插入
  for (const prospect of prospects) {
    await pool.query(`
      INSERT INTO prospects (name, industry, registered_capital, employee_count, svs, des, nis, pcs,
                           discovery_path, discovery_method, seed_enterprise_id, confidence_score, 
                           status, assigned_to, contact_info, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [prospect.name, prospect.industry, prospect.registered_capital, prospect.employee_count,
        prospect.svs, prospect.des, prospect.nis, prospect.pcs, prospect.discovery_path,
        prospect.discovery_method, prospect.seed_enterprise_id, prospect.confidence_score,
        prospect.status, prospect.assigned_to, prospect.contact_info, prospect.notes]);
  }
  
  console.log(`✅ Generated ${count} prospects`);
}

// 生成风险因子数据
async function generateRiskFactors(existingData, count = 200) {
  console.log('🔄 Generating risk factors data...');
  
  const levels = ['low', 'medium', 'high', 'critical'];
  const statuses = ['active', 'monitoring', 'resolved', 'false_positive'];
  
  const riskFactors = [];
  for (let i = 0; i < count; i++) {
    const category = randomChoice(Object.keys(riskFactorTypes));
    const riskName = randomChoice(riskFactorTypes[category]);
    const level = randomChoice(levels);
    const enterprise = randomChoice(existingData.enterprises);
    
    const riskFactor = {
      enterprise_id: enterprise.id,
      name: riskName,
      category,
      level,
      score: level === 'critical' ? randomInt(80, 100) : 
             level === 'high' ? randomInt(60, 80) :
             level === 'medium' ? randomInt(40, 60) : randomInt(20, 40),
      description: `${enterprise.name}存在${riskName}，需要密切关注。`,
      evidence: `通过数据分析发现该企业在${category}方面存在潜在风险指标。`,
      impact_assessment: `该风险可能对企业的${randomChoice(['经营', '财务', '声誉', '合规'])}产生${level === 'critical' ? '严重' : level === 'high' ? '较大' : '一定'}影响。`,
      mitigation_strategy: `建议采取${randomChoice(['加强监控', '风险对冲', '预警机制', '应急预案'])}等措施进行风险控制。`,
      status: randomChoice(statuses),
      detected_at: randomDate(new Date(2024, 0, 1), new Date())
    };
    
    riskFactors.push(riskFactor);
  }
  
  // 批量插入
  for (const risk of riskFactors) {
    await pool.query(`
      INSERT INTO risk_factors (enterprise_id, name, category, level, score, description,
                               evidence, impact_assessment, mitigation_strategy, status, detected_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [risk.enterprise_id, risk.name, risk.category, risk.level, risk.score, risk.description,
        risk.evidence, risk.impact_assessment, risk.mitigation_strategy, risk.status, risk.detected_at]);
  }
  
  console.log(`✅ Generated ${count} risk factors`);
}

// 生成财务数据
async function generateFinancialData(existingData, count = 150) {
  console.log('🔄 Generating financial data...');
  
  const dataSources = ['企业年报', '审计报告', '财务公告', '监管披露', '第三方数据'];
  const years = [2021, 2022, 2023, 2024];
  const quarters = [null, 1, 2, 3, 4]; // null表示年度数据
  
  const financialData = [];
  for (let i = 0; i < count; i++) {
    const enterprise = randomChoice(existingData.enterprises);
    const year = randomChoice(years);
    const quarter = randomChoice(quarters);
    
    // 生成基础财务数据（以分为单位）
    const revenue = randomInt(1000000000, 1000000000000); // 10万到100亿分
    const profit = Math.floor(revenue * randomFloat(0.05, 0.25)); // 利润率5%-25%
    const totalAssets = Math.floor(revenue * randomFloat(1.2, 3.0)); // 资产周转率
    const totalLiabilities = Math.floor(totalAssets * randomFloat(0.3, 0.7)); // 负债率30%-70%
    
    const financial = {
      enterprise_id: enterprise.id,
      year,
      quarter,
      revenue,
      profit,
      gross_profit: Math.floor(revenue * randomFloat(0.15, 0.40)),
      operating_income: Math.floor(revenue * randomFloat(0.08, 0.30)),
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      shareholders_equity: totalAssets - totalLiabilities,
      cash_flow: Math.floor(profit * randomFloat(0.8, 1.5)),
      debt_ratio: +(totalLiabilities / totalAssets).toFixed(4),
      roe: +(profit / (totalAssets - totalLiabilities)).toFixed(4),
      roa: +(profit / totalAssets).toFixed(4),
      current_ratio: randomFloat(1.0, 3.0, 4),
      quick_ratio: randomFloat(0.8, 2.5, 4),
      data_source: randomChoice(dataSources),
      is_audited: randomBool()
    };
    
    financialData.push(financial);
  }
  
  // 批量插入（处理唯一约束冲突）
  for (const financial of financialData) {
    try {
      await pool.query(`
        INSERT INTO financial_data (enterprise_id, year, quarter, revenue, profit, gross_profit, 
                                   operating_income, total_assets, total_liabilities, shareholders_equity,
                                   cash_flow, debt_ratio, roe, roa, current_ratio, quick_ratio,
                                   data_source, is_audited)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (enterprise_id, year, quarter) DO NOTHING
      `, [financial.enterprise_id, financial.year, financial.quarter, financial.revenue, financial.profit,
          financial.gross_profit, financial.operating_income, financial.total_assets, financial.total_liabilities,
          financial.shareholders_equity, financial.cash_flow, financial.debt_ratio, financial.roe, financial.roa,
          financial.current_ratio, financial.quick_ratio, financial.data_source, financial.is_audited]);
    } catch (error) {
      // 忽略唯一约束冲突
      if (error.code !== '23505') {
        throw error;
      }
    }
  }
  
  console.log(`✅ Generated ${count} financial data records`);
}

// 生成新闻数据
async function generateNews(existingData, count = 100) {
  console.log('🔄 Generating news data...');
  
  const sentiments = ['positive', 'neutral', 'negative'];
  
  const newsList = [];
  for (let i = 0; i < count; i++) {
    const newsType = randomChoice(Object.keys(newsTypes));
    const enterprise = randomChoice(existingData.enterprises);
    const keywords = randomChoice(newsTypes[newsType]);
    const sentiment = randomChoice(sentiments);
    
    const news = {
      title: `${enterprise.name}${randomChoice(['宣布', '完成', '启动', '发布'])}${keywords}相关计划`,
      content: `据悉，${enterprise.name}近日${randomChoice(['宣布', '透露', '公布'])}了${keywords}的最新进展...`,
      summary: `${enterprise.name}在${keywords}方面取得重要进展`,
      source: randomChoice(['财经网', '新浪财经', '36氪', '投资界', '企业官网', '行业媒体']),
      source_url: `https://example.com/news/${generateUUID()}`,
      published_at: randomDate(new Date(2024, 0, 1), new Date()),
      news_type: newsType,
      enterprise_id: enterprise.id,
      keywords: [keywords, enterprise.name, newsType],
      sentiment,
      importance: randomInt(30, 90),
      is_verified: randomBool(),
      metadata: JSON.stringify({
        wordCount: randomInt(500, 3000),
        viewCount: randomInt(100, 50000),
        likeCount: randomInt(10, 1000)
      })
    };
    
    newsList.push(news);
  }
  
  // 批量插入
  for (const news of newsList) {
    await pool.query(`
      INSERT INTO news (title, content, summary, source, source_url, published_at, news_type,
                       enterprise_id, keywords, sentiment, importance, is_verified, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [news.title, news.content, news.summary, news.source, news.source_url, news.published_at,
        news.news_type, news.enterprise_id, news.keywords, news.sentiment, news.importance,
        news.is_verified, news.metadata]);
  }
  
  console.log(`✅ Generated ${count} news records`);
}

// 生成产品推荐数据
async function generateProductRecommendations(existingData, count = 100) {
  console.log('🔄 Generating product recommendations data...');
  
  const priorities = [1, 2, 3, 4, 5];
  const statuses = ['active', 'inactive', 'discontinued'];
  
  const recommendations = [];
  for (let i = 0; i < count; i++) {
    const enterprise = randomChoice(existingData.enterprises);
    const productName = randomChoice(Object.keys(productTypes));
    const productInfo = productTypes[productName];
    
    const recommendation = {
      enterprise_id: enterprise.id,
      product_name: productName,
      product_type: randomChoice(['贷款产品', '投资产品', '保险产品', '理财产品']),
      description: `针对${enterprise.name}的业务特点，推荐${productName}产品`,
      match_score: randomInt(70, 100),
      features: productInfo.features,
      benefits: productInfo.benefits,
      target_amount: randomInt(100000000, 10000000000), // 100万到1亿分
      interest_rate_min: randomFloat(0.03, 0.08, 4),
      interest_rate_max: randomFloat(0.08, 0.15, 4),
      loan_term_months: randomChoice([6, 12, 18, 24, 36, 60]),
      eligibility_criteria: '企业成立满2年，年营收不低于1000万，无重大违法违规记录',
      recommendation_reason: `基于${enterprise.name}的${randomChoice(['财务状况', '行业地位', '发展前景', '资金需求'])}，该产品匹配度较高`,
      priority: randomChoice(priorities),
      status: randomChoice(statuses),
      created_by: randomChoice(existingData.userIds)
    };
    
    recommendations.push(recommendation);
  }
  
  // 批量插入
  for (const rec of recommendations) {
    await pool.query(`
      INSERT INTO product_recommendations (enterprise_id, product_name, product_type, description,
                                         match_score, features, benefits, target_amount, 
                                         interest_rate_min, interest_rate_max, loan_term_months,
                                         eligibility_criteria, recommendation_reason, priority,
                                         status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [rec.enterprise_id, rec.product_name, rec.product_type, rec.description, rec.match_score,
        rec.features, rec.benefits, rec.target_amount, rec.interest_rate_min, rec.interest_rate_max,
        rec.loan_term_months, rec.eligibility_criteria, rec.recommendation_reason, rec.priority,
        rec.status, rec.created_by]);
  }
  
  console.log(`✅ Generated ${count} product recommendations`);
}

// 生成营销策略数据
async function generateMarketingStrategies(existingData, count = 100) {
  console.log('🔄 Generating marketing strategies data...');
  
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const statuses = ['proposed', 'approved', 'in_progress', 'completed', 'cancelled'];
  
  const strategies = [];
  for (let i = 0; i < count; i++) {
    const enterprise = randomChoice(existingData.enterprises);
    const strategyType = randomChoice(Object.keys(strategyTypes));
    const strategyName = randomChoice(strategyTypes[strategyType]);
    
    const strategy = {
      enterprise_id: enterprise.id,
      title: `${enterprise.name} - ${strategyName}营销方案`,
      description: `针对${enterprise.name}制定的${strategyName}营销策略，旨在提升品牌知名度和业务转化`,
      strategy_type: strategyType,
      priority: randomChoice(priorities),
      expected_outcome: `预期通过${strategyName}提升客户转化率${randomInt(10, 50)}%`,
      expected_revenue: randomInt(50000000, 500000000), // 50万到500万分
      execution_steps: [
        '前期调研和方案制定',
        '资源准备和团队组建', 
        '方案执行和过程监控',
        '效果评估和优化调整'
      ],
      required_resources: ['市场部门', '销售团队', '技术支持', '预算资金'],
      timeline_weeks: randomInt(4, 20),
      success_metrics: '客户转化率、品牌曝光度、ROI指标',
      status: randomChoice(statuses),
      assigned_to: randomChoice(existingData.userIds),
      created_by: randomChoice(existingData.userIds),
      approved_by: randomBool() ? randomChoice(existingData.userIds) : null,
      started_at: randomBool() ? randomDate(new Date(2024, 0, 1), new Date()) : null,
      completed_at: randomBool() ? randomDate(new Date(2024, 0, 1), new Date()) : null
    };
    
    strategies.push(strategy);
  }
  
  // 批量插入
  for (const strategy of strategies) {
    await pool.query(`
      INSERT INTO marketing_strategies (enterprise_id, title, description, strategy_type, priority,
                                       expected_outcome, expected_revenue, execution_steps,
                                       required_resources, timeline_weeks, success_metrics, status,
                                       assigned_to, created_by, approved_by, started_at, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [strategy.enterprise_id, strategy.title, strategy.description, strategy.strategy_type,
        strategy.priority, strategy.expected_outcome, strategy.expected_revenue, strategy.execution_steps,
        strategy.required_resources, strategy.timeline_weeks, strategy.success_metrics, strategy.status,
        strategy.assigned_to, strategy.created_by, strategy.approved_by, strategy.started_at, strategy.completed_at]);
  }
  
  console.log(`✅ Generated ${count} marketing strategies`);
}

// 生成关系路径数据
async function generateRelationshipPaths(existingData, count = 100) {
  console.log('🔄 Generating relationship paths data...');
  
  const pathTypes = ['credit_path', 'recommendation_path', 'product_path', 'risk_path', 'investment_path'];
  
  const paths = [];
  for (let i = 0; i < count; i++) {
    const enterprise = randomChoice(existingData.enterprises);
    const pathType = randomChoice(pathTypes);
    const pathLength = randomInt(2, 6);
    
    // 生成路径节点和边
    const pathNodes = [];
    const pathEdges = [];
    
    for (let j = 0; j < pathLength; j++) {
      const node = {
        id: generateUUID(),
        type: randomChoice(['enterprise', 'person', 'product']),
        name: j === 0 ? enterprise.name : randomChoice(companyNames),
        properties: {
          industry: randomChoice(industries),
          score: randomFloat(60, 100)
        }
      };
      pathNodes.push(node);
      
      if (j > 0) {
        const edge = {
          source: pathNodes[j-1].id,
          target: node.id,
          type: randomChoice(['investment', 'cooperation', 'supply', 'guarantee']),
          weight: randomFloat(0.3, 1.0),
          properties: {
            amount: randomInt(1000, 100000),
            date: randomDate(new Date(2023, 0, 1), new Date()).toISOString()
          }
        };
        pathEdges.push(edge);
      }
    }
    
    const path = {
      enterprise_id: enterprise.id,
      title: `${enterprise.name}的${pathType}关系路径`,
      path_type: pathType,
      confidence: randomInt(70, 95),
      path_nodes: JSON.stringify(pathNodes),
      path_edges: JSON.stringify(pathEdges),
      path_length: pathLength,
      strength_score: randomFloat(60, 95),
      business_value: `通过该路径可以为${enterprise.name}提供${randomChoice(['授信支持', '业务推荐', '产品匹配', '风险预警'])}`,
      action_recommendation: `建议通过该关系链${randomChoice(['建立合作', '风险控制', '业务拓展', '资源整合'])}`,
      created_by: randomChoice(existingData.userIds)
    };
    
    paths.push(path);
  }
  
  // 批量插入
  for (const path of paths) {
    await pool.query(`
      INSERT INTO relationship_paths (enterprise_id, title, path_type, confidence, path_nodes,
                                     path_edges, path_length, strength_score, business_value,
                                     action_recommendation, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [path.enterprise_id, path.title, path.path_type, path.confidence, path.path_nodes,
        path.path_edges, path.path_length, path.strength_score, path.business_value,
        path.action_recommendation, path.created_by]);
  }
  
  console.log(`✅ Generated ${count} relationship paths`);
}

// 生成用户设置数据
async function generateUserSettings(existingData) {
  console.log('🔄 Generating user settings data...');
  
  const themes = ['light', 'dark', 'system'];
  const languages = ['zh-CN', 'en-US'];
  const layouts = ['default', 'compact', 'comfortable'];
  
  const settings = [];
  for (const userId of existingData.userIds) {
    const setting = {
      user_id: userId,
      notification_email: randomBool(),
      notification_browser: randomBool(),
      notification_mobile: randomBool(),
      notification_types: JSON.stringify({
        system: randomBool(),
        task: randomBool(),
        event: randomBool(),
        risk: randomBool()
      }),
      theme: randomChoice(themes),
      language: randomChoice(languages),
      date_format: 'YYYY-MM-DD',
      timezone: 'Asia/Shanghai',
      dashboard_layout: JSON.stringify({
        layout: randomChoice(layouts),
        cards: ['stats', 'tasks', 'events', 'prospects'].slice(0, randomInt(2, 4))
      }),
      preferences: JSON.stringify({
        autoSave: randomBool(),
        showTips: randomBool(),
        pageSize: randomChoice([10, 20, 50])
      })
    };
    
    settings.push(setting);
  }
  
  // 批量插入
  for (const setting of settings) {
    await pool.query(`
      INSERT INTO user_settings (user_id, notification_email, notification_browser, notification_mobile,
                                notification_types, theme, language, date_format, timezone,
                                dashboard_layout, preferences)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id) DO NOTHING
    `, [setting.user_id, setting.notification_email, setting.notification_browser, setting.notification_mobile,
        setting.notification_types, setting.theme, setting.language, setting.date_format,
        setting.timezone, setting.dashboard_layout, setting.preferences]);
  }
  
  console.log(`✅ Generated ${settings.length} user settings`);
}

// 生成用户登录历史数据
async function generateLoginHistory(existingData, count = 200) {
  console.log('🔄 Generating login history data...');
  
  const deviceTypes = ['desktop', 'mobile', 'tablet'];
  const locations = ['北京市', '上海市', '深圳市', '广州市', '杭州市', '成都市', '武汉市', '西安市'];
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
    'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0'
  ];
  
  const histories = [];
  for (let i = 0; i < count; i++) {
    const loginTime = randomDate(new Date(2024, 0, 1), new Date());
    const sessionDuration = randomInt(300, 28800); // 5分钟到8小时
    const logoutTime = new Date(loginTime.getTime() + sessionDuration * 1000);
    
    const history = {
      user_id: randomChoice(existingData.userIds),
      login_time: loginTime,
      ip_address: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
      user_agent: randomChoice(userAgents),
      device_type: randomChoice(deviceTypes),
      location: randomChoice(locations),
      success: randomInt(1, 100) > 5, // 95%成功率
      failure_reason: randomInt(1, 100) <= 5 ? randomChoice(['密码错误', '账户锁定', '网络异常']) : null,
      session_duration: sessionDuration,
      logout_time: randomInt(1, 100) > 10 ? logoutTime : null // 90%有正常登出
    };
    
    histories.push(history);
  }
  
  // 批量插入
  for (const history of histories) {
    await pool.query(`
      INSERT INTO user_login_history (user_id, login_time, ip_address, user_agent, device_type,
                                     location, success, failure_reason, session_duration, logout_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [history.user_id, history.login_time, history.ip_address, history.user_agent, history.device_type,
        history.location, history.success, history.failure_reason, history.session_duration, history.logout_time]);
  }
  
  console.log(`✅ Generated ${count} login history records`);
}

// 主函数
async function generateAllTestData() {
  try {
    console.log('🚀 Starting test data generation...\n');
    
    // 获取现有数据
    const existingData = await getExistingData();
    console.log(`📊 Found ${existingData.userIds.length} users and ${existingData.enterprises.length} enterprises\n`);
    
    if (existingData.userIds.length === 0 || existingData.enterprises.length === 0) {
      console.log('❌ No existing users or enterprises found. Please run seed data first.');
      return;
    }
    
    // 依次生成各表的测试数据
    await generateTasks(existingData, 150);
    await generateEvents(existingData, 120);
    await generateProspects(existingData, 100);
    await generateRiskFactors(existingData, 200);
    await generateFinancialData(existingData, 150);
    await generateNews(existingData, 100);
    await generateProductRecommendations(existingData, 100);
    await generateMarketingStrategies(existingData, 100);
    await generateRelationshipPaths(existingData, 100);
    await generateUserSettings(existingData);
    await generateLoginHistory(existingData, 200);
    
    console.log('\n🎉 All test data generated successfully!');
    console.log('\n📈 Summary:');
    console.log('- Tasks: 150 records');
    console.log('- Events: 120 records');
    console.log('- Prospects: 100 records');
    console.log('- Risk Factors: 200 records');
    console.log('- Financial Data: 150 records');
    console.log('- News: 100 records');
    console.log('- Product Recommendations: 100 records');
    console.log('- Marketing Strategies: 100 records');
    console.log('- Relationship Paths: 100 records');
    console.log('- User Settings: All users');
    console.log('- Login History: 200 records');
    console.log('\nTotal: 1420+ records generated! 🎯');
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// 运行脚本
generateAllTestData().catch(console.error);