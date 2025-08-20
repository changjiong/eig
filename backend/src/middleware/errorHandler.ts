import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// 错误类型定义
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 业务错误类
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '认证失败') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源未找到') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = '请求过于频繁') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

// 数据库错误处理
const handleDatabaseError = (error: any): AppError => {
  if (error.code === '23505') { // Unique constraint violation
    return new ConflictError('数据已存在，请检查唯一性约束');
  }
  
  if (error.code === '23503') { // Foreign key constraint violation
    return new ValidationError('引用的数据不存在');
  }
  
  if (error.code === '23502') { // Not null constraint violation
    return new ValidationError('必填字段不能为空');
  }
  
  if (error.code === '23514') { // Check constraint violation
    return new ValidationError('数据格式不符合要求');
  }
  
  if (error.code === 'ECONNREFUSED') {
    return new AppError('数据库连接失败', 503, 'DATABASE_CONNECTION_ERROR');
  }
  
  return new AppError('数据库操作失败', 500, 'DATABASE_ERROR', error.message);
};

// JWT错误处理
const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('无效的访问令牌');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('访问令牌已过期');
  }
  
  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('访问令牌尚未生效');
  }
  
  return new AuthenticationError('令牌验证失败');
};

// 网络错误处理
const handleNetworkError = (error: any): AppError => {
  if (error.code === 'ENOTFOUND') {
    return new AppError('网络连接失败', 503, 'NETWORK_ERROR');
  }
  
  if (error.code === 'ETIMEDOUT') {
    return new AppError('请求超时', 408, 'TIMEOUT_ERROR');
  }
  
  return new AppError('网络异常', 503, 'NETWORK_ERROR');
};

// 发送错误响应
const sendErrorResponse = (error: AppError, req: Request, res: Response): void => {
  const { statusCode, message, code, details } = error;
  
  // 记录错误日志
  logger.error('API Error', {
    requestId: (req as any).requestId,
    statusCode,
    code,
    message,
    details,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
  
  // 开发环境返回详细错误信息
  const errorResponse: any = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    path: req.path
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = details;
    errorResponse.stack = error.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

// 主错误处理中间件
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;
  
  // 如果已经是AppError，直接使用
  if (error instanceof AppError) {
    appError = error;
  } else {
    // 根据错误类型转换为AppError
    if (error.name?.includes('JWT') || error.name?.includes('Token')) {
      appError = handleJWTError(error);
    } else if ((error as any).code && typeof (error as any).code === 'string') {
      // 数据库错误或网络错误
      if ((error as any).code.startsWith('23') || (error as any).code === 'ECONNREFUSED') {
        appError = handleDatabaseError(error);
      } else {
        appError = handleNetworkError(error);
      }
    } else {
      // 未知错误
      appError = new AppError(
        process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误',
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }
  }
  
  sendErrorResponse(appError, req, res);
};

// 404错误处理中间件
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`路径 ${req.originalUrl} 不存在`);
  next(error);
};

// 异步错误捕获包装器
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 验证错误辅助函数
export const createValidationError = (message: string, field?: string, value?: any): ValidationError => {
  return new ValidationError(message, { field, value });
};

// 全局未捕获异常处理
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection', { reason, promise });
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default errorHandler;