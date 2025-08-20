import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger, securityLogger } from './logger';
import { RateLimitError } from './errorHandler';

// 安全配置
const SECURITY_CONFIG = {
  sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
  maxFailedAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15分钟
  passwordMinLength: 8,
  passwordMaxAge: 90 * 24 * 60 * 60 * 1000, // 90天
  sessionIdLength: 32,
  csrfTokenLength: 32
};

// 用户会话存储
interface UserSession {
  userId: string;
  email: string;
  role: string;
  loginTime: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
  failedAttempts: number;
  lockedUntil?: number;
}

class SecurityManager {
  private activeSessions = new Map<string, UserSession>();
  private failedAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>();
  private csrfTokens = new Map<string, { userId: string; timestamp: number }>();

  // 生成安全的随机token
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // 生成CSRF token
  generateCSRFToken(userId: string): string {
    const token = this.generateSecureToken(SECURITY_CONFIG.csrfTokenLength);
    this.csrfTokens.set(token, {
      userId,
      timestamp: Date.now()
    });
    
    // 清理过期token
    this.cleanupExpiredCSRFTokens();
    
    return token;
  }

  // 验证CSRF token
  validateCSRFToken(token: string, userId: string): boolean {
    const tokenData = this.csrfTokens.get(token);
    
    if (!tokenData) return false;
    if (tokenData.userId !== userId) return false;
    if (Date.now() - tokenData.timestamp > 60 * 60 * 1000) { // 1小时有效期
      this.csrfTokens.delete(token);
      return false;
    }
    
    return true;
  }

  // 创建用户会话
  createSession(userId: string, email: string, role: string, ipAddress: string, userAgent: string): string {
    const sessionId = this.generateSecureToken(SECURITY_CONFIG.sessionIdLength);
    const now = Date.now();
    
    const session: UserSession = {
      userId,
      email,
      role,
      loginTime: now,
      lastActivity: now,
      ipAddress,
      userAgent,
      failedAttempts: 0
    };
    
    this.activeSessions.set(sessionId, session);
    
    // 清理过期会话
    this.cleanupExpiredSessions();
    
    logger.info('User session created', {
      userId,
      sessionId,
      ipAddress,
      userAgent: userAgent?.substring(0, 100)
    });
    
    return sessionId;
  }

  // 获取会话信息
  getSession(sessionId: string): UserSession | null {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) return null;
    
    // 检查会话是否过期
    if (Date.now() - session.lastActivity > SECURITY_CONFIG.sessionTimeout) {
      this.destroySession(sessionId);
      return null;
    }
    
    // 更新最后活动时间
    session.lastActivity = Date.now();
    
    return session;
  }

  // 销毁会话
  destroySession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      logger.info('User session destroyed', {
        userId: session.userId,
        sessionId,
        duration: Date.now() - session.loginTime
      });
    }
    
    this.activeSessions.delete(sessionId);
  }

  // 记录登录失败
  recordFailedAttempt(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.failedAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
    
    // 如果当前被锁定
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
      return false; // 仍在锁定期内
    }
    
    // 重置计数器如果距离上次失败超过1小时
    if (now - attempts.lastAttempt > 60 * 60 * 1000) {
      attempts.count = 0;
    }
    
    attempts.count++;
    attempts.lastAttempt = now;
    
    // 如果失败次数达到阈值，锁定账户
    if (attempts.count >= SECURITY_CONFIG.maxFailedAttempts) {
      attempts.lockedUntil = now + SECURITY_CONFIG.lockoutDuration;
      
      securityLogger.suspiciousActivity({} as Request, 'ACCOUNT_LOCKED', {
        identifier,
        failedAttempts: attempts.count
      });
    }
    
    this.failedAttempts.set(identifier, attempts);
    return true;
  }

  // 检查账户是否被锁定
  isAccountLocked(identifier: string): boolean {
    const attempts = this.failedAttempts.get(identifier);
    
    if (!attempts || !attempts.lockedUntil) return false;
    
    const now = Date.now();
    if (now >= attempts.lockedUntil) {
      // 锁定期已过，清除锁定状态
      attempts.lockedUntil = undefined;
      attempts.count = 0;
      return false;
    }
    
    return true;
  }

  // 清除失败尝试记录
  clearFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  // 获取用户的活跃会话
  getUserSessions(userId: string): UserSession[] {
    const sessions: UserSession[] = [];
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        sessions.push({ ...session });
      }
    }
    
    return sessions;
  }

  // 强制注销用户的所有会话
  forceLogoutUser(userId: string): number {
    let loggedOutCount = 0;
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.destroySession(sessionId);
        loggedOutCount++;
      }
    }
    
    logger.warn('User force logged out', { userId, sessionCount: loggedOutCount });
    
    return loggedOutCount;
  }

  // 清理过期会话
  public cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > SECURITY_CONFIG.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }
    
    expiredSessions.forEach(sessionId => {
      this.destroySession(sessionId);
    });
    
    if (expiredSessions.length > 0) {
      logger.info('Expired sessions cleaned up', { count: expiredSessions.length });
    }
  }

  // 清理过期CSRF tokens
  private cleanupExpiredCSRFTokens(): void {
    const now = Date.now();
    const expiredTokens: string[] = [];
    
    for (const [token, data] of this.csrfTokens.entries()) {
      if (now - data.timestamp > 60 * 60 * 1000) { // 1小时
        expiredTokens.push(token);
      }
    }
    
    expiredTokens.forEach(token => {
      this.csrfTokens.delete(token);
    });
  }

  // 获取安全统计信息
  getSecurityStats(): any {
    const now = Date.now();
    
    return {
      activeSessions: this.activeSessions.size,
      lockedAccounts: Array.from(this.failedAttempts.values()).filter(
        attempt => attempt.lockedUntil && now < attempt.lockedUntil
      ).length,
      activeCSRFTokens: this.csrfTokens.size,
      totalFailedAttempts: Array.from(this.failedAttempts.values()).reduce(
        (sum, attempt) => sum + attempt.count, 0
      )
    };
  }
}

