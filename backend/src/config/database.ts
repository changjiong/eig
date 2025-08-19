import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// 数据库配置
export const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'eig_database',
  user: process.env.DB_USER || 'eig_user',
  password: process.env.DB_PASSWORD || 'eig_password',
  max: 20, // 连接池最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// 创建连接池
export const pool = new Pool(dbConfig);

// 连接池事件监听
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
  process.exit(-1);
});

// 测试数据库连接
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection test passed');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

// 初始化数据库表结构
export const initializeDatabase = async (): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 用户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'analyst', 'viewer')),
        permissions TEXT[] NOT NULL DEFAULT '{}',
        avatar TEXT,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 企业表
    await client.query(`
      CREATE TABLE IF NOT EXISTS enterprises (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(500) NOT NULL,
        legal_name VARCHAR(500),
        credit_code VARCHAR(100) UNIQUE,
        registration_number VARCHAR(100),
        industry VARCHAR(200),
        establish_date DATE,
        registered_capital DECIMAL(20, 2),
        business_scope TEXT,
        legal_representative VARCHAR(200),
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        website VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'dissolved')),
        risk_level VARCHAR(50) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
        svs DECIMAL(5, 2) DEFAULT 0.00,
        des DECIMAL(5, 2) DEFAULT 0.00,
        nis DECIMAL(5, 2) DEFAULT 0.00,
        pcs DECIMAL(5, 2) DEFAULT 0.00,
        supplier_count INTEGER DEFAULT 0,
        customer_count INTEGER DEFAULT 0,
        partner_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 客户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        company VARCHAR(500) NOT NULL,
        industry VARCHAR(200),
        position VARCHAR(200),
        email VARCHAR(255),
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'potential' CHECK (status IN ('active', 'inactive', 'potential', 'lost')),
        priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
        assigned_to UUID REFERENCES users(id),
        assigned_to_name VARCHAR(255),
        last_contact TIMESTAMP,
        next_follow_up TIMESTAMP,
        estimated_value DECIMAL(15, 2),
        notes TEXT,
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 关系表
    await client.query(`
      CREATE TABLE IF NOT EXISTS relationships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        from_id UUID NOT NULL,
        from_type VARCHAR(50) NOT NULL CHECK (from_type IN ('enterprise', 'person', 'product')),
        to_id UUID NOT NULL,
        to_type VARCHAR(50) NOT NULL CHECK (to_type IN ('enterprise', 'person', 'product')),
        relationship_type VARCHAR(100) NOT NULL CHECK (relationship_type IN ('investment', 'guarantee', 'supply', 'risk', 'employment', 'partnership', 'ownership', 'other')),
        strength DECIMAL(3, 2) DEFAULT 0.50 CHECK (strength >= 0 AND strength <= 1),
        is_directional BOOLEAN DEFAULT false,
        start_date DATE,
        end_date DATE,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 数据源表  
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('database', 'api', 'file', 'web_scraping')),
        status VARCHAR(50) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'syncing')),
        last_sync TIMESTAMP,
        total_records INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        config JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 数据导入任务表
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_import_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        source_id UUID REFERENCES data_sources(id),
        source_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        total_records INTEGER DEFAULT 0,
        processed_records INTEGER DEFAULT 0,
        error_records INTEGER DEFAULT 0,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        error_message TEXT,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 任务管理表
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL CHECK (type IN ('entity_review', 'relationship_review', 'event_verification', 'data_verification')),
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
        priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
        assignee_id UUID REFERENCES users(id),
        entity_id UUID, -- 关联的企业ID
        entity_type VARCHAR(50), -- 实体类型：enterprise, client, person等
        due_date TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);

    // 事件表（营销触发事件）
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('financing', 'investment', 'litigation', 'merger', 'partnership', 'regulation', 'other')),
        enterprise_id UUID REFERENCES enterprises(id),
        enterprise_name VARCHAR(255),
        date TIMESTAMP NOT NULL,
        importance INTEGER DEFAULT 50 CHECK (importance >= 0 AND importance <= 100),
        source VARCHAR(255),
        source_url TEXT,
        metadata JSONB DEFAULT '{}',
        is_processed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 潜客表
    await client.query(`
      CREATE TABLE IF NOT EXISTS prospects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        registered_capital BIGINT,
        employee_count INTEGER,
        svs DECIMAL(5,2) DEFAULT 0,
        des DECIMAL(5,2) DEFAULT 0,
        nis DECIMAL(5,2) DEFAULT 0,
        pcs DECIMAL(5,2) DEFAULT 0,
        discovery_path TEXT, -- 发现路径描述
        discovery_method VARCHAR(50), -- 发现方法：supply_chain, investment_network, industry_analysis等
        seed_enterprise_id UUID REFERENCES enterprises(id), -- 种子企业
        confidence_score DECIMAL(5,2) DEFAULT 0, -- 置信度
        status VARCHAR(50) DEFAULT 'discovered' CHECK (status IN ('discovered', 'contacted', 'interested', 'converted', 'rejected')),
        assigned_to UUID REFERENCES users(id),
        contact_info JSONB DEFAULT '{}',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 风险因子表
    await client.query(`
      CREATE TABLE IF NOT EXISTS risk_factors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL, -- guarantee_chain, financial, legal, policy, credit等
        level VARCHAR(20) NOT NULL CHECK (level IN ('none', 'low', 'medium', 'high', 'critical')),
        score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
        description TEXT,
        evidence TEXT, -- 风险证据
        impact_assessment TEXT, -- 影响评估
        mitigation_strategy TEXT, -- 缓解策略
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'resolved', 'false_positive')),
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 风险预警表
    await client.query(`
      CREATE TABLE IF NOT EXISTS risk_warnings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
        enterprise_name VARCHAR(500) NOT NULL,
        warning_type VARCHAR(50) NOT NULL CHECK (warning_type IN ('new_risk', 'risk_escalation', 'guarantee_chain', 'financial_anomaly')),
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
        message TEXT NOT NULL,
        risk_factor_id UUID REFERENCES risk_factors(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT false,
        resolved_at TIMESTAMP,
        resolved_by UUID REFERENCES users(id)
      );
    `);

    // 财务数据表
    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        quarter INTEGER CHECK (quarter >= 1 AND quarter <= 4), -- NULL表示年度数据
        revenue BIGINT DEFAULT 0, -- 营业收入（分）
        profit BIGINT DEFAULT 0, -- 净利润（分）
        gross_profit BIGINT DEFAULT 0, -- 毛利润（分）
        operating_income BIGINT DEFAULT 0, -- 营业利润（分）
        total_assets BIGINT DEFAULT 0, -- 总资产（分）
        total_liabilities BIGINT DEFAULT 0, -- 总负债（分）
        shareholders_equity BIGINT DEFAULT 0, -- 股东权益（分）
        cash_flow BIGINT DEFAULT 0, -- 现金流（分）
        debt_ratio DECIMAL(5,4), -- 资产负债率
        roe DECIMAL(5,4), -- 净资产收益率
        roa DECIMAL(5,4), -- 总资产收益率
        current_ratio DECIMAL(8,4), -- 流动比率
        quick_ratio DECIMAL(8,4), -- 速动比率
        data_source VARCHAR(100), -- 数据来源
        is_audited BOOLEAN DEFAULT false, -- 是否审计数据
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(enterprise_id, year, quarter)
      );
    `);

    // 新闻资讯表
    await client.query(`
      CREATE TABLE IF NOT EXISTS news (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(500) NOT NULL,
        content TEXT,
        summary TEXT,
        source VARCHAR(255),
        source_url TEXT,
        published_at TIMESTAMP,
        news_type VARCHAR(50) CHECK (news_type IN ('business', 'financing', 'partnership', 'legal', 'regulation', 'product', 'other')),
        enterprise_id UUID REFERENCES enterprises(id),
        person_id UUID, -- 关联人物ID（未来扩展）
        keywords TEXT[], -- 关键词数组
        sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')), -- 情感分析
        importance INTEGER DEFAULT 50 CHECK (importance >= 0 AND importance <= 100),
        is_verified BOOLEAN DEFAULT false, -- 是否已验证
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 产品推荐表
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
        product_id UUID, -- 产品ID（未来关联产品表）
        product_name VARCHAR(255) NOT NULL,
        product_type VARCHAR(100), -- 产品类型
        description TEXT,
        match_score INTEGER DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
        features TEXT[], -- 产品特点数组
        benefits TEXT[], -- 产品优势数组
        target_amount BIGINT, -- 目标金额（分）
        interest_rate_min DECIMAL(5,4), -- 最低利率
        interest_rate_max DECIMAL(5,4), -- 最高利率
        loan_term_months INTEGER, -- 贷款期限（月）
        eligibility_criteria TEXT, -- 准入条件
        recommendation_reason TEXT, -- 推荐理由
        priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 营销策略表
    await client.query(`
      CREATE TABLE IF NOT EXISTS marketing_strategies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        strategy_type VARCHAR(50), -- presentation, partnership, event, digital等
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        expected_outcome TEXT,
        expected_revenue BIGINT, -- 预期收入（分）
        execution_steps TEXT[], -- 执行步骤数组
        required_resources TEXT[], -- 所需资源
        timeline_weeks INTEGER, -- 执行时间周期（周）
        success_metrics TEXT, -- 成功指标
        status VARCHAR(50) DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'in_progress', 'completed', 'cancelled')),
        assigned_to UUID REFERENCES users(id),
        created_by UUID REFERENCES users(id),
        approved_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);

    // 关系路径表
    await client.query(`
      CREATE TABLE IF NOT EXISTS relationship_paths (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        path_type VARCHAR(50) NOT NULL, -- credit_path, recommendation_path, product_path等
        confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
        path_nodes JSONB NOT NULL, -- 路径节点JSON
        path_edges JSONB NOT NULL, -- 路径边JSON
        path_length INTEGER DEFAULT 0, -- 路径长度
        strength_score DECIMAL(5,2) DEFAULT 0, -- 路径强度评分
        business_value TEXT, -- 商业价值描述
        action_recommendation TEXT, -- 行动建议
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 用户配置表
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        notification_email BOOLEAN DEFAULT true,
        notification_browser BOOLEAN DEFAULT true,
        notification_mobile BOOLEAN DEFAULT false,
        notification_types JSONB DEFAULT '{}', -- 通知类型偏好
        theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
        language VARCHAR(10) DEFAULT 'zh-CN',
        date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
        timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
        dashboard_layout JSONB DEFAULT '{}', -- 仪表盘布局配置
        preferences JSONB DEFAULT '{}', -- 其他偏好设置
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 用户登录历史表
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_login_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT,
        device_type VARCHAR(50), -- desktop, mobile, tablet
        location VARCHAR(255), -- 地理位置
        success BOOLEAN DEFAULT true,
        failure_reason TEXT,
        session_duration INTEGER, -- 会话持续时间（秒）
        logout_time TIMESTAMP
      );
    `);
    
    // 创建索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_enterprises_name ON enterprises(name)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_enterprises_industry ON enterprises(industry)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_relationships_from_id ON relationships(from_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_relationships_to_id ON relationships(to_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_data_import_tasks_status ON data_import_tasks(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_data_import_tasks_created_by ON data_import_tasks(created_by)');
    
    // 新增表的索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_events_enterprise_id ON events(enterprise_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_prospects_assigned_to ON prospects(assigned_to)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_prospects_pcs ON prospects(pcs)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_risk_factors_enterprise_id ON risk_factors(enterprise_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_risk_factors_level ON risk_factors(level)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_risk_warnings_enterprise_id ON risk_warnings(enterprise_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_risk_warnings_severity ON risk_warnings(severity)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_risk_warnings_created_at ON risk_warnings(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_financial_data_enterprise_id ON financial_data(enterprise_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_financial_data_year ON financial_data(year)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_news_enterprise_id ON news(enterprise_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_product_recommendations_enterprise_id ON product_recommendations(enterprise_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_marketing_strategies_enterprise_id ON marketing_strategies(enterprise_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_marketing_strategies_status ON marketing_strategies(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_relationship_paths_enterprise_id ON relationship_paths(enterprise_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON user_login_history(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_login_history_login_time ON user_login_history(login_time)');
    
    await client.query('COMMIT');
    console.log('✅ Database tables initialized successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool; 