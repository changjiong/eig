import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { securityManager, validatePasswordStrength } from '../middleware/security';
import { asyncHandler } from '../middleware/errorHandler';
import { logger, securityLogger } from '../middleware/logger';
import bcrypt from 'bcrypt';
import { pool } from '../config/database';

const router = Router();

// 获取安全统计信息
router.get('/stats', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const securityStats = securityManager.getSecurityStats();
  
  res.json({
    success: true,
    data: securityStats,
    timestamp: new Date().toISOString()
  });
}));

// 获取活跃会话列表
router.get('/sessions', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  
  let sessions: any[];
  if (userId) {
    sessions = securityManager.getUserSessions(userId);
  } else {
    // 这里需要扩展SecurityManager来支持获取所有会话
    sessions = [];
  }
  
  return res.json({
    success: true,
    data: {
      sessions,
      count: sessions.length
    },
    timestamp: new Date().toISOString()
  });
}));

// 强制注销用户会话
router.post('/force-logout', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { userId, sessionId } = req.body;
  
  if (!userId && !sessionId) {
    return res.status(400).json({
      success: false,
      message: '请提供用户ID或会话ID',
      timestamp: new Date().toISOString()
    });
  }
  
  let loggedOutCount = 0;
  
  if (sessionId) {
    securityManager.destroySession(sessionId);
    loggedOutCount = 1;
  } else if (userId) {
    loggedOutCount = securityManager.forceLogoutUser(userId);
  }
  
  securityLogger.suspiciousActivity(req, 'FORCE_LOGOUT', {
    targetUserId: userId,
    sessionId,
    adminUserId: req.user?.id,
    loggedOutCount
  });
  
  return res.json({
    success: true,
    message: `已强制注销 ${loggedOutCount} 个会话`,
    data: { loggedOutCount },
    timestamp: new Date().toISOString()
  });
}));

// 生成CSRF token
router.post('/csrf-token', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: '未认证的用户',
      timestamp: new Date().toISOString()
    });
  }
  
  const csrfToken = securityManager.generateCSRFToken(userId);
  
  return res.json({
    success: true,
    data: { csrfToken },
    timestamp: new Date().toISOString()
  });
}));

// 密码强度检查
router.post('/validate-password', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      message: '请提供密码',
      timestamp: new Date().toISOString()
    });
  }
  
  const validation = validatePasswordStrength(password);
  
  return res.json({
    success: true,
    data: validation,
    timestamp: new Date().toISOString()
  });
}));

// 修改密码
router.post('/change-password', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: '请提供当前密码和新密码',
      timestamp: new Date().toISOString()
    });
  }
  
  // 验证新密码强度
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    return res.status(400).json({
      success: false,
      message: '新密码不符合安全要求',
      data: { errors: passwordValidation.errors },
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    // 获取当前密码哈希
    const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        timestamp: new Date().toISOString()
      });
    }
    
    const currentPasswordHash = userResult.rows[0].password_hash;
    
    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentPasswordHash);
    if (!isCurrentPasswordValid) {
      securityLogger.suspiciousActivity(req, 'INVALID_PASSWORD_CHANGE_ATTEMPT', {
        userId
      });
      
      return res.status(401).json({
        success: false,
        message: '当前密码错误',
        timestamp: new Date().toISOString()
      });
    }
    
    // 检查新密码是否与当前密码相同
    const isSamePassword = await bcrypt.compare(newPassword, currentPasswordHash);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: '新密码不能与当前密码相同',
        timestamp: new Date().toISOString()
      });
    }
    
    // 哈希新密码
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // 更新密码
    const updateQuery = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;
    await pool.query(updateQuery, [newPasswordHash, userId]);
    
    // 强制注销用户的所有会话（除了当前会话）
    const loggedOutCount = securityManager.forceLogoutUser(userId!);
    
    logger.info('Password changed successfully', {
      userId,
      loggedOutSessions: loggedOutCount
    });
    
    return res.json({
      success: true,
      message: '密码修改成功，其他会话已被注销',
      data: { loggedOutSessions: loggedOutCount },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Password change failed', { userId, error });
    return res.status(500).json({
      success: false,
      message: '密码修改失败',
      timestamp: new Date().toISOString()
    });
  }
}));

// 账户锁定管理
router.get('/locked-accounts', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  // 获取锁定的账户列表
  // 这里需要扩展SecurityManager来支持获取锁定账户信息
  
  res.json({
    success: true,
    data: {
      lockedAccounts: [],
      message: '锁定账户功能需要进一步实现'
    },
    timestamp: new Date().toISOString()
  });
}));

