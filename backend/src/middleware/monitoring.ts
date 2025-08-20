import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { logger } from './logger';
import { pool } from '../config/database';

// 系统监控指标接口
interface SystemMetrics {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  database: {
    totalConnections: number;
    idleConnections: number;
    waitingConnections: number;
  };
  requests: {
    total: number;
    active: number;
    avgResponseTime: number;
    errorRate: number;
  };
  customMetrics: Record<string, number>;
}

// API性能指标
interface ApiMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: number;
  userId?: string;
  userAgent?: string;
  ip: string;
}

// 监控数据存储
class MetricsStore {
  private systemMetrics: SystemMetrics[] = [];
  private apiMetrics: ApiMetrics[] = [];
  private requestCounts: Map<string, number> = new Map();
  private responseTimes: Map<string, number[]> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private activeRequests: number = 0;
  
  // 保留最近1小时的数据
  private readonly MAX_METRICS_AGE = 60 * 60 * 1000; // 1小时
  private readonly MAX_METRICS_COUNT = 3600; // 每秒一个数据点

  // 添加系统指标
  addSystemMetrics(metrics: SystemMetrics): void {
    this.systemMetrics.push(metrics);
    this.cleanOldMetrics();
  }

  // 添加API指标
  addApiMetrics(metrics: ApiMetrics): void {
    this.apiMetrics.push(metrics);
    
    const key = `${metrics.method}:${metrics.endpoint}`;
    
    // 更新请求计数
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);
    
    // 更新响应时间
    const times = this.responseTimes.get(key) || [];
    times.push(metrics.responseTime);
    if (times.length > 100) times.shift(); // 保留最近100次请求
    this.responseTimes.set(key, times);
    
    // 更新错误计数
    if (metrics.statusCode >= 400) {
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    }
    
    this.cleanOldMetrics();
  }

  // 增加活跃请求数
  incrementActiveRequests(): void {
    this.activeRequests++;
  }

  // 减少活跃请求数
  decrementActiveRequests(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }

  // 获取当前系统指标
  getCurrentSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      timestamp: Date.now(),
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      cpu: {
        usage: (cpuUsage.user + cpuUsage.system) / 1000000, // 转换为毫秒
        loadAverage: process.platform === 'win32' ? [0, 0, 0] : require('os').loadavg()
      },
      database: {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingConnections: pool.waitingCount
      },
      requests: {
        total: Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0),
        active: this.activeRequests,
        avgResponseTime: this.getAverageResponseTime(),
        errorRate: this.getErrorRate()
      },
      customMetrics: {}
    };
  }

  // 获取API统计
  getApiStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [endpoint, count] of this.requestCounts.entries()) {
      const times = this.responseTimes.get(endpoint) || [];
      const errors = this.errorCounts.get(endpoint) || 0;
      
      stats[endpoint] = {
        requestCount: count,
        avgResponseTime: times.length > 0 ? 
          times.reduce((a, b) => a + b, 0) / times.length : 0,
        minResponseTime: times.length > 0 ? Math.min(...times) : 0,
        maxResponseTime: times.length > 0 ? Math.max(...times) : 0,
        errorCount: errors,
        errorRate: count > 0 ? (errors / count) * 100 : 0
      };
    }
    
    return stats;
  }

  // 获取历史数据
  getHistoricalData(minutes: number = 60): {
    systemMetrics: SystemMetrics[];
    apiMetrics: ApiMetrics[];
  } {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    
    return {
      systemMetrics: this.systemMetrics.filter(m => m.timestamp > cutoff),
      apiMetrics: this.apiMetrics.filter(m => m.timestamp > cutoff)
    };
  }

  // 清理旧数据
  private cleanOldMetrics(): void {
    const cutoff = Date.now() - this.MAX_METRICS_AGE;
    
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoff);
    this.apiMetrics = this.apiMetrics.filter(m => m.timestamp > cutoff);
    
    // 限制数据量
    if (this.systemMetrics.length > this.MAX_METRICS_COUNT) {
      this.systemMetrics = this.systemMetrics.slice(-this.MAX_METRICS_COUNT);
    }
    
    if (this.apiMetrics.length > this.MAX_METRICS_COUNT) {
      this.apiMetrics = this.apiMetrics.slice(-this.MAX_METRICS_COUNT);
    }
  }

  // 计算平均响应时间
  private getAverageResponseTime(): number {
    const allTimes = Array.from(this.responseTimes.values()).flat();
    return allTimes.length > 0 ? 
      allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
  }

  // 计算错误率
  private getErrorRate(): number {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0);
    const totalErrors = Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0);
    
    return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  }
}

// 全局监控存储实例
export const metricsStore = new MetricsStore();

