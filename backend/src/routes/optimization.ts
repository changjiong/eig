import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { DatabaseOptimizer, QueryBuilder, QueryCache } from '../utils/dbOptimization';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';

const router = Router();

// 获取数据库性能分析报告
router.get('/performance-report', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const report = {
    slowQueries: await DatabaseOptimizer.analyzeSlowQueries(1000),
    indexUsage: await DatabaseOptimizer.analyzeIndexUsage(),
    tableBloat: await DatabaseOptimizer.checkTableBloat(),
    connectionStats: await DatabaseOptimizer.getConnectionStats(),
    recommendations: await DatabaseOptimizer.getPerformanceTuningRecommendations()
  };

  res.json({
    success: true,
    data: report,
    timestamp: new Date().toISOString()
  });
}));

// 分析慢查询
router.get('/slow-queries', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const minDuration = parseInt(req.query.minDuration as string) || 1000;
  const slowQueries = await DatabaseOptimizer.analyzeSlowQueries(minDuration);

  res.json({
    success: true,
    data: {
      minDuration,
      queries: slowQueries
    },
    timestamp: new Date().toISOString()
  });
}));

// 分析索引使用情况
router.get('/index-usage', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const indexUsage = await DatabaseOptimizer.analyzeIndexUsage();
  
  // 分类索引
  const analysis = {
    totalIndexes: indexUsage.length,
    unusedIndexes: indexUsage.filter(idx => parseInt(idx.number_of_scans) === 0),
    lowUsageIndexes: indexUsage.filter(idx => {
      const scans = parseInt(idx.number_of_scans);
      return scans > 0 && scans < 100;
    }),
    highUsageIndexes: indexUsage.filter(idx => parseInt(idx.number_of_scans) >= 1000)
  };

  res.json({
    success: true,
    data: {
      analysis,
      details: indexUsage
    },
    timestamp: new Date().toISOString()
  });
}));

// 分析表统计信息
router.get('/table-stats', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const tableStats = await DatabaseOptimizer.analyzeTableStats();

  res.json({
    success: true,
    data: tableStats,
    timestamp: new Date().toISOString()
  });
}));

// 检查表膨胀
router.get('/table-bloat', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const bloatData = await DatabaseOptimizer.checkTableBloat();
  
  const analysis = {
    totalTables: bloatData.length,
    highBloatTables: bloatData.filter(table => parseFloat(table.tbloat) > 2),
    moderateBloatTables: bloatData.filter(table => {
      const bloat = parseFloat(table.tbloat);
      return bloat > 1.5 && bloat <= 2;
    }),
    healthyTables: bloatData.filter(table => parseFloat(table.tbloat) <= 1.5)
  };

  res.json({
    success: true,
    data: {
      analysis,
      details: bloatData
    },
    timestamp: new Date().toISOString()
  });
}));

// 查找缺失的索引
router.get('/missing-indexes', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const missingIndexes = await DatabaseOptimizer.findMissingIndexes();

  res.json({
    success: true,
    data: {
      suggestions: missingIndexes,
      count: missingIndexes.length
    },
    timestamp: new Date().toISOString()
  });
}));

// 分析锁等待
router.get('/lock-waits', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const lockWaits = await DatabaseOptimizer.analyzeLockWaits();

  res.json({
    success: true,
    data: {
      activeBlocks: lockWaits,
      count: lockWaits.length,
      hasIssues: lockWaits.length > 0
    },
    timestamp: new Date().toISOString()
  });
}));

// 获取连接统计
router.get('/connections', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const connectionStats = await DatabaseOptimizer.getConnectionStats();

  res.json({
    success: true,
    data: connectionStats,
    timestamp: new Date().toISOString()
  });
}));

