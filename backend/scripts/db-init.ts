#!/usr/bin/env ts-node

import { testConnection, initializeDatabase } from '../src/config/database';
import { seedDatabase } from '../src/config/seedData';

/**
 * 数据库初始化脚本
 * 该脚本将：
 * 1. 测试数据库连接
 * 2. 创建所有必需的数据库表
 * 3. 插入种子数据
 */
async function initDatabase() {
  console.log('🚀 开始数据库初始化...');
  
  try {
    // 1. 测试数据库连接
    console.log('🔍 测试数据库连接...');
    const connectionTest = await testConnection();
    if (!connectionTest) {
      console.error('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }
    
    // 2. 初始化数据库表结构
    console.log('📋 初始化数据库表结构...');
    await initializeDatabase();
    
    // 3. 插入种子数据
    console.log('🌱 插入种子数据...');
    await seedDatabase();
    
    console.log('🎉 数据库初始化完成！');
    console.log('\n📝 接下来你可以：');
    console.log('1. 启动后端服务: npm run dev');
    console.log('2. 使用以下测试账号登录:');
    console.log('   - 管理员: admin@eig.com / admin123');
    console.log('   - 经理: manager@eig.com / manager123');
    console.log('   - 分析师: analyst@eig.com / analyst123');
    console.log('   - 查看员: viewer@eig.com / viewer123');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    console.error('\n🔧 可能的解决方案:');
    console.error('1. 确保PostgreSQL已安装并运行');
    console.error('2. 检查.env配置文件中的数据库连接参数');
    console.error('3. 确保数据库用户有足够的权限');
    console.error('4. 确保指定的数据库已存在');
    process.exit(1);
  }
  
  process.exit(0);
}

// 执行初始化
initDatabase(); 