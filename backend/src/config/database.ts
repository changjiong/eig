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
    
    // 创建索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_enterprises_name ON enterprises(name)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_enterprises_industry ON enterprises(industry)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_relationships_from_id ON relationships(from_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_relationships_to_id ON relationships(to_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status)');
    
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