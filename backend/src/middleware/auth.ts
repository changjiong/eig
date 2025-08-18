import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/authService';
import { User, Permission, UserRole } from '../types/database';

// 扩展Express Request类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// 认证中间件
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '访问令牌缺失',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const token = authHeader.substring(7); // 移除 "Bearer " 前缀
    
    const result = await AuthService.verifyToken(token);
    
    if (!result.success || !result.data) {
      res.status(401).json({
        success: false,
        message: result.message || '无效的访问令牌',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    req.user = result.data;
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: '认证服务异常',
      timestamp: new Date().toISOString()
    });
  }
};

// 权限检查中间件工厂函数
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未认证的请求',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    if (!AuthService.hasPermission(req.user, permission)) {
      res.status(403).json({
        success: false,
        message: '权限不足',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    next();
  };
};

// 角色检查中间件工厂函数
export const requireRole = (role: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未认证的请求',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    if (!AuthService.hasRole(req.user, role)) {
      res.status(403).json({
        success: false,
        message: `需要${role}角色权限`,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    next();
  };
};

// 多角色检查中间件工厂函数
export const requireAnyRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未认证的请求',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    if (!AuthService.hasAnyRole(req.user, roles)) {
      res.status(403).json({
        success: false,
        message: `需要以下角色之一: ${roles.join(', ')}`,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    next();
  };
};

// 可选认证中间件（不强制要求认证）
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const result = await AuthService.verifyToken(token);
      
      if (result.success && result.data) {
        req.user = result.data;
      }
    }
    
    next();
    
  } catch (error) {
    // 可选认证失败时不阻塞请求
    console.warn('Optional authentication failed:', error);
    next();
  }
}; 