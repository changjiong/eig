import bcrypt from 'bcryptjs';
import pool from './database';
import appConfig from './app';

// 种子数据：用户
const seedUsers = [
  {
    email: 'admin@eig.com',
    password: 'admin123',
    name: '系统管理员',
    department: 'IT部门',
    role: 'admin',
    permissions: [
      'view_dashboard', 'view_enterprise', 'view_graph', 'view_prospects',
      'view_search', 'view_clients', 'manage_data', 'manage_system',
      'export_data', 'import_data', 'user_management'
    ]
  },
  {
    email: 'manager@eig.com',
    password: 'manager123',
    name: '业务经理',
    department: '业务部门',
    role: 'manager',
    permissions: [
      'view_dashboard', 'view_enterprise', 'view_graph', 'view_prospects',
      'view_search', 'view_clients', 'manage_data', 'export_data', 'import_data'
    ]
  },
  {
    email: 'analyst@eig.com',
    password: 'analyst123',
    name: '数据分析师',
    department: '数据分析部',
    role: 'analyst',
    permissions: [
      'view_dashboard', 'view_enterprise', 'view_graph', 'view_prospects',
      'view_search', 'view_clients', 'export_data'
    ]
  },
  {
    email: 'viewer@eig.com',
    password: 'viewer123',
    name: '客户经理',
    department: '销售部门',
    role: 'viewer',
    permissions: [
      'view_dashboard', 'view_enterprise', 'view_graph', 'view_prospects', 'view_search'
    ]
  }
];

// 种子数据：企业
const seedEnterprises = [
  {
    name: '华为技术有限公司',
    legal_name: '华为技术有限公司',
    credit_code: '91440300779711838H',
    registration_number: '440300000061832',
    industry: '信息技术',
    establish_date: '1987-09-15',
    registered_capital: 40000000000.00,
    business_scope: '通信设备研发、生产、销售',
    legal_representative: '任正非',
    address: '广东省深圳市龙岗区坂田街道华为基地',
    phone: '0755-28560000',
    email: 'contact@huawei.com',
    website: 'https://www.huawei.com',
    status: 'active',
    risk_level: 'low',
    svs: 95.5,
    des: 92.3,
    nis: 88.7,
    pcs: 94.2
  },
  {
    name: '腾讯控股有限公司',
    legal_name: '腾讯控股有限公司',
    credit_code: '91440300708461136T',
    registration_number: '440300000025945',
    industry: '互联网',
    establish_date: '1998-11-11',
    registered_capital: 50000000000.00,
    business_scope: '互联网服务、软件开发、游戏开发',
    legal_representative: '马化腾',
    address: '广东省深圳市南山区科技园腾讯大厦',
    phone: '0755-86013388',
    email: 'info@tencent.com',
    website: 'https://www.tencent.com',
    status: 'active',
    risk_level: 'low',
    svs: 98.2,
    des: 95.8,
    nis: 94.3,
    pcs: 96.7
  },
  {
    name: '阿里巴巴集团控股有限公司',
    legal_name: '阿里巴巴集团控股有限公司',
    credit_code: '91330100MA27XKU15J',
    registration_number: '330100000151234',
    industry: '电子商务',
    establish_date: '1999-06-28',
    registered_capital: 60000000000.00,
    business_scope: '电子商务平台、云计算服务、金融服务',
    legal_representative: '张勇',
    address: '浙江省杭州市西湖区文三西路969号',
    phone: '0571-85022088',
    email: 'contact@alibaba.com',
    website: 'https://www.alibaba.com',
    status: 'active',
    risk_level: 'low',
    svs: 97.8,
    des: 94.2,
    nis: 96.1,
    pcs: 95.5
  },
  {
    name: '中国银行股份有限公司',
    legal_name: '中国银行股份有限公司',
    credit_code: '9111000010000164XY',
    registration_number: '110000001000016',
    industry: '金融服务',
    establish_date: '1912-02-05',
    registered_capital: 294388000000.00,
    business_scope: '银行业务、投资银行、保险业务',
    legal_representative: '刘连舸',
    address: '北京市西城区复兴门内大街1号',
    phone: '010-66596688',
    email: 'service@boc.cn',
    website: 'https://www.boc.cn',
    status: 'active',
    risk_level: 'low',
    svs: 93.4,
    des: 96.7,
    nis: 91.8,
    pcs: 92.9
  }
];

// 种子数据：客户
const seedClients = [
  {
    name: '张三',
    company: '北京科技有限公司',
    industry: '信息技术',
    position: '技术总监',
    email: 'zhangsan@bjkj.com',
    phone: '13800138001',
    status: 'active',
    priority: 'high',
    last_contact: '2025-01-10',
    next_follow_up: '2025-01-20',
    estimated_value: 500000.00,
    notes: '对我们的产品很感兴趣，正在评估中',
    tags: ['技术决策者', '重点客户']
  },
  {
    name: '李四',
    company: '上海贸易公司',
    industry: '贸易',
    position: '采购经理',
    email: 'lisi@shmygs.com',
    phone: '13800138002',
    status: 'potential',
    priority: 'medium',
    last_contact: '2025-01-08',
    next_follow_up: '2025-01-18',
    estimated_value: 200000.00,
    notes: '需要进一步了解产品细节',
    tags: ['采购决策者']
  },
  {
    name: '王五',
    company: '广州制造企业',
    industry: '制造业',
    position: 'CEO',
    email: 'wangwu@gzzz.com',
    phone: '13800138003',
    status: 'inactive',
    priority: 'low',
    last_contact: '2024-12-15',
    next_follow_up: '2025-02-01',
    estimated_value: 100000.00,
    notes: '暂时没有采购计划',
    tags: ['高管']
  }
];

