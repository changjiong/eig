import { Pool } from 'pg';
import { dbConfig } from '../../config/database';

export default async function globalTeardown() {
  console.log('Cleaning up integration test environment...');
  
  try {
    // 连接到默认数据库
    const adminPool = new Pool({
      ...dbConfig,
      database: 'postgres'
    });

    // 断开所有测试数据库的连接
    const testDbName = process.env.TEST_DB_NAME || 'eig_test_db';
    
    await adminPool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid()
    `, [testDbName]);

    // 删除测试数据库（可选）
    if (process.env.CLEANUP_TEST_DB === 'true') {
      await adminPool.query(`DROP DATABASE IF EXISTS ${testDbName}`);
      console.log('Test database dropped successfully');
    }
    
    await adminPool.end();
    
  } catch (error) {
    console.error('Global teardown failed:', error);
  }
}