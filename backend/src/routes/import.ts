import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requirePermission } from '../middleware/auth';
import DataImportService from '../services/dataImportService';

const router = express.Router();

// 扩展Request接口以支持multer文件上传
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// 定义数据行类型
type DataRow = { [key: string]: any };

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // 使用时间戳和随机字符串生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}_${randomStr}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB限制
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel (.xlsx, .xls) 和 CSV 文件'));
    }
  }
});

// 上传文件并解析预览
router.post('/upload', authenticate, requirePermission('manage_data'), upload.single('file'), async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未上传文件',
        timestamp: new Date().toISOString()
      });
    }

    const { hasHeader = 'true', encoding = 'utf8', sheetName } = req.body;
    const filePath = req.file.path;

    try {
      // 解析文件获取预览数据
      const data = await DataImportService.parseFile(filePath, {
        hasHeader: hasHeader === 'true',
        encoding,
        sheetName
      });

      // 只返回前10行作为预览
      const previewData = data.slice(0, 10);
      
      // 分析列信息
      const columns = previewData.length > 0 ? Object.keys(previewData[0] as DataRow) : [];
      const columnStats = columns.map(col => {
        const values = previewData.map(row => (row as DataRow)[col]).filter(val => val !== null && val !== undefined && val !== '');
        return {
          name: col,
          type: inferColumnType(values),
          sampleValues: values.slice(0, 3),
          emptyCount: previewData.length - values.length,
          uniqueCount: new Set(values).size
        };
      });

      return res.json({
        success: true,
        data: {
          fileName: req.file.originalname,
          filePath: req.file.filename, // 返回相对路径
          fileSize: req.file.size,
          totalRows: data.length,
          columns: columnStats,
          previewData,
          uploadTime: new Date().toISOString()
        },
        message: '文件解析成功',
        timestamp: new Date().toISOString()
      });

    } catch (parseError) {
      // 删除上传的文件
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      throw new Error(`文件解析失败: ${(parseError as Error).message}`);
    }

  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || '文件上传失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 开始批量导入
router.post('/start', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { 
      fileName,
      filePath,
      dataType = 'enterprises',
      options = {}
    } = req.body;

    if (!fileName || !filePath) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的文件信息',
        timestamp: new Date().toISOString()
      });
    }

    const fullPath = path.join(__dirname, '../../uploads', filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在或已过期',
        timestamp: new Date().toISOString()
      });
    }

    // 创建导入任务
    const jobId = DataImportService.createImportJob(fileName, fs.statSync(fullPath).size);

    // 异步执行导入过程
    setImmediate(async () => {
      try {
        // 解析文件
        const data = await DataImportService.parseFile(fullPath, options);
        
        // 根据数据类型执行相应的导入
        let result;
        switch (dataType) {
          case 'enterprises':
            result = await DataImportService.importEnterprises(jobId, data, options);
            break;
          // 可以添加其他数据类型的导入
          default:
            throw new Error(`不支持的数据类型: ${dataType}`);
        }

        console.log(`Import job ${jobId} completed:`, result);
        
        // 清理临时文件
        setTimeout(() => {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }, 60000); // 1分钟后删除文件

      } catch (error) {
        console.error(`Import job ${jobId} failed:`, error);
        DataImportService.updateImportJob(jobId, {
          status: 'failed',
          errorMessages: [(error as Error).message]
        });
      }
    });

    return res.json({
      success: true,
      data: { jobId },
      message: '导入任务已启动',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Import start error:', error);
    return res.status(500).json({
      success: false,
      message: '启动导入任务失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取导入任务状态
router.get('/status/:jobId', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: '缺少jobId参数',
        timestamp: new Date().toISOString()
      });
    }

    const job = DataImportService.getImportJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: '导入任务不存在',
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      data: job,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get import status error:', error);
    return res.status(500).json({
      success: false,
      message: '获取导入状态失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取所有导入任务
router.get('/jobs', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const jobs = DataImportService.getAllImportJobs();
    
    // 按开始时间倒序排列
    const sortedJobs = jobs.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    return res.json({
      success: true,
      data: sortedJobs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get import jobs error:', error);
    return res.status(500).json({
      success: false,
      message: '获取导入任务列表失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 清理完成的导入任务
router.delete('/cleanup', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { olderThanHours = 24 } = req.body;
    
    DataImportService.cleanupCompletedJobs(olderThanHours);

    return res.json({
      success: true,
      message: `已清理超过${olderThanHours}小时的完成任务`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cleanup jobs error:', error);
    return res.status(500).json({
      success: false,
      message: '清理导入任务失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 获取导入模板
router.get('/template/:type', authenticate, requirePermission('manage_data'), async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    let templateData: any[] = [];
    let fileName = '';
    
    switch (type) {
      case 'enterprises':
        templateData = [{
          name: '示例企业名称',
          legal_name: '示例企业法定名称',
          credit_code: '91110000000000000X',
          registration_number: '1100000000000',
          industry: '软件和信息技术服务业',
          registered_capital: 1000000,
          establish_date: '2020-01-01',
          legal_representative: '张三',
          address: '北京市朝阳区示例地址',
          phone: '010-12345678',
          email: 'contact@example.com',
          website: 'https://www.example.com'
        }];
        fileName = 'enterprises_template.csv';
        break;
      
      case 'clients':
        templateData = [{
          name: '示例客户姓名',
          company: '示例客户公司',
          industry: '制造业',
          position: '采购经理',
          email: 'client@example.com',
          phone: '13812345678',
          estimated_value: 500000
        }];
        fileName = 'clients_template.csv';
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: `不支持的模板类型: ${type}`,
          timestamp: new Date().toISOString()
        });
    }

    // 生成CSV内容
    const headers = Object.keys(templateData[0]);
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(csvContent);

  } catch (error) {
    console.error('Get template error:', error);
    return res.status(500).json({
      success: false,
      message: '获取模板失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 辅助函数：推断列类型
function inferColumnType(values: any[]): string {
  if (values.length === 0) return 'string';
  
  let numberCount = 0;
  let dateCount = 0;
  let emailCount = 0;
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  for (const value of values) {
    const str = String(value).trim();
    
    if (!isNaN(Number(str)) && str !== '') {
      numberCount++;
    }
    
    if (emailPattern.test(str)) {
      emailCount++;
    }
    
    if (!isNaN(Date.parse(str))) {
      dateCount++;
    }
  }
  
  const total = values.length;
  
  if (emailCount > total * 0.5) return 'email';
  if (numberCount > total * 0.8) return 'number';
  if (dateCount > total * 0.5) return 'date';
  
  return 'string';
}

export default router;