// 种子数据：关系
const seedRelationships = [
  {
    from_type: 'enterprise',
    to_type: 'enterprise',
    relationship_type: 'partnership',
    strength: 0.85,
    is_directional: false,
    description: '战略合作伙伴关系'
  },
  {
    from_type: 'enterprise',
    to_type: 'enterprise', 
    relationship_type: 'supply',
    strength: 0.75,
    is_directional: true,
    description: '供应商关系'
  },
  {
    from_type: 'enterprise',
    to_type: 'enterprise',
    relationship_type: 'investment',
    strength: 0.90,
    is_directional: true,
    description: '投资关系'
  }
];

// 种子数据：数据源
const seedDataSources = [
  {
    name: '企业工商数据',
    type: 'api',
    status: 'connected',
    total_records: 50000,
    error_count: 0,
    config: {
      api_url: 'https://api.qichacha.com',
      api_key: 'demo_key',
      sync_interval: '24h'
    }
  },
  {
    name: '银行征信数据',
    type: 'database',
    status: 'connected',
    total_records: 30000,
    error_count: 5,
    config: {
      host: 'db.bank.com',
      database: 'credit_db',
      table: 'enterprise_credit'
    }
  },
  {
    name: '行业报告数据',
    type: 'file',
    status: 'disconnected',
    total_records: 0,
    error_count: 0,
    config: {
      file_path: '/data/reports/',
      file_format: 'xlsx',
      auto_import: true
    }
  }
];

// 执行种子数据插入
export const seedDatabase = async (): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 开始插入种子数据...');
    
    // 检查是否已有数据
    const existingUsers = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      console.log('📊 数据库中已有数据，跳过种子数据插入');
      await client.query('ROLLBACK');
      return;
    }
    
    // 插入用户数据
    console.log('👥 插入用户数据...');
    for (const user of seedUsers) {
      const passwordHash = await bcrypt.hash(user.password, appConfig.security.saltRounds);
      
      await client.query(`
        INSERT INTO users (email, password_hash, name, department, role, permissions, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
      `, [
        user.email,
        passwordHash,
        user.name,
        user.department,
        user.role,
        user.permissions
      ]);
    }
    
    // 插入企业数据
    console.log('🏢 插入企业数据...');
    const enterpriseIds: string[] = [];
    for (const enterprise of seedEnterprises) {
      const result = await client.query(`
        INSERT INTO enterprises (
          name, legal_name, credit_code, registration_number, industry,
          establish_date, registered_capital, business_scope, legal_representative,
          address, phone, email, website, status, risk_level, svs, des, nis, pcs
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id
      `, [
        enterprise.name, enterprise.legal_name, enterprise.credit_code,
        enterprise.registration_number, enterprise.industry, enterprise.establish_date,
        enterprise.registered_capital, enterprise.business_scope, enterprise.legal_representative,
        enterprise.address, enterprise.phone, enterprise.email, enterprise.website,
        enterprise.status, enterprise.risk_level, enterprise.svs, enterprise.des,
        enterprise.nis, enterprise.pcs
      ]);
      
      enterpriseIds.push(result.rows[0].id);
    }
    
    // 获取管理员用户ID用于客户数据
    const adminUser = await client.query('SELECT id, name FROM users WHERE role = $1 LIMIT 1', ['admin']);
    const adminId = adminUser.rows[0].id;
    const adminName = adminUser.rows[0].name;
    
    // 插入客户数据
    console.log('👤 插入客户数据...');
    for (const clientData of seedClients) {
      await client.query(`
        INSERT INTO clients (
          name, company, industry, position, email, phone, status, priority,
          assigned_to, assigned_to_name, last_contact, next_follow_up,
          estimated_value, notes, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        clientData.name, clientData.company, clientData.industry, clientData.position,
        clientData.email, clientData.phone, clientData.status, clientData.priority,
        adminId, adminName, clientData.last_contact, clientData.next_follow_up,
        clientData.estimated_value, clientData.notes, clientData.tags
      ]);
    }
    
    // 插入关系数据
    console.log('🔗 插入关系数据...');
    for (let i = 0; i < seedRelationships.length; i++) {
      const relationship = seedRelationships[i];
      const fromId = enterpriseIds[i % enterpriseIds.length];
      const toId = enterpriseIds[(i + 1) % enterpriseIds.length];
      
      await client.query(`
        INSERT INTO relationships (
          from_id, from_type, to_id, to_type, relationship_type,
          strength, is_directional, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        fromId, relationship.from_type, toId, relationship.to_type,
        relationship.relationship_type, relationship.strength,
        relationship.is_directional, relationship.description
      ]);
    }
    
    // 插入数据源数据
    console.log('📊 插入数据源数据...');
    for (const dataSource of seedDataSources) {
      await client.query(`
        INSERT INTO data_sources (name, type, status, total_records, error_count, config)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        dataSource.name, dataSource.type, dataSource.status,
        dataSource.total_records, dataSource.error_count, dataSource.config
      ]);
    }
    
    await client.query('COMMIT');
    console.log('✅ 种子数据插入完成！');
    console.log(`
📋 种子数据统计：
- 用户: ${seedUsers.length} 个
- 企业: ${seedEnterprises.length} 个  
- 客户: ${seedClients.length} 个
- 关系: ${seedRelationships.length} 个
- 数据源: ${seedDataSources.length} 个

🔑 测试账号信息：
- 管理员: admin@eig.com / admin123
- 经理: manager@eig.com / manager123  
- 分析师: analyst@eig.com / analyst123
- 查看员: viewer@eig.com / viewer123
    `);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 种子数据插入失败:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default seedDatabase; 