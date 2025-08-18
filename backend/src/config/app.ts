import dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // API配置
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'eig_jwt_secret_key_2025_very_secure',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  },
  
  // 速率限制
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'debug'
  },
  
  // 安全配置
  security: {
    saltRounds: 12,
    maxLoginAttempts: 5,
    lockoutDuration: 30 * 60 * 1000 // 30分钟
  }
};

export default appConfig; 