import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { metricsStore, systemMonitor, getHealthStatus } from '../middleware/monitoring';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';

const router = Router();

// 健康检查端点（公开）
router.get('/health', (req: Request, res: Response) => {
  const healthStatus = getHealthStatus();
  res.json({
    success: true,
    data: healthStatus,
    timestamp: new Date().toISOString()
  });
});

// 系统状态端点（需要管理员权限）
router.get('/status', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const report = systemMonitor.getMonitoringReport();
  
  res.json({
    success: true,
    data: report,
    timestamp: new Date().toISOString()
  });
}));

// 获取实时指标
router.get('/metrics', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const currentMetrics = metricsStore.getCurrentSystemMetrics();
  
  res.json({
    success: true,
    data: currentMetrics,
    timestamp: new Date().toISOString()
  });
}));

// 获取API统计
router.get('/api-stats', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const apiStats = metricsStore.getApiStats();
  
  res.json({
    success: true,
    data: apiStats,
    timestamp: new Date().toISOString()
  });
}));

// 获取历史数据
router.get('/historical', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const minutes = parseInt(req.query.minutes as string) || 60;
  const historicalData = metricsStore.getHistoricalData(minutes);
  
  res.json({
    success: true,
    data: historicalData,
    timestamp: new Date().toISOString()
  });
}));

// 获取系统信息
router.get('/system-info', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const systemInfo = {
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale
    },
    package: {
      name: 'eig-backend',
      version: '1.0.0'
    }
  };
  
  res.json({
    success: true,
    data: systemInfo,
    timestamp: new Date().toISOString()
  });
}));

// 设置警报阈值
router.put('/alert-thresholds', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { memoryUsage, responseTime, errorRate, dbConnections } = req.body;
  
  const thresholds: any = {};
  if (memoryUsage !== undefined) thresholds.memoryUsage = memoryUsage;
  if (responseTime !== undefined) thresholds.responseTime = responseTime;
  if (errorRate !== undefined) thresholds.errorRate = errorRate;
  if (dbConnections !== undefined) thresholds.dbConnections = dbConnections;
  
  systemMonitor.setAlertThresholds(thresholds);
  
  logger.info('Alert thresholds updated', {
    updatedBy: req.user?.id,
    thresholds
  });
  
  res.json({
    success: true,
    message: '警报阈值已更新',
    data: thresholds,
    timestamp: new Date().toISOString()
  });
}));

// 启动/停止监控
router.post('/control', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { action, interval } = req.body;
  
  if (action === 'start') {
    const monitoringInterval = interval || 10000;
    systemMonitor.start(monitoringInterval);
    
    logger.info('System monitoring started via API', {
      startedBy: req.user?.id,
      interval: monitoringInterval
    });
    
    res.json({
      success: true,
      message: '系统监控已启动',
      data: { interval: monitoringInterval },
      timestamp: new Date().toISOString()
    });
    
  } else if (action === 'stop') {
    systemMonitor.stop();
    
    logger.info('System monitoring stopped via API', {
      stoppedBy: req.user?.id
    });
    
    res.json({
      success: true,
      message: '系统监控已停止',
      timestamp: new Date().toISOString()
    });
    
  } else {
    res.status(400).json({
      success: false,
      message: '无效的操作，支持的操作: start, stop',
      timestamp: new Date().toISOString()
    });
  }
}));

// 导出监控数据
router.get('/export', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const format = req.query.format as string || 'json';
  const minutes = parseInt(req.query.minutes as string) || 60;
  
  const data = {
    exportTime: new Date().toISOString(),
    timeRange: `${minutes} minutes`,
    ...metricsStore.getHistoricalData(minutes),
    systemInfo: getHealthStatus()
  };
  
  if (format === 'csv') {
    // 简单的CSV导出
    const csvData = data.systemMetrics.map(metric => 
      `${new Date(metric.timestamp).toISOString()},${metric.memory.used},${metric.memory.total},${metric.requests.active},${metric.requests.avgResponseTime}`
    ).join('\n');
    
    const csvHeader = 'timestamp,memory_used,memory_total,active_requests,avg_response_time\n';
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=monitoring-data.csv');
    res.send(csvHeader + csvData);
    
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=monitoring-data.json');
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  }
  
  logger.info('Monitoring data exported', {
    exportedBy: req.user?.id,
    format,
    timeRange: minutes
  });
}));

