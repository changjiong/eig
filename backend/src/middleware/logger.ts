import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// 日志级别
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

// 日志接口
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: any;
}

class Logger {
  private logsDir: string;
  
  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
    this.ensureLogsDirectory();
  }
  
  private ensureLogsDirectory(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }
  
  private writeLog(entry: LogEntry): void {
    const logFile = path.join(this.logsDir, `${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(entry) + '\n';
    
    fs.appendFile(logFile, logLine, (err) => {
      if (err) {
        console.error('Failed to write log:', err);
      }
    });
  }
  
  private formatMessage(level: LogLevel, message: string, meta?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    };
  }
  
  error(message: string, meta?: any): void {
    const entry = this.formatMessage(LogLevel.ERROR, message, meta);
    this.writeLog(entry);
    console.error(`[${entry.timestamp}] ERROR: ${message}`, meta);
  }
  
  warn(message: string, meta?: any): void {
    const entry = this.formatMessage(LogLevel.WARN, message, meta);
    this.writeLog(entry);
    console.warn(`[${entry.timestamp}] WARN: ${message}`, meta);
  }
  
  info(message: string, meta?: any): void {
    const entry = this.formatMessage(LogLevel.INFO, message, meta);
    this.writeLog(entry);
    console.info(`[${entry.timestamp}] INFO: ${message}`, meta);
  }
  
  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.formatMessage(LogLevel.DEBUG, message, meta);
      this.writeLog(entry);
      console.debug(`[${entry.timestamp}] DEBUG: ${message}`, meta);
    }
  }
}

// 单例实例
export const logger = new Logger();

// 请求日志中间件
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  // 添加请求ID到请求对象
  (req as any).requestId = requestId;
  
  // 记录请求开始
  logger.info('Request started', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  // 重写响应的end方法来记录响应
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: () => void): Response {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id
    });
    
    // 调用原始的end方法并返回结果
    return originalEnd.call(this, chunk, encoding, cb) as Response;
  };
  
  next();
};

// 错误日志中间件
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req as any).requestId;
  
  logger.error('Request error', {
    requestId,
    method: req.method,
    path: req.path,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next(error);
};

// 性能监控中间件
export const performanceLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒
    
    if (duration > 1000) { // 记录超过1秒的慢请求
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        userId: req.user?.id
      });
    }
  });
  
  next();
};

// 安全事件日志
export const securityLogger = {
  authenticationFailed: (req: Request, reason: string) => {
    logger.warn('Authentication failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      reason
    });
  },
  
  authorizationFailed: (req: Request, userId: string, resource: string) => {
    logger.warn('Authorization failed', {
      userId,
      resource,
      ip: req.ip,
      path: req.path
    });
  },
  
  suspiciousActivity: (req: Request, activity: string, details?: any) => {
    logger.error('Suspicious activity detected', {
      activity,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      userId: req.user?.id,
      details
    });
  }
};

export default logger;