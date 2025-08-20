import { Pool } from 'pg';
import { dbConfig } from '../../config/database';

export default async function globalSetup() {
  console.log('Setting up integration test environment...');
  
  // 创建测试数据库连接
  const pool = new Pool({
    ...dbConfig,
    database: process.env.TEST_DB_NAME || 'eig_test_db'
  });

  try {
    // 创建测试数据库（如果不存在）
    const adminPool = new Pool({
      ...dbConfig,
      database: 'postgres' // 连接默认数据库
    });

    try {
      await adminPool.query(`CREATE DATABASE ${process.env.TEST_DB_NAME || 'eig_test_db'}`);
      console.log('Test database created successfully');
    } catch (error: any) {
      if (error.code !== '42P04') { // Database already exists
        console.error('Error creating test database:', error);
      }
    } finally {
      await adminPool.end();
    }

    // 初始化测试数据库表结构
    await initializeTestDatabase(pool);
    
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function initializeTestDatabase(pool: Pool) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 创建用户表
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
    
    // 创建企业表
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

    // 创建其他必要的表...
    // 这里可以添加更多表的创建语句
    
    await client.query('COMMIT');
    console.log('Test database tables initialized successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Test database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}