// 解释查询计划
router.post('/explain', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { query, analyze = false } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: '请提供要分析的SQL查询',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const queryPlan = await DatabaseOptimizer.explainQuery(query, analyze);

    logger.info('Query explained', {
      userId: req.user?.id,
      query: query.substring(0, 100) + '...',
      analyze
    });

    return res.json({
      success: true,
      data: {
        query,
        plan: queryPlan,
        analyzed: analyze
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: '查询分析失败: ' + (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
}));

// 更新表统计信息
router.post('/analyze-table', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { tableName } = req.body;

  try {
    await DatabaseOptimizer.updateTableStatistics(tableName);

    logger.info('Table statistics updated', {
      userId: req.user?.id,
      tableName: tableName || 'all tables'
    });

    res.json({
      success: true,
      message: tableName ? `表 ${tableName} 的统计信息已更新` : '所有表的统计信息已更新',
      data: { tableName },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新统计信息失败: ' + (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
}));

// 重建索引
router.post('/reindex', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { tableName } = req.body;

  if (!tableName) {
    return res.status(400).json({
      success: false,
      message: '请提供表名',
      timestamp: new Date().toISOString()
    });
  }

  try {
    await DatabaseOptimizer.reindexTable(tableName);

    logger.info('Table reindexed', {
      userId: req.user?.id,
      tableName
    });

    return res.json({
      success: true,
      message: `表 ${tableName} 的索引已重建`,
      data: { tableName },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '重建索引失败: ' + (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
}));

// 获取性能调优建议
router.get('/recommendations', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const recommendations = await DatabaseOptimizer.getPerformanceTuningRecommendations();

  res.json({
    success: true,
    data: {
      recommendations,
      count: recommendations.length,
      generatedAt: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
}));

// 查询缓存管理
router.get('/cache/status', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  // 由于QueryCache是内存中的Map，我们需要通过反射或其他方式获取信息
  // 这里提供基本的缓存状态信息
  
  res.json({
    success: true,
    data: {
      message: '查询缓存正在运行',
      status: 'active'
    },
    timestamp: new Date().toISOString()
  });
}));

// 清空查询缓存
router.post('/cache/clear', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  QueryCache.clear();

  logger.info('Query cache cleared', {
    userId: req.user?.id
  });

  res.json({
    success: true,
    message: '查询缓存已清空',
    timestamp: new Date().toISOString()
  });
}));

// 执行优化的查询（使用QueryBuilder）
router.post('/query', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { table, columns, conditions, orderBy, limit, offset } = req.body;

  if (!table) {
    return res.status(400).json({
      success: false,
      message: '请提供表名',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const queryBuilder = new QueryBuilder()
      .select(columns || '*')
      .from(table);

    // 添加条件
    if (conditions && Array.isArray(conditions)) {
      conditions.forEach(condition => {
        if (condition.column && condition.operator && condition.value !== undefined) {
          queryBuilder.where(`${condition.column} ${condition.operator} ?`, condition.value);
        }
      });
    }

    // 添加排序
    if (orderBy) {
      queryBuilder.orderBy(orderBy.column, orderBy.direction);
    }

    // 添加分页
    if (limit) queryBuilder.limit(limit);
    if (offset) queryBuilder.offset(offset);

    const result = await queryBuilder.execute();

    logger.info('Optimized query executed', {
      userId: req.user?.id,
      table,
      rowCount: result.rowCount
    });

    return res.json({
      success: true,
      data: {
        rows: result.rows,
        count: result.rowCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '查询执行失败: ' + (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
}));

// 数据库健康评分
router.get('/health-score', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const [
      slowQueries,
      indexUsage,
      tableBloat,
      connectionStats
    ] = await Promise.all([
      DatabaseOptimizer.analyzeSlowQueries(1000),
      DatabaseOptimizer.analyzeIndexUsage(),
      DatabaseOptimizer.checkTableBloat(),
      DatabaseOptimizer.getConnectionStats()
    ]);

    // 计算健康评分 (0-100)
    let score = 100;
    const issues = [];

    // 慢查询扣分
    if (slowQueries.length > 0) {
      const deduction = Math.min(slowQueries.length * 5, 30);
      score -= deduction;
      issues.push(`${slowQueries.length} 个慢查询`);
    }

    // 未使用索引扣分
    const unusedIndexes = indexUsage.filter(idx => parseInt(idx.number_of_scans) === 0);
    if (unusedIndexes.length > 0) {
      const deduction = Math.min(unusedIndexes.length * 2, 20);
      score -= deduction;
      issues.push(`${unusedIndexes.length} 个未使用的索引`);
    }

    // 表膨胀扣分
    const bloatedTables = tableBloat.filter(table => parseFloat(table.tbloat) > 2);
    if (bloatedTables.length > 0) {
      const deduction = Math.min(bloatedTables.length * 3, 25);
      score -= deduction;
      issues.push(`${bloatedTables.length} 个膨胀表`);
    }

    // 连接数扣分
    if (connectionStats.total > 80) {
      score -= 15;
      issues.push('数据库连接数过高');
    }

    score = Math.max(0, score);

    const healthStatus = score >= 80 ? 'excellent' :
                        score >= 60 ? 'good' :
                        score >= 40 ? 'fair' : 'poor';

    res.json({
      success: true,
      data: {
        score,
        status: healthStatus,
        issues,
        details: {
          slowQueriesCount: slowQueries.length,
          unusedIndexesCount: unusedIndexes.length,
          bloatedTablesCount: bloatedTables.length,
          totalConnections: connectionStats.total
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '健康评分计算失败: ' + (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
}));

export default router;