import { Request, Response, NextFunction } from 'express';
import { logger, securityLogger } from './logger';

// 内存存储器（生产环境建议使用Redis）
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  }
}

const store: RateLimitStore = {};

// 清理过期记录
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key] && store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // 每分钟清理一次

interface RateLimitOptions {
  windowMs: number;     // 时间窗口（毫秒）
  maxRequests: number;  // 最大请求数
  keyGenerator?: (req: Request) => string; // 自定义key生成器
  skipSuccessfulRequests?: boolean; // 是否跳过成功请求
  message?: string;     // 自定义错误消息
  statusCode?: number;  // 自定义状态码
}

// 基础限流中间件
export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req: Request) => req.ip || 'unknown',
    skipSuccessfulRequests = false,
    message = '请求过于频繁，请稍后再试',
    statusCode = 429
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // 初始化或重置计数器
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }
    
    const currentRecord = store[key];
    if (!currentRecord) {
      // 防御性检查，这种情况理论上不应该发生
      return next();
    }
    
    // 检查是否超过限制
    if (currentRecord.count >= maxRequests) {
      securityLogger.suspiciousActivity(req, 'RATE_LIMIT_EXCEEDED', {
        key,
        count: currentRecord.count,
        maxRequests,
        windowMs
      });
      
      res.status(statusCode).json({
        success: false,
        message,
        retryAfter: Math.ceil((currentRecord.resetTime - now) / 1000),
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // 增加计数（如果配置为跳过成功请求，则在响应后处理）
    if (!skipSuccessfulRequests) {
      currentRecord.count++;
    }
    
    // 添加速率限制头
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - currentRecord.count).toString(),
      'X-RateLimit-Reset': new Date(currentRecord.resetTime).toISOString()
    });
    
    // 如果配置为跳过成功请求，在响应完成后处理计数
    if (skipSuccessfulRequests) {
      res.on('finish', () => {
        const record = store[key];
        if (record && res.statusCode >= 400) {
          record.count++;
        }
      });
    }
    
    next();
  };
};

// 预定义的限流配置
export const rateLimitConfigs = {
  // 严格限流：每分钟10次请求
  strict: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: '请求过于频繁，请稍后再试'
  }),
  
  // 中等限流：每分钟30次请求
  moderate: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: '请求频率较高，请适当降低请求频率'
  }),
  
  // 宽松限流：每分钟100次请求
  lenient: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: '请求次数达到限制，请稍后再试'
  }),
  
  // 登录限流：每15分钟5次失败登录
  login: rateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    keyGenerator: (req: Request) => `login:${req.ip || 'unknown'}:${req.body?.email || 'unknown'}`,
    skipSuccessfulRequests: true,
    message: '登录失败次数过多，请15分钟后再试'
  }),
  
  // API限流：每小时1000次请求
  api: rateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 1000,
    keyGenerator: (req: Request) => req.user?.id || req.ip || 'unknown',
    message: 'API调用次数达到小时限制'
  }),
  
  // 搜索限流：每分钟20次搜索
  search: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 20,
    keyGenerator: (req: Request) => `search:${req.user?.id || req.ip}`,
    message: '搜索请求过于频繁，请稍后再试'
  }),
  
  // 数据导入限流：每小时5次
  dataImport: rateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
    keyGenerator: (req: Request) => `import:${req.user?.id}`,
    message: '数据导入次数达到小时限制'
  }),
  
  // 邮件发送限流：每小时10次
  email: rateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    keyGenerator: (req: Request) => `email:${req.user?.id || req.ip}`,
    message: '邮件发送次数达到限制'
  })
};

// IP白名单中间件
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || 'unknown';
    
    if (!allowedIPs.includes(clientIP)) {
      securityLogger.suspiciousActivity(req, 'IP_NOT_IN_WHITELIST', { clientIP });
      
      res.status(403).json({
        success: false,
        message: '访问被拒绝',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    next();
  };
};

// 自适应限流（根据系统负载动态调整）
export const adaptiveRateLimit = (baseOptions: RateLimitOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 获取系统负载（简化版，实际可以使用更复杂的指标）
    const memUsage = process.memoryUsage();
    const heapUsedRatio = memUsage.heapUsed / memUsage.heapTotal;
    
    // 根据内存使用率调整限流
    let adjustedMaxRequests = baseOptions.maxRequests;
    if (heapUsedRatio > 0.8) {
      adjustedMaxRequests = Math.floor(baseOptions.maxRequests * 0.5); // 内存使用率高时减少50%
    } else if (heapUsedRatio > 0.6) {
      adjustedMaxRequests = Math.floor(baseOptions.maxRequests * 0.75); // 内存使用率中等时减少25%
    }
    
    const adaptiveOptions = {
      ...baseOptions,
      maxRequests: adjustedMaxRequests
    };
    
    rateLimit(adaptiveOptions)(req, res, next);
  };
};

// 分布式限流（需要Redis支持）
export const distributedRateLimit = (options: RateLimitOptions & { redisClient?: any }) => {
  const { redisClient } = options;
  
  if (!redisClient) {
    logger.warn('Redis client not provided, falling back to memory-based rate limiting');
    return rateLimit(options);
  }
  
  // 这里可以实现基于Redis的分布式限流
  // 为简化起见，当前返回基础限流
  return rateLimit(options);
};

export default rateLimit;