// 性能监控中间件
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = performance.now();
  metricsStore.incrementActiveRequests();
  
  res.on('finish', () => {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    const metrics: ApiMetrics = {
      endpoint: req.route?.path || req.path,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      timestamp: Date.now(),
      userId: req.user?.id,
      userAgent: req.get('User-Agent'),
      ip: req.ip || 'unknown'
    };
    
    metricsStore.addApiMetrics(metrics);
    metricsStore.decrementActiveRequests();
    
    // 记录慢请求
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        endpoint: metrics.endpoint,
        method: metrics.method,
        responseTime: `${responseTime.toFixed(2)}ms`,
        userId: metrics.userId
      });
    }
  });
  
  next();
};

// 系统指标收集器
export class SystemMonitor {
  private collectInterval: NodeJS.Timeout | null = null;
  private alertThresholds = {
    memoryUsage: 85, // 内存使用率超过85%
    responseTime: 2000, // 响应时间超过2秒
    errorRate: 10, // 错误率超过10%
    dbConnections: 80 // 数据库连接使用率超过80%
  };

  // 开始监控
  start(intervalMs: number = 10000): void {
    if (this.collectInterval) {
      this.stop();
    }
    
    this.collectInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, intervalMs);
    
    logger.info('System monitoring started', { interval: intervalMs });
  }

  // 停止监控
  stop(): void {
    if (this.collectInterval) {
      clearInterval(this.collectInterval);
      this.collectInterval = null;
      logger.info('System monitoring stopped');
    }
  }

  // 收集系统指标
  private collectSystemMetrics(): void {
    try {
      const metrics = metricsStore.getCurrentSystemMetrics();
      metricsStore.addSystemMetrics(metrics);
      
      // 检查警报条件
      this.checkAlerts(metrics);
      
    } catch (error) {
      logger.error('Failed to collect system metrics', { error });
    }
  }

  // 检查警报条件
  private checkAlerts(metrics: SystemMetrics): void {
    // 内存使用率警报
    const memoryUsage = (metrics.memory.used / metrics.memory.total) * 100;
    if (memoryUsage > this.alertThresholds.memoryUsage) {
      logger.warn('High memory usage detected', {
        current: `${memoryUsage.toFixed(2)}%`,
        threshold: `${this.alertThresholds.memoryUsage}%`
      });
    }

    // 响应时间警报
    if (metrics.requests.avgResponseTime > this.alertThresholds.responseTime) {
      logger.warn('High average response time detected', {
        current: `${metrics.requests.avgResponseTime.toFixed(2)}ms`,
        threshold: `${this.alertThresholds.responseTime}ms`
      });
    }

    // 错误率警报
    if (metrics.requests.errorRate > this.alertThresholds.errorRate) {
      logger.warn('High error rate detected', {
        current: `${metrics.requests.errorRate.toFixed(2)}%`,
        threshold: `${this.alertThresholds.errorRate}%`
      });
    }

    // 数据库连接警报
    const dbUsage = metrics.database.totalConnections > 0 ? 
      ((metrics.database.totalConnections - metrics.database.idleConnections) / metrics.database.totalConnections) * 100 : 0;
    
    if (dbUsage > this.alertThresholds.dbConnections) {
      logger.warn('High database connection usage detected', {
        current: `${dbUsage.toFixed(2)}%`,
        threshold: `${this.alertThresholds.dbConnections}%`,
        connections: {
          total: metrics.database.totalConnections,
          idle: metrics.database.idleConnections,
          waiting: metrics.database.waitingConnections
        }
      });
    }
  }

  // 设置警报阈值
  setAlertThresholds(thresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
    logger.info('Alert thresholds updated', this.alertThresholds);
  }

  // 获取监控报告
  getMonitoringReport(): any {
    const currentMetrics = metricsStore.getCurrentSystemMetrics();
    const apiStats = metricsStore.getApiStats();
    const historicalData = metricsStore.getHistoricalData(60);

    return {
      current: currentMetrics,
      api: apiStats,
      historical: {
        systemMetrics: historicalData.systemMetrics.length,
        apiMetrics: historicalData.apiMetrics.length
      },
      alerts: this.alertThresholds,
      uptime: process.uptime()
    };
  }
}

// 全局系统监控实例
export const systemMonitor = new SystemMonitor();

// 健康检查端点数据
export const getHealthStatus = (): any => {
  const metrics = metricsStore.getCurrentSystemMetrics();
  const memoryUsage = (metrics.memory.used / metrics.memory.total) * 100;
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      usage: `${memoryUsage.toFixed(2)}%`,
      used: `${(metrics.memory.used / 1024 / 1024).toFixed(2)}MB`,
      total: `${(metrics.memory.total / 1024 / 1024).toFixed(2)}MB`
    },
    database: {
      connected: pool.totalCount > 0,
      connections: {
        total: metrics.database.totalConnections,
        idle: metrics.database.idleConnections,
        waiting: metrics.database.waitingConnections
      }
    },
    requests: {
      active: metrics.requests.active,
      total: metrics.requests.total,
      avgResponseTime: `${metrics.requests.avgResponseTime.toFixed(2)}ms`,
      errorRate: `${metrics.requests.errorRate.toFixed(2)}%`
    }
  };
};

export default performanceMonitoring;