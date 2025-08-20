import { pool } from '../config/database';

// 全局测试设置
beforeAll(async () => {
  // 连接测试数据库
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // 清理连接
  await pool.end();
  console.log('Test environment cleaned up.');
});

// 每个测试前重置数据库状态
beforeEach(async () => {
  // 可以在这里清理测试数据
});

afterEach(async () => {
  // 测试后清理
});