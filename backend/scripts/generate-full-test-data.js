const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'eig_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// 生成随机数据的工具函数
const generateRandomData = {
  // 企业名称
  companyNames: [
    '华为技术', '腾讯控股', '阿里巴巴集团', '百度集团', '京东集团', '美团', '字节跳动', '小米集团',
    '网易公司', '新浪微博', '滴滴出行', '拼多多', '快手科技', '哔哩哔哩', '搜狐公司', '360集团',
    '携程集团', '蚂蚁金服', '苏宁易购', '唯品会', '爱奇艺', '优酷土豆', '58同城', '猎豹移动',
    '完美世界', '三七互娱', '巨人网络', '中手游', '恺英网络', '游族网络', '掌趣科技', '昆仑万维',
    '同花顺', '东方财富', '大智慧', '恒生电子', '金证股份', '顶点软件', '赢时胜', '长亮科技',
    '银信科技', '润和软件', '东软集团', '中科曙光', '紫光股份', '浪潮信息', '中兴通讯', '大华股份',
    '海康威视', '科大讯飞', '四维图新', '千方科技', '易华录', '数字政通', '超图软件', '华宇软件',
    '启明星辰', '绿盟科技', '卫士通', '任子行', '蓝盾股份', '北信源', '格尔软件', '数字认证',
    '天融信', '安恒信息', '奇安信', '深信服', '山石网科', '亚信安全', '安博通', '中孚信息',
    '神州信息', '太极股份', '东华软件', '用友网络', '金山软件', '广联达', '石基信息', '汉得信息',
    '博彦科技', '海辉软件', '文思海辉', '中软国际', '软通动力', '亚信科技', '东软载波', '久其软件',
    '万达信息', '榕基软件', '新大陆', '新开普', '拓尔思', '美亚柏科', '立思辰', '佳都科技'
  ],
  
  // 行业类型
  industries: [
    '信息技术', '人工智能', '大数据', '云计算', '区块链', '物联网', '5G通信', '网络安全',
    '软件开发', '系统集成', '电子商务', '数字营销', '在线教育', '远程医疗', '智能制造',
    '新能源', '生物医药', '金融科技', '保险科技', '房地产科技', '交通运输', '物流配送',
    '餐饮服务', '旅游出行', '文化娱乐', '体育健身', '社交网络', '内容创作', '游戏娱乐'
  ],
  
  // 中国城市
  cities: [
    '北京市海淀区', '北京市朝阳区', '北京市东城区', '北京市西城区', '北京市丰台区',
    '上海市浦东新区', '上海市黄浦区', '上海市静安区', '上海市徐汇区', '上海市长宁区',
    '深圳市南山区', '深圳市福田区', '深圳市罗湖区', '深圳市龙岗区', '深圳市宝安区',
    '广州市天河区', '广州市海珠区', '广州市越秀区', '广州市白云区', '广州市荔湾区',
    '杭州市西湖区', '杭州市滨江区', '杭州市拱墅区', '杭州市上城区', '杭州市下城区',
    '南京市鼓楼区', '南京市玄武区', '南京市建邺区', '南京市秦淮区', '南京市雨花台区',
    '成都市武侯区', '成都市锦江区', '成都市青羊区', '成都市金牛区', '成都市成华区',
    '武汉市江汉区', '武汉市硚口区', '武汉市汉阳区', '武汉市武昌区', '武汉市洪山区',
    '西安市雁塔区', '西安市碑林区', '西安市新城区', '西安市莲湖区', '西安市未央区',
    '重庆市渝中区', '重庆市江北区', '重庆市南岸区', '重庆市九龙坡区', '重庆市沙坪坝区'
  ],
  
  // 人名
  names: [
    '李伟', '王强', '张敏', '刘洋', '陈静', '杨军', '赵磊', '黄丽', '周杰', '吴敏',
    '徐伟', '朱静', '马强', '胡军', '郭敏', '何伟', '高丽', '林杰', '罗强', '宋敏',
    '唐军', '韩伟', '冯丽', '董杰', '薛强', '贺敏', '龚军', '程伟', '曾丽', '彭杰',
    '吕强', '苏敏', '卢军', '蒋伟', '蔡丽', '贾杰', '丁强', '魏敏', '薛军', '叶伟',
    '阎丽', '余杰', '潘强', '杜敏', '戴军', '夏伟', '钟丽', '汪杰', '田强', '任敏',
    '姜军', '范伟', '方丽', '石杰', '姚强', '谭敏', '廖军', '邹伟', '熊丽', '金杰',
    '陆强', '郝敏', '孔军', '白伟', '崔丽', '康杰', '毛强', '邱敏', '秦军', '江伟',
    '史丽', '顾杰', '侯强', '邵敏', '孟军', '龙伟', '万丽', '段杰', '漕强', '钱敏',
    '汤军', '尹伟', '黎丽', '易杰', '常强', '武敏', '乔军', '赖伟', '龚丽', '文杰'
  ],
  
  // 职位
  positions: [
    'CEO', 'CTO', 'CFO', 'COO', 'VP', '总经理', '副总经理', '技术总监', '产品总监', '市场总监',
    '销售总监', '运营总监', '财务总监', '人事总监', '研发总监', '项目总监', '部门经理', '产品经理',
    '技术经理', '销售经理', '市场经理', '运营经理', '财务经理', '人事经理', '项目经理', '架构师',
    '高级工程师', '软件工程师', '算法工程师', '数据工程师', '前端工程师', '后端工程师', '全栈工程师',
    '测试工程师', '运维工程师', '安全工程师', 'UI设计师', 'UX设计师', '产品助理', '商务经理',
    '客户经理', '售前经理', '售后经理', '区域经理', '渠道经理', '合作经理', '业务经理', '投资经理',
    '分析师', '顾问', '专家', '主管', '组长', '负责人', '联合创始人', '创始人', '董事长', '董事'
  ],
  
  // 生成随机手机号
  phone: () => {
    const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139',
                     '150', '151', '152', '153', '155', '156', '157', '158', '159',
                     '180', '181', '182', '183', '184', '185', '186', '187', '188', '189'];
    return prefixes[Math.floor(Math.random() * prefixes.length)] + 
           Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  },
  
  // 生成统一社会信用代码
  creditCode: () => {
    const chars = '0123456789ABCDEFGHJKLMNPQRTUWXY';
    let code = '91';
    for (let i = 0; i < 15; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code + 'X';
  },
  
  // 生成邮箱
  email: (name) => {
    const domains = ['163.com', '126.com', 'qq.com', 'gmail.com', 'sina.com', 'sohu.com', 'yahoo.com', 'hotmail.com'];
    const pinyin = name.replace(/[^\w]/g, '').toLowerCase();
    return `${pinyin}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
  },
  
  // 生成随机日期
  randomDate: (start = '2020-01-01', end = '2024-12-31') => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
  },
  
  // 生成随机数值
  randomNumber: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  
  // 随机选择
  randomChoice: (array) => array[Math.floor(Math.random() * array.length)],
  
  // 生成业务范围
  businessScope: () => {
    const scopes = [
      '技术开发、技术推广、技术转让、技术咨询、技术服务',
      '软件开发；计算机系统服务；数据处理',
      '互联网信息服务；第二类增值电信业务',
      '人工智能技术开发；大数据服务；云计算服务',
      '网络安全技术开发；信息系统集成服务',
      '电子商务平台开发与运营；在线数据处理与交易处理业务',
      '移动互联网应用开发；软件技术服务',
      '区块链技术开发；数字货币技术服务',
      '物联网技术开发；智能硬件开发',
      '游戏软件开发；数字内容制作'
    ];
    return generateRandomData.randomChoice(scopes);
  }
};

async function generateFullTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 开始生成完整测试数据...');
    console.log('==========================================');
    
    // 1. 生成企业数据 (150条)
    console.log('\n📊 生成企业数据...');
    
    // 先清理现有数据
    await client.query('TRUNCATE enterprises, clients, relationships, data_sources, data_import_tasks CASCADE');
    
    const enterpriseCount = 150;
    for (let i = 1; i <= enterpriseCount; i++) {
      const name = generateRandomData.randomChoice(generateRandomData.companyNames) + 
                  (i > 80 ? `(${generateRandomData.cities[i % generateRandomData.cities.length].split('市')[0]})` : '') +
                  (i > 40 ? '有限公司' : '集团有限公司');
      
      const enterprise = {
        name: name,
        legal_name: name,
        credit_code: generateRandomData.creditCode(),
        registration_number: `${generateRandomData.randomNumber(100000, 999999)}${i.toString().padStart(4, '0')}`,
        industry: generateRandomData.randomChoice(generateRandomData.industries),
        establish_date: generateRandomData.randomDate('2000-01-01', '2023-12-31'),
        registered_capital: generateRandomData.randomNumber(100, 50000) * 10000,
        business_scope: generateRandomData.businessScope(),
        legal_representative: generateRandomData.randomChoice(generateRandomData.names),
        address: generateRandomData.randomChoice(generateRandomData.cities) + `${generateRandomData.randomNumber(1, 999)}号`,
        phone: generateRandomData.phone(),
        email: `contact@company${i}.com`,
        website: `http://www.company${i}.com`,
        status: generateRandomData.randomChoice(['active', 'active', 'active', 'inactive', 'dissolved']),
        risk_level: generateRandomData.randomChoice(['low', 'low', 'medium', 'medium', 'high']),
        svs: generateRandomData.randomNumber(60, 100) + Math.random(),
        des: generateRandomData.randomNumber(60, 100) + Math.random(),
        nis: generateRandomData.randomNumber(60, 100) + Math.random(),
        pcs: generateRandomData.randomNumber(60, 100) + Math.random(),
        supplier_count: generateRandomData.randomNumber(0, 50),
        customer_count: generateRandomData.randomNumber(0, 200),
        partner_count: generateRandomData.randomNumber(0, 30),
        created_at: generateRandomData.randomDate('2023-01-01', '2024-12-31'),
        updated_at: new Date()
      };
      
      await client.query(`
        INSERT INTO enterprises (
          name, legal_name, credit_code, registration_number, industry, establish_date,
          registered_capital, business_scope, legal_representative, address, phone, email,
          website, status, risk_level, svs, des, nis, pcs, supplier_count, customer_count,
          partner_count, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      `, Object.values(enterprise));
      
      if (i % 20 === 0) console.log(`  ✅ 已生成 ${i}/${enterpriseCount} 个企业`);
    }
    console.log(`✅ 企业数据生成完成: ${enterpriseCount} 条`);
    
    // 2. 生成客户数据 (200条)
    console.log('\n👥 生成客户数据...');
    const clientCount = 200;
    for (let i = 1; i <= clientCount; i++) {
      const name = generateRandomData.randomChoice(generateRandomData.names);
      const company = generateRandomData.randomChoice(generateRandomData.companyNames) + 
                     (Math.random() > 0.5 ? '有限公司' : '科技有限公司');
      
      const clientData = {
        name: name,
        company: company,
        industry: generateRandomData.randomChoice(generateRandomData.industries),
        position: generateRandomData.randomChoice(generateRandomData.positions),
        email: generateRandomData.email(name),
        phone: generateRandomData.phone(),
        status: generateRandomData.randomChoice(['active', 'active', 'potential', 'inactive', 'lost']),
        priority: generateRandomData.randomChoice(['high', 'medium', 'medium', 'low']),
        assigned_to_name: generateRandomData.randomChoice(generateRandomData.names) + '(经理)',
        last_contact: generateRandomData.randomDate('2024-01-01', '2024-12-31'),
        next_follow_up: generateRandomData.randomDate('2024-12-01', '2025-03-31'),
        estimated_value: generateRandomData.randomNumber(10, 5000) * 1000,
        notes: `重要客户，${generateRandomData.randomChoice(['技术需求强烈', '预算充足', '决策周期较长', '合作意向明确', '需要进一步跟进'])}`,
        tags: [
          generateRandomData.randomChoice(['重点客户', '潜在客户', '新客户', '老客户']),
          generateRandomData.randomChoice(['技术导向', '价格敏感', '服务优先', '品牌导向'])
        ],
        created_at: generateRandomData.randomDate('2023-01-01', '2024-12-31'),
        updated_at: new Date()
      };
      
      await client.query(`
        INSERT INTO clients (
          name, company, industry, position, email, phone, status, priority,
          assigned_to_name, last_contact, next_follow_up, estimated_value,
          notes, tags, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, Object.values(clientData));
      
      if (i % 25 === 0) console.log(`  ✅ 已生成 ${i}/${clientCount} 个客户`);
    }
    console.log(`✅ 客户数据生成完成: ${clientCount} 条`);
    
    // 3. 生成关系数据 (300条)
    console.log('\n🔗 生成关系数据...');
    
    // 获取现有企业ID
    const enterpriseIds = await client.query('SELECT id FROM enterprises ORDER BY RANDOM() LIMIT 100');
    const relationshipCount = 300;
    
    for (let i = 1; i <= relationshipCount; i++) {
      const fromId = generateRandomData.randomChoice(enterpriseIds.rows).id;
      let toId = generateRandomData.randomChoice(enterpriseIds.rows).id;
      while (toId === fromId) {
        toId = generateRandomData.randomChoice(enterpriseIds.rows).id;
      }
      
      const relationshipType = generateRandomData.randomChoice(['investment', 'guarantee', 'supply', 'partnership', 'ownership', 'employment']);
      
      const relationship = {
        from_id: fromId,
        from_type: 'enterprise',
        to_id: toId,
        to_type: 'enterprise',
        relationship_type: relationshipType,
        strength: Math.random(),
        is_directional: Math.random() > 0.5,
        start_date: generateRandomData.randomDate('2020-01-01', '2024-12-31'),
        end_date: Math.random() > 0.8 ? generateRandomData.randomDate('2025-01-01', '2026-12-31') : null,
        description: `${generateRandomData.randomChoice(['战略投资', '业务合作', '供应关系', '股权投资', '技术合作', '市场合作'])}关系`,
        metadata: JSON.stringify({
          strength_level: relationshipType === 'investment' ? 'strong' : 'medium',
          verified: Math.random() > 0.3,
          source: 'system_generated'
        }),
        created_at: generateRandomData.randomDate('2023-01-01', '2024-12-31'),
        updated_at: new Date()
      };
      
      try {
        await client.query(`
          INSERT INTO relationships (
            from_id, from_type, to_id, to_type, relationship_type, strength, is_directional,
            start_date, end_date, description, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, Object.values(relationship));
        
        if (i % 50 === 0) console.log(`  ✅ 已生成 ${i}/${relationshipCount} 条关系`);
      } catch (err) {
        // 忽略重复关系
        i--;
      }
    }
    console.log(`✅ 关系数据生成完成: ${relationshipCount} 条`);
    
    // 4. 生成数据源 (15条)
    console.log('\n💽 生成数据源...');
    const dataSources = [
      ['企业基础信息数据库', 'database', 'connected'],
      ['工商登记信息库', 'api', 'connected'],
      ['税务征信系统', 'database', 'connected'],
      ['银行征信数据库', 'database', 'connected'],
      ['人员社保信息库', 'database', 'connected'],
      ['司法执行信息库', 'api', 'connected'],
      ['专利商标数据库', 'api', 'connected'],
      ['招投标信息库', 'web_scraping', 'connected'],
      ['上市公司数据库', 'database', 'connected'],
      ['行业协会数据库', 'api', 'error'],
      ['第三方评级数据', 'api', 'connected'],
      ['新闻舆情数据库', 'web_scraping', 'connected'],
      ['政府采购数据库', 'api', 'disconnected'],
      ['供应商数据库', 'database', 'syncing'],
      ['客户关系数据库', 'database', 'connected']
    ];
    
    for (let i = 0; i < dataSources.length; i++) {
      const [name, type, status] = dataSources[i];
      
      const dataSource = {
        name: name,
        type: type,
        status: status,
        last_sync: generateRandomData.randomDate('2024-10-01', '2024-12-31'),
        total_records: generateRandomData.randomNumber(10000, 2000000),
        error_count: generateRandomData.randomNumber(0, 100),
        config: JSON.stringify({
          host: `db-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.internal`,
          port: generateRandomData.randomChoice([5432, 3306, 1521, 1433]),
          timeout: 30000
        }),
        created_at: generateRandomData.randomDate('2023-01-01', '2024-01-01'),
        updated_at: generateRandomData.randomDate('2024-10-01', '2024-12-31')
      };
      
      await client.query(`
        INSERT INTO data_sources (
          name, type, status, last_sync, total_records, error_count, config, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, Object.values(dataSource));
      
      console.log(`  ✅ 生成数据源: ${name}`);
    }
    console.log(`✅ 数据源生成完成: ${dataSources.length} 条`);
    
    // 5. 生成数据导入任务 (50条)
    console.log('\n📥 生成数据导入任务...');
    const taskCount = 50;
    
    // 获取数据源用于关联
    const dataSourceIds = await client.query('SELECT id, name FROM data_sources');
    
    for (let i = 1; i <= taskCount; i++) {
      const status = generateRandomData.randomChoice(['pending', 'running', 'completed', 'completed', 'completed', 'failed']);
      const totalRecords = generateRandomData.randomNumber(1000, 100000);
      const processedRecords = status === 'completed' ? totalRecords : 
                             status === 'running' ? Math.floor(totalRecords * Math.random()) :
                             status === 'failed' ? Math.floor(totalRecords * 0.3) : 0;
      
      const dataSource = generateRandomData.randomChoice(dataSourceIds.rows);
      
      const task = {
        name: `${generateRandomData.randomChoice(['企业信息', '客户数据', '关系数据', '财务数据', '风险数据'])}批量导入_${i}`,
        source_id: dataSource.id,
        source_name: dataSource.name,
        status: status,
        progress: status === 'completed' ? 100 : Math.floor((processedRecords / totalRecords) * 100),
        total_records: totalRecords,
        processed_records: processedRecords,
        error_records: status === 'failed' ? generateRandomData.randomNumber(1, 100) : 0,
        start_time: generateRandomData.randomDate('2024-01-01', '2024-12-31'),
        end_time: ['completed', 'failed'].includes(status) ? generateRandomData.randomDate('2024-01-01', '2024-12-31') : null,
        error_message: status === 'failed' ? `数据导入失败: ${generateRandomData.randomChoice(['连接超时', '数据格式错误', '权限不足', '系统异常'])}` : null,
        created_by: null, // 暂时设为null，实际应用中应该有用户ID
        created_at: generateRandomData.randomDate('2024-01-01', '2024-12-31')
      };
      
      await client.query(`
        INSERT INTO data_import_tasks (
          name, source_id, source_name, status, progress, total_records, 
          processed_records, error_records, start_time, end_time, 
          error_message, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, Object.values(task));
      
      if (i % 10 === 0) console.log(`  ✅ 已生成 ${i}/${taskCount} 个导入任务`);
    }
    console.log(`✅ 导入任务生成完成: ${taskCount} 条`);
    
    // 6. 最终统计
    console.log('\n==========================================');
    console.log('📊 最终数据统计：');
    
    const finalStats = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM enterprises'),
      client.query('SELECT COUNT(*) as count FROM clients'),
      client.query('SELECT COUNT(*) as count FROM relationships'),
      client.query('SELECT COUNT(*) as count FROM data_sources'),
      client.query('SELECT COUNT(*) as count FROM data_import_tasks')
    ]);
    
    console.log(`  🏢 企业数据: ${finalStats[0].rows[0].count} 条`);
    console.log(`  👥 客户数据: ${finalStats[1].rows[0].count} 条`);
    console.log(`  🔗 关系数据: ${finalStats[2].rows[0].count} 条`);
    console.log(`  💽 数据源: ${finalStats[3].rows[0].count} 条`);
    console.log(`  📥 导入任务: ${finalStats[4].rows[0].count} 条`);
    
    console.log('==========================================');
    console.log('🎉 完整测试数据生成成功！');
    
  } catch (error) {
    console.error('❌ 生成数据失败:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// 运行数据生成
generateFullTestData().catch(console.error);