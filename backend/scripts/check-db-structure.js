const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'eig_database',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkTableStructures() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 检查数据库表结构...');
    console.log('========================================');
    
    // 获取所有表名
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`\n📊 表: ${tableName}`);
      console.log('------------------------');
      
      // 获取表结构
      const columnsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      const tableFields = [];
      columnsResult.rows.forEach((col, index) => {
        const nullable = col.is_nullable === 'YES' ? '(可空)' : '(必填)';
        const length = col.character_maximum_length ? `[${col.character_maximum_length}]` : '';
        const precision = col.numeric_precision ? `(${col.numeric_precision}${col.numeric_scale ? ',' + col.numeric_scale : ''})` : '';
        const defaultVal = col.column_default ? ` 默认:${col.column_default}` : '';
        
        console.log(`  ${index + 1}. ${col.column_name}: ${col.data_type}${length}${precision} ${nullable}${defaultVal}`);
        
        tableFields.push({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
          maxLength: col.character_maximum_length
        });
      });
      
      // 获取当前数据量
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        console.log(`  📈 当前数据量: ${countResult.rows[0].count} 条`);
      } catch (err) {
        console.log(`  📈 当前数据量: 查询失败`);
      }
      
      // 保存表结构信息到全局对象
      global.tableStructures = global.tableStructures || {};
      global.tableStructures[tableName] = tableFields;
    }
    
    console.log('========================================');
    console.log('✅ 表结构检查完成');
    
  } catch (error) {
    console.error('❌ 检查表结构失败:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  checkTableStructures().catch(console.error);
}

module.exports = { checkTableStructures }; 