// 解锁账户
router.post('/unlock-account', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.body; // email或用户ID
  
  if (!identifier) {
    return res.status(400).json({
      success: false,
      message: '请提供用户标识符',
      timestamp: new Date().toISOString()
    });
  }
  
  securityManager.clearFailedAttempts(identifier);
  
  securityLogger.suspiciousActivity(req, 'ACCOUNT_UNLOCKED', {
    targetIdentifier: identifier,
    adminUserId: req.user?.id
  });
  
  return res.json({
    success: true,
    message: '账户已解锁',
    data: { identifier },
    timestamp: new Date().toISOString()
  });
}));

// 获取用户登录历史
router.get('/login-history/:userId', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  
  try {
    const query = `
      SELECT 
        login_time,
        ip_address,
        user_agent,
        device_type,
        location,
        success,
        failure_reason,
        session_duration,
        logout_time
      FROM user_login_history 
      WHERE user_id = $1 
      ORDER BY login_time DESC 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    
    res.json({
      success: true,
      data: {
        history: result.rows,
        count: result.rowCount,
        pagination: { limit, offset }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to get login history', { userId, error });
    res.status(500).json({
      success: false,
      message: '获取登录历史失败',
      timestamp: new Date().toISOString()
    });
  }
}));

// 更新用户安全设置
router.put('/settings/:userId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { 
    notification_email,
    notification_browser,
    notification_mobile,
    notification_types,
    theme,
    language
  } = req.body;
  
  // 检查权限：只有用户本人或管理员可以修改
  if (req.user?.id !== userId && req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '权限不足',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;
    
    const addField = (field: string, value: any) => {
      if (value !== undefined) {
        paramCount++;
        updateFields.push(`${field} = $${paramCount}`);
        values.push(value);
      }
    };
    
    addField('notification_email', notification_email);
    addField('notification_browser', notification_browser);
    addField('notification_mobile', notification_mobile);
    addField('notification_types', notification_types ? JSON.stringify(notification_types) : undefined);
    addField('theme', theme);
    addField('language', language);
    addField('updated_at', 'CURRENT_TIMESTAMP');
    
    if (updateFields.length === 1) { // 只有updated_at
      return res.status(400).json({
        success: false,
        message: '没有提供要更新的字段',
        timestamp: new Date().toISOString()
      });
    }
    
    values.push(userId);
    const query = `
      UPDATE user_settings 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramCount + 1}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rowCount === 0) {
      // 如果没有现有记录，创建新记录
      const insertQuery = `
        INSERT INTO user_settings (
          user_id, notification_email, notification_browser, 
          notification_mobile, notification_types, theme, language
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const insertResult = await pool.query(insertQuery, [
        userId,
        notification_email ?? true,
        notification_browser ?? true,
        notification_mobile ?? false,
        notification_types ? JSON.stringify(notification_types) : '{}',
        theme ?? 'light',
        language ?? 'zh-CN'
      ]);
      
      result.rows = insertResult.rows;
    }
    
    logger.info('User security settings updated', {
      userId,
      updatedBy: req.user?.id
    });
    
    return res.json({
      success: true,
      message: '安全设置已更新',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to update security settings', { userId, error });
    return res.status(500).json({
      success: false,
      message: '更新安全设置失败',
      timestamp: new Date().toISOString()
    });
  }
}));

// 启用/禁用两步验证
router.post('/two-factor-auth', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { enabled, code } = req.body;
  const userId = req.user?.id;
  
  // 这里可以实现两步验证的逻辑
  // 目前返回占位响应
  
  res.json({
    success: true,
    message: enabled ? '两步验证已启用' : '两步验证已禁用',
    data: { 
      enabled,
      message: '两步验证功能需要进一步实现'
    },
    timestamp: new Date().toISOString()
  });
}));

// 安全事件报告
router.get('/security-events', authenticate, requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7;
  const limit = parseInt(req.query.limit as string) || 100;
  
  // 这里应该从日志文件或专门的安全事件表中获取数据
  // 目前返回模拟数据
  
  const events = [
    {
      id: '1',
      type: 'failed_login',
      description: '登录失败',
      userId: null,
      ipAddress: '192.168.1.100',
      timestamp: new Date().toISOString(),
      severity: 'medium'
    },
    {
      id: '2',
      type: 'account_locked',
      description: '账户被锁定',
      userId: 'user123',
      ipAddress: '192.168.1.101',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      severity: 'high'
    }
  ];
  
  res.json({
    success: true,
    data: {
      events,
      count: events.length,
      timeRange: `${days} days`
    },
    timestamp: new Date().toISOString()
  });
}));

export default router;