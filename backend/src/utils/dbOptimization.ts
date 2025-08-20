import { pool } from '../config/database';
import { logger } from '../middleware/logger';
import { QueryResult } from 'pg';

// 查询优化工具类
export class DatabaseOptimizer {
  
  // 分析慢查询
  static async analyzeSlowQueries(minDuration: number = 1000): Promise<any[]> {
    try {
      const query = `
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          max_time,
          min_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements 
        WHERE mean_time > $1
        ORDER BY mean_time DESC 
        LIMIT 20;
      `;
      
      const result = await pool.query(query, [minDuration]);
      return result.rows;
      
    } catch (error) {
      logger.error('Failed to analyze slow queries', { error });
      return [];
    }
  }

  // 分析表统计信息
  static async analyzeTableStats(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation,
          null_frac,
          avg_width,
          most_common_vals,
          most_common_freqs
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname;
      `;
      
      const result = await pool.query(query);
      return result.rows;
      
    } catch (error) {
      logger.error('Failed to analyze table stats', { error });
      return [];
    }
  }

  // 检查索引使用情况
  static async analyzeIndexUsage(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          t.tablename,
          indexname,
          c.reltuples AS num_rows,
          pg_size_pretty(pg_relation_size(quote_ident(t.tablename)::text)) AS table_size,
          pg_size_pretty(pg_relation_size(quote_ident(indexrelname)::text)) AS index_size,
          CASE WHEN indisunique THEN 'Y' ELSE 'N' END AS unique,
          idx_scan AS number_of_scans,
          idx_tup_read AS tuples_read,
          idx_tup_fetch AS tuples_fetched
        FROM pg_tables t
        LEFT OUTER JOIN pg_class c ON c.relname = t.tablename
        LEFT OUTER JOIN (
          SELECT 
            c.relname AS ctablename, 
            ipg.relname AS indexname, 
            x.indnatts AS number_of_columns, 
            idx_scan, 
            idx_tup_read, 
            idx_tup_fetch, 
            indexrelname, 
            indisunique 
          FROM pg_index x
          JOIN pg_class c ON c.oid = x.indrelid
          JOIN pg_class ipg ON ipg.oid = x.indexrelid
          JOIN pg_stat_all_indexes psai ON x.indexrelid = psai.indexrelid
        ) AS foo ON t.tablename = foo.ctablename
        WHERE t.schemaname = 'public'
        ORDER BY 1, 2;
      `;
      
      const result = await pool.query(query);
      return result.rows;
      
    } catch (error) {
      logger.error('Failed to analyze index usage', { error });
      return [];
    }
  }

  // 查找缺失的索引
  static async findMissingIndexes(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats
        WHERE schemaname = 'public'
          AND n_distinct > 10
          AND correlation < 0.9
          AND attname NOT IN (
            SELECT DISTINCT a.attname
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = (schemaname || '.' || tablename)::regclass
          )
        ORDER BY n_distinct DESC;
      `;
      
      const result = await pool.query(query);
      return result.rows;
      
    } catch (error) {
      logger.error('Failed to find missing indexes', { error });
      return [];
    }
  }

  // 分析锁等待
  static async analyzeLockWaits(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          bl.pid AS blocked_pid,
          bl.usename AS blocked_user,
          bl.query AS blocked_statement,
          bl.query_start,
          kl.pid AS blocking_pid,
          kl.usename AS blocking_user,
          kl.query AS blocking_statement,
          kl.query_start AS blocking_query_start
        FROM pg_stat_activity bl
        JOIN pg_locks blocked_locks ON bl.pid = blocked_locks.pid
        JOIN pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
          AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
          AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
          AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
          AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
          AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
          AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
          AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
          AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
          AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
          AND blocking_locks.pid != blocked_locks.pid
        JOIN pg_stat_activity kl ON kl.pid = blocking_locks.pid
        WHERE NOT blocked_locks.GRANTED;
      `;
      
      const result = await pool.query(query);
      return result.rows;
      
    } catch (error) {
      logger.error('Failed to analyze lock waits', { error });
      return [];
    }
  }

  // 优化查询计划
  static async explainQuery(query: string, analyze: boolean = false): Promise<any> {
    try {
      const explainQuery = analyze ? 
        `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}` :
        `EXPLAIN (FORMAT JSON) ${query}`;
      
      const result = await pool.query(explainQuery);
      return result.rows[0]['QUERY PLAN'];
      
    } catch (error) {
      logger.error('Failed to explain query', { error, query });
      throw error;
    }
  }

  // 更新表统计信息
  static async updateTableStatistics(tableName?: string): Promise<void> {
    try {
      const query = tableName ? 
        `ANALYZE ${tableName};` : 
        'ANALYZE;';
      
      await pool.query(query);
      
      logger.info('Table statistics updated', { tableName: tableName || 'all tables' });
      
    } catch (error) {
      logger.error('Failed to update table statistics', { error, tableName });
      throw error;
    }
  }

  // 重建索引
  static async reindexTable(tableName: string): Promise<void> {
    try {
      const query = `REINDEX TABLE ${tableName};`;
      await pool.query(query);
      
      logger.info('Table reindexed', { tableName });
      
    } catch (error) {
      logger.error('Failed to reindex table', { error, tableName });
      throw error;
    }
  }

  // 检查表膨胀
  static async checkTableBloat(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          current_database(), 
          schemaname, 
          tablename, 
          /*reltuples::bigint, 
          relpages::bigint, 
          otta,*/
          ROUND((CASE WHEN otta=0 THEN 0.0 ELSE sml.relpages::float/otta END)::numeric,1) AS tbloat,
          CASE WHEN relpages < otta THEN 0 ELSE bs*(sml.relpages-otta)::BIGINT END AS wastedbytes,
          iname, 
          /*ituples::bigint, 
          ipages::bigint, 
          iotta,*/
          ROUND((CASE WHEN iotta=0 OR ipages=0 THEN 0.0 ELSE ipages::float/iotta END)::numeric,1) AS ibloat,
          CASE WHEN ipages < iotta THEN 0 ELSE bs*(ipages-iotta) END AS wastedibytes
        FROM (
          SELECT 
            schemaname, 
            tablename, 
            cc.reltuples, 
            cc.relpages, 
            bs,
            CEIL((cc.reltuples*((datahdr+ma-
              (CASE WHEN datahdr%ma=0 THEN ma ELSE datahdr%ma END))+nullhdr2+4))/(bs-20::float)) AS otta,
            COALESCE(c2.relname,'?') AS iname, 
            COALESCE(c2.reltuples,0) AS ituples, 
            COALESCE(c2.relpages,0) AS ipages,
            COALESCE(CEIL((c2.reltuples*(datahdr-12))/(bs-20::float)),0) AS iotta
          FROM (
            SELECT
              ma,bs,schemaname,tablename,
              (datawidth+(hdr+ma-(case when hdr%ma=0 THEN ma ELSE hdr%ma END)))::numeric AS datahdr,
              (maxfracsum*(nullhdr+ma-(case when nullhdr%ma=0 THEN ma ELSE nullhdr%ma END))) AS nullhdr2
            FROM (
              SELECT
                schemaname, tablename, hdr, ma, bs,
                SUM((1-null_frac)*avg_width) AS datawidth,
                MAX(null_frac) AS maxfracsum,
                hdr+(
                  SELECT 1+count(*)/8
                  FROM pg_stats s2
                  WHERE null_frac<>0 AND s2.schemaname = s.schemaname AND s2.tablename = s.tablename
                ) AS nullhdr
              FROM pg_stats s, (
                SELECT
                  (SELECT current_setting('block_size')::numeric) AS bs,
                  CASE WHEN substring(v,12,3) IN ('8.0','8.1','8.2') THEN 27 ELSE 23 END AS hdr,
                  CASE WHEN v ~ 'mingw32' THEN 8 ELSE 4 END AS ma
                FROM (SELECT version() AS v) AS foo
              ) AS constants
              WHERE schemaname='public'
              GROUP BY 1,2,3,4,5
            ) AS foo
          ) AS rs
          JOIN pg_class cc ON cc.relname = rs.tablename
          JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = rs.schemaname AND nn.nspname <> 'information_schema'
          LEFT JOIN pg_index i ON indrelid = cc.oid
          LEFT JOIN pg_class c2 ON c2.oid = i.indexrelid
        ) AS sml
        WHERE sml.relpages - otta > 128
        ORDER BY wastedbytes DESC;
      `;
      
      const result = await pool.query(query);
      return result.rows;
      
    } catch (error) {
      logger.error('Failed to check table bloat', { error });
      return [];
    }
  }

  // 获取数据库连接统计
  static async getConnectionStats(): Promise<any> {
    try {
      const query = `
        SELECT 
          state,
          count(*) as count,
          max(now() - query_start) as max_duration,
          avg(now() - query_start) as avg_duration
        FROM pg_stat_activity
        WHERE pid <> pg_backend_pid()
        GROUP BY state
        ORDER BY count DESC;
      `;
      
      const result = await pool.query(query);
      return {
        connections: result.rows,
        total: result.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
      };
      
    } catch (error) {
      logger.error('Failed to get connection stats', { error });
      return { connections: [], total: 0 };
    }
  }

  // 性能调优建议
  static async getPerformanceTuningRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    
    try {
      // 检查慢查询
      const slowQueries = await this.analyzeSlowQueries(1000);
      if (slowQueries.length > 0) {
        recommendations.push(`发现 ${slowQueries.length} 个慢查询，建议优化SQL或添加索引`);
      }

      // 检查未使用的索引
      const indexUsage = await this.analyzeIndexUsage();
      const unusedIndexes = indexUsage.filter(idx => idx.number_of_scans === 0);
      if (unusedIndexes.length > 0) {
        recommendations.push(`发现 ${unusedIndexes.length} 个未使用的索引，建议删除以节省空间`);
      }

      // 检查表膨胀
      const bloatedTables = await this.checkTableBloat();
      const highBloatTables = bloatedTables.filter(table => table.tbloat > 2);
      if (highBloatTables.length > 0) {
        recommendations.push(`发现 ${highBloatTables.length} 个表存在严重膨胀，建议执行VACUUM FULL`);
      }

      // 检查连接数
      const connectionStats = await this.getConnectionStats();
      if (connectionStats.total > 80) {
        recommendations.push('数据库连接数较高，建议检查连接池配置或优化应用程序连接管理');
      }

    } catch (error) {
      logger.error('Failed to generate performance recommendations', { error });
    }
    
    return recommendations;
  }
}

// 查询构建器类
export class QueryBuilder {
  private query: string = '';
  private params: any[] = [];
  private paramCount: number = 0;

  select(columns: string | string[]): this {
    const cols = Array.isArray(columns) ? columns.join(', ') : columns;
    this.query += `SELECT ${cols}`;
    return this;
  }

  from(table: string): this {
    this.query += ` FROM ${table}`;
    return this;
  }

  where(condition: string, value?: any): this {
    const prefix = this.query.includes('WHERE') ? ' AND' : ' WHERE';
    
    if (value !== undefined) {
      this.paramCount++;
      this.query += `${prefix} ${condition.replace('?', `$${this.paramCount}`)}`;
      this.params.push(value);
    } else {
      this.query += `${prefix} ${condition}`;
    }
    
    return this;
  }

  whereIn(column: string, values: any[]): this {
    if (values.length === 0) return this;
    
    const prefix = this.query.includes('WHERE') ? ' AND' : ' WHERE';
    const placeholders = values.map(() => {
      this.paramCount++;
      return `$${this.paramCount}`;
    }).join(', ');
    
    this.query += `${prefix} ${column} IN (${placeholders})`;
    this.params.push(...values);
    
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    const prefix = this.query.includes('ORDER BY') ? ',' : ' ORDER BY';
    this.query += `${prefix} ${column} ${direction}`;
    return this;
  }

  limit(count: number): this {
    this.paramCount++;
    this.query += ` LIMIT $${this.paramCount}`;
    this.params.push(count);
    return this;
  }

  offset(count: number): this {
    this.paramCount++;
    this.query += ` OFFSET $${this.paramCount}`;
    this.params.push(count);
    return this;
  }

  join(table: string, condition: string): this {
    this.query += ` JOIN ${table} ON ${condition}`;
    return this;
  }

  leftJoin(table: string, condition: string): this {
    this.query += ` LEFT JOIN ${table} ON ${condition}`;
    return this;
  }

  groupBy(columns: string | string[]): this {
    const cols = Array.isArray(columns) ? columns.join(', ') : columns;
    this.query += ` GROUP BY ${cols}`;
    return this;
  }

  having(condition: string, value?: any): this {
    const prefix = this.query.includes('HAVING') ? ' AND' : ' HAVING';
    
    if (value !== undefined) {
      this.paramCount++;
      this.query += `${prefix} ${condition.replace('?', `$${this.paramCount}`)}`;
      this.params.push(value);
    } else {
      this.query += `${prefix} ${condition}`;
    }
    
    return this;
  }

  build(): { query: string; params: any[] } {
    return {
      query: this.query,
      params: this.params
    };
  }

  async execute(): Promise<QueryResult> {
    const { query, params } = this.build();
    return await pool.query(query, params);
  }
}

// 缓存管理类
export class QueryCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  static set(key: string, data: any, ttlMs: number = 300000): void { // 默认5分钟
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  static get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  static clear(): void {
    this.cache.clear();
  }
  
  static cleanup(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 定期清理缓存
setInterval(() => {
  QueryCache.cleanup();
}, 60000); // 每分钟清理一次

export default DatabaseOptimizer;