// 获取错误统计
router.get('/errors', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24;
  const historicalData = metricsStore.getHistoricalData(hours * 60);
  
  // 统计错误
  const errorStats = historicalData.apiMetrics
    .filter(metric => metric.statusCode >= 400)
    .reduce((acc, metric) => {
      const endpoint = `${metric.method} ${metric.endpoint}`;
      const statusCode = metric.statusCode.toString();
      
      if (!acc[endpoint]) {
        acc[endpoint] = {};
      }
      
      if (!acc[endpoint][statusCode]) {
        acc[endpoint][statusCode] = 0;
      }
      
      acc[endpoint][statusCode]++;
      return acc;
    }, {} as Record<string, Record<string, number>>);
  
  res.json({
    success: true,
    data: {
      timeRange: `${hours} hours`,
      errorStats,
      totalErrors: Object.values(errorStats).reduce((sum, endpoint) => 
        sum + Object.values(endpoint).reduce((endpointSum, count) => endpointSum + count, 0), 0
      )
    },
    timestamp: new Date().toISOString()
  });
}));

// 性能分析
router.get('/performance', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const minutes = parseInt(req.query.minutes as string) || 60;
  const historicalData = metricsStore.getHistoricalData(minutes);
  
  // 分析性能趋势
  const performanceAnalysis = {
    timeRange: `${minutes} minutes`,
    trends: {
      memoryUsage: calculateTrend(historicalData.systemMetrics.map(m => m.memory.used)),
      responseTime: calculateTrend(historicalData.apiMetrics.map(m => m.responseTime)),
      requestVolume: historicalData.apiMetrics.length,
      errorRate: (historicalData.apiMetrics.filter(m => m.statusCode >= 400).length / historicalData.apiMetrics.length) * 100
    },
    slowestEndpoints: getSlowedstEndpoints(historicalData.apiMetrics),
    peakHours: analyzePeakHours(historicalData.apiMetrics)
  };
  
  res.json({
    success: true,
    data: performanceAnalysis,
    timestamp: new Date().toISOString()
  });
}));

// 辅助函数：计算趋势
function calculateTrend(values: number[]): { direction: string; change: number } {
  if (values.length < 2) return { direction: 'stable', change: 0 };
  
  const first = values.slice(0, Math.floor(values.length / 3)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 3);
  const last = values.slice(-Math.floor(values.length / 3)).reduce((a, b) => a + b, 0) / Math.floor(values.length / 3);
  
  const change = ((last - first) / first) * 100;
  
  return {
    direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
    change: Number(change.toFixed(2))
  };
}

// 辅助函数：获取最慢的端点
function getSlowedstEndpoints(apiMetrics: any[]): any[] {
  const endpointStats = apiMetrics.reduce((acc, metric) => {
    const key = `${metric.method} ${metric.endpoint}`;
    if (!acc[key]) {
      acc[key] = { times: [], count: 0 };
    }
    acc[key].times.push(metric.responseTime);
    acc[key].count++;
    return acc;
  }, {} as Record<string, { times: number[]; count: number }>);
  
  return Object.entries(endpointStats)
    .map(([endpoint, stats]) => {
      const typedStats = stats as { times: number[]; count: number };
      return {
        endpoint,
        avgResponseTime: typedStats.times.reduce((a: number, b: number) => a + b, 0) / typedStats.times.length,
        requestCount: typedStats.count,
        maxResponseTime: Math.max(...typedStats.times)
      };
    })
    .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
    .slice(0, 10);
}

// 辅助函数：分析峰值时间
function analyzePeakHours(apiMetrics: any[]): any {
  const hourlyStats = apiMetrics.reduce((acc, metric) => {
    const hour = new Date(metric.timestamp).getHours();
    if (!acc[hour]) acc[hour] = 0;
    acc[hour]++;
    return acc;
  }, {} as Record<number, number>);
  
  return Object.entries(hourlyStats)
    .map(([hour, count]) => ({ hour: parseInt(hour), requests: count }))
    .sort((a, b) => (b.requests as number) - (a.requests as number));
}

export default router;