// 全局安全管理器实例
export const securityManager = new SecurityManager();

// 会话验证中间件
export const sessionValidation = (req: Request, res: Response, next: NextFunction): void => {
  const sessionId = req.headers['x-session-id'] as string;
  
  if (!sessionId) {
    res.status(401).json({
      success: false,
      message: '缺少会话ID',
      code: 'SESSION_REQUIRED',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  const session = securityManager.getSession(sessionId);
  
  if (!session) {
    res.status(401).json({
      success: false,
      message: '会话已过期或无效',
      code: 'SESSION_INVALID',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // 检查IP地址是否变化（可选，根据安全需求）
  if (session.ipAddress !== req.ip) {
    securityLogger.suspiciousActivity(req, 'IP_ADDRESS_CHANGED', {
      sessionId,
      originalIp: session.ipAddress,
      currentIp: req.ip
    });
    
    // 可以选择销毁会话或允许继续
    // securityManager.destroySession(sessionId);
    // return res.status(401).json({ ... });
  }
  
  // 将会话信息添加到请求对象
  (req as any).session = session;
  
  next();
};

// CSRF保护中间件
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // 只对修改操作进行CSRF检查
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] as string;
  const session = (req as any).session;
  
  if (!token) {
    res.status(403).json({
      success: false,
      message: '缺少CSRF token',
      code: 'CSRF_TOKEN_REQUIRED',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  if (!session || !securityManager.validateCSRFToken(token, session.userId)) {
    securityLogger.suspiciousActivity(req, 'INVALID_CSRF_TOKEN', {
      token: token.substring(0, 8) + '...',
      userId: session?.userId
    });
    
    res.status(403).json({
      success: false,
      message: '无效的CSRF token',
      code: 'CSRF_TOKEN_INVALID',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  next();
};

// 敏感操作验证中间件
export const sensitiveOperationProtection = (req: Request, res: Response, next: NextFunction): void => {
  const session = (req as any).session;
  
  if (!session) {
    res.status(401).json({
      success: false,
      message: '需要身份验证',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // 检查会话是否足够新（敏感操作需要最近登录）
  const sessionAge = Date.now() - session.loginTime;
  const maxAge = 30 * 60 * 1000; // 30分钟
  
  if (sessionAge > maxAge) {
    res.status(403).json({
      success: false,
      message: '敏感操作需要重新验证身份',
      code: 'REAUTHENTICATION_REQUIRED',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  next();
};

// 密码强度验证
export const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < SECURITY_CONFIG.passwordMinLength) {
    errors.push(`密码长度至少${SECURITY_CONFIG.passwordMinLength}位`);
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }
  
  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }
  
  // 检查常见弱密码
  const commonPasswords = [
    'password', '123456', 'admin', 'qwerty', '111111', 'abc123'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('不能使用常见的弱密码');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// 输入验证和清理
export const sanitizeInput = (input: string): string => {
  // 移除HTML标签
  const withoutHtml = input.replace(/<[^>]*>/g, '');
  
  // 移除SQL注入常见字符
  const withoutSqlInjection = withoutHtml.replace(/[';\"\\]/g, '');
  
  // 限制长度
  return withoutSqlInjection.substring(0, 1000);
};

// 请求频率监控
export const requestFrequencyMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const clientId = req.ip + ':' + (req.user?.id || 'anonymous');
  const now = Date.now();
  
  // 这里可以实现更复杂的频率监控逻辑
  // 暂时记录日志用于分析
  logger.debug('Request frequency check', {
    clientId,
    endpoint: req.path,
    method: req.method,
    timestamp: now
  });
  
  next();
};

// 定期清理任务
setInterval(() => {
  securityManager.cleanupExpiredSessions();
}, 10 * 60 * 1000); // 每10分钟清理一次

export default securityManager;