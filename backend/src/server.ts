import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import appConfig from './config/app';
import { testConnection, initializeDatabase } from './config/database';
import { seedDatabase } from './config/seedData';
import authRoutes from './routes/auth';
import enterpriseRoutes from './routes/enterprise';
import clientRoutes from './routes/client';
import graphRoutes from './routes/graph';
import dataRoutes from './routes/data';
import userRoutes from './routes/user';
import searchRoutes from './routes/search';
import taskRoutes from './routes/task';
import eventRoutes from './routes/event';
import prospectRoutes from './routes/prospect';

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS配置
app.use(cors({
  origin: appConfig.cors.origin,
  credentials: appConfig.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// 日志中间件
app.use(morgan('combined'));

// 请求解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'EIG Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API路由
app.use(`${appConfig.apiPrefix}/auth`, authRoutes);
app.use(`${appConfig.apiPrefix}/enterprises`, enterpriseRoutes);
app.use(`${appConfig.apiPrefix}/clients`, clientRoutes);
app.use(`${appConfig.apiPrefix}/graph`, graphRoutes);
app.use(`${appConfig.apiPrefix}/data`, dataRoutes);
app.use(`${appConfig.apiPrefix}/users`, userRoutes);
app.use(`${appConfig.apiPrefix}/search`, searchRoutes);
app.use(`${appConfig.apiPrefix}/tasks`, taskRoutes);
app.use(`${appConfig.apiPrefix}/events`, eventRoutes);
app.use(`${appConfig.apiPrefix}/prospects`, prospectRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `路由 ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: appConfig.nodeEnv === 'development' 
      ? error.message || '服务器内部错误'
      : '服务器内部错误',
    timestamp: new Date().toISOString(),
    ...(appConfig.nodeEnv === 'development' && { stack: error.stack })
  });
});

// 启动服务器函数
const startServer = async () => {
  try {
    // 测试数据库连接
    console.log('🔄 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      // 初始化数据库表结构
      console.log('🔄 Initializing database tables...');
      await initializeDatabase();
      
      // 插入种子数据
      console.log('🔄 Seeding database...');
      await seedDatabase();
    } else {
      console.error('❌ Failed to connect to database. Server will run without database.');
    }
    
    // 启动HTTP服务器
    const server = app.listen(appConfig.port, () => {
      console.log(`
🚀 EIG Backend API Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server URL: http://localhost:${appConfig.port}
🌐 API Base:   http://localhost:${appConfig.port}${appConfig.apiPrefix}
🏥 Health:     http://localhost:${appConfig.port}/health
📋 Environment: ${appConfig.nodeEnv}
⏰ Started at: ${new Date().toLocaleString('zh-CN')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });
    
    // 优雅关闭
    const gracefulShutdown = () => {
      console.log('\n🔄 Received shutdown signal, closing server gracefully...');
      
      server.close((err) => {
        if (err) {
          console.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }
        
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
      
      // 强制退出（防止挂起）
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    // 监听关闭信号
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// 启动服务器
if (require.main === module) {
  startServer();
}

export default app; 