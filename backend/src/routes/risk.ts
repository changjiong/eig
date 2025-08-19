import express, { Request, Response } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import RiskAssessmentService from '../services/riskAssessmentService';

const router = express.Router();

// 企业风险评估
router.post('/assess/:enterpriseId', authenticate, requirePermission('view_risk'), async (req: Request, res: Response) => {
  try {
    const { enterpriseId } = req.params;
    
    if (!enterpriseId) {
      return res.status(400).json({
        success: false,
        message: '企业ID不能为空',
        timestamp: new Date().toISOString()
      });
    }
    
    const assessment = await RiskAssessmentService.assessEnterpriseRisk(enterpriseId);
    
    return res.json({
      success: true,
      data: assessment,
      message: '风险评估完成',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Risk assessment error:', error);
    return res.status(500).json({
      success: false,
      message: `风险评估失败: ${(error as Error).message}`,
      timestamp: new Date().toISOString()
    });
  }
});

// 批量风险评估
router.post('/batch-assess', authenticate, requirePermission('manage_risk'), async (req: Request, res: Response) => {
  try {
    const { enterpriseIds } = req.body;
    
    if (!Array.isArray(enterpriseIds) || enterpriseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的企业ID列表',
        timestamp: new Date().toISOString()
      });
    }
    
    if (enterpriseIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: '批量评估最多支持50个企业',
        timestamp: new Date().toISOString()
      });
    }
    
    const assessmentResults = await RiskAssessmentService.batchAssessRisk(enterpriseIds);
    
    // 转换Map为Object以便JSON序列化
    const results: Record<string, any> = {};
    for (const [enterpriseId, assessment] of assessmentResults.entries()) {
      results[enterpriseId] = assessment;
    }
    
    return res.json({
      success: true,
      data: {
        totalRequested: enterpriseIds.length,
        totalCompleted: assessmentResults.size,
        results
      },
      message: `批量风险评估完成，成功评估${assessmentResults.size}个企业`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Batch risk assessment error:', error);
    return res.status(500).json({
      success: false,
      message: `批量风险评估失败: ${(error as Error).message}`,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取风险预警列表
router.get('/warnings', authenticate, requirePermission('view_risk'), async (req: Request, res: Response) => {
  try {
    const { 
      isRead = 'false', 
      severity, 
      limit = '20' 
    } = req.query;
    
    const filters: any = {
      limit: parseInt(limit as string)
    };
    
    if (isRead !== 'all') {
      filters.isRead = isRead === 'true';
    }
    
    if (severity && severity !== 'all') {
      filters.severity = severity;
    }
    
    const warnings = await RiskAssessmentService.getRiskWarnings(filters);
    
    return res.json({
      success: true,
      data: warnings,
      message: '风险预警列表获取成功',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get risk warnings error:', error);
    return res.status(500).json({
      success: false,
      message: '获取风险预警列表失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 创建风险预警
router.post('/warnings', authenticate, requirePermission('manage_risk'), async (req: Request, res: Response) => {
  try {
    const {
      enterpriseId,
      warningType,
      severity,
      message,
      riskFactorId
    } = req.body;
    
    if (!enterpriseId || !warningType || !severity || !message) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: enterpriseId, warningType, severity, message',
        timestamp: new Date().toISOString()
      });
    }
    
    const warningId = await RiskAssessmentService.createRiskWarning(
      enterpriseId,
      warningType,
      severity,
      message,
      riskFactorId
    );
    
    return res.json({
      success: true,
      data: { warningId },
      message: '风险预警创建成功',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Create risk warning error:', error);
    return res.status(500).json({
      success: false,
      message: '创建风险预警失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 标记预警为已读
router.patch('/warnings/:warningId/read', authenticate, requirePermission('view_risk'), async (req: Request, res: Response) => {
  try {
    const { warningId } = req.params;
    
    if (!warningId) {
      return res.status(400).json({
        success: false,
        message: '预警ID不能为空',
        timestamp: new Date().toISOString()
      });
    }
    
    await RiskAssessmentService.markWarningAsRead(warningId);
    
    return res.json({
      success: true,
      message: '预警已标记为已读',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Mark warning as read error:', error);
    return res.status(500).json({
      success: false,
      message: '标记预警失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 风险统计概览
router.get('/overview', authenticate, requirePermission('view_risk'), async (req: Request, res: Response) => {
  try {
    // 这里可以添加风险统计逻辑
    const stats = {
      totalEnterprises: 0,
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      activeWarnings: 0,
      criticalWarnings: 0,
      recentAssessments: 0
    };
    
    // 简化版本，实际应该从数据库获取统计数据
    // 这里返回模拟数据
    stats.totalEnterprises = 150;
    stats.riskDistribution = {
      low: 80,
      medium: 45,
      high: 20,
      critical: 5
    };
    stats.activeWarnings = 12;
    stats.criticalWarnings = 3;
    stats.recentAssessments = 25;
    
    return res.json({
      success: true,
      data: stats,
      message: '风险概览获取成功',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get risk overview error:', error);
    return res.status(500).json({
      success: false,
      message: '获取风险概览失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 风险因子管理
router.get('/factors/:enterpriseId', authenticate, requirePermission('view_risk'), async (req: Request, res: Response) => {
  try {
    const { enterpriseId } = req.params;
    
    if (!enterpriseId) {
      return res.status(400).json({
        success: false,
        message: '企业ID不能为空',
        timestamp: new Date().toISOString()
      });
    }
    
    // 这里可以调用服务获取风险因子详情
    return res.json({
      success: true,
      data: [],
      message: '风险因子获取成功',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get risk factors error:', error);
    return res.status(500).json({
      success: false,
      message: '获取风险因子失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 风险因子状态更新
router.patch('/factors/:factorId/status', authenticate, requirePermission('manage_risk'), async (req: Request, res: Response) => {
  try {
    const { factorId } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'monitoring', 'resolved', 'false_positive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值',
        timestamp: new Date().toISOString()
      });
    }
    
    // 这里添加更新风险因子状态的逻辑
    
    return res.json({
      success: true,
      message: '风险因子状态更新成功',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Update risk factor status error:', error);
    return res.status(500).json({
      success: false,
      message: '更新风险因子状态失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 