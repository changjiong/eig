import express from 'express';
import AuthService from '../services/authService';
import { authenticate } from '../middleware/auth';
import { LoginRequest } from '../types/database';

const router = express.Router();

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码不能为空',
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await AuthService.login({ email, password });
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(401).json(result);
    }
    
  } catch (error) {
    console.error('Login route error:', error);
    return res.status(500).json({
      success: false,
      message: '登录服务异常，请稍后重试',
      timestamp: new Date().toISOString()
    });
  }
});

// 验证token并获取用户信息
router.get('/me', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证的请求',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(200).json({
      success: true,
      data: req.user,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get user info error:', error);
    return res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 用户登出（可选：如果需要服务端登出逻辑）
router.post('/logout', authenticate, async (req, res) => {
  try {
    // 这里可以添加服务端登出逻辑，比如将token加入黑名单
    // 目前客户端删除token即可实现登出
    
    return res.status(200).json({
      success: true,
      message: '登出成功',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Logout route error:', error);
    return res.status(500).json({
      success: false,
      message: '登出失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 刷新token（可选功能）
router.post('/refresh', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证的请求',
        timestamp: new Date().toISOString()
      });
    }
    
    // 重新登录以获取新token
    const result = await AuthService.login({
      email: req.user.email,
      password: '' // 这里需要改进，不应该重新输入密码
    });
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'token刷新失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 