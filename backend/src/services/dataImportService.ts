// XLSX will be imported dynamically when needed
import pool from '../config/database';
import { PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';

/**
 * 数据导入服务
 * 支持Excel和CSV文件的批量导入处理
 */

export interface ImportJobStatus {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  errorMessages: string[];
  startTime: Date;
  endTime?: Date;
  estimatedRemainingTime?: number;
}

export interface ImportResult {
  success: boolean;
  jobId: string;
  message: string;
  stats: {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    duplicateRows: number;
  };
  errors: Array<{
    row: number;
    field: string;
    message: string;
    data: any;
  }>;
}

export interface DataRow {
  [key: string]: any;
}

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'date' | 'email' | 'uuid';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  transform?: (value: any) => any;
}

export class DataImportService {
  private static importJobs = new Map<string, ImportJobStatus>();
  
  /**
   * 解析Excel/CSV文件
   */
  static async parseFile(filePath: string, options: {
    sheetName?: string;
    hasHeader?: boolean;
    encoding?: string;
  } = {}): Promise<DataRow[]> {
    const { hasHeader = true, encoding = 'utf8' } = options;
    
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('文件路径无效或文件不存在');
    }
    
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      if (ext === '.xlsx' || ext === '.xls') {
        return await this.parseExcel(filePath, options);
      } else if (ext === '.csv') {
        return await this.parseCSV(filePath, { hasHeader, encoding });
      } else {
        throw new Error(`不支持的文件类型: ${ext}`);
      }
    } catch (error) {
      console.error('File parsing error:', error);
      throw new Error(`文件解析失败: ${(error as Error).message}`);
    }
  }
  
  /**
   * 解析Excel文件
   */
  private static async parseExcel(filePath: string, options: {
    sheetName?: string;
    hasHeader?: boolean;
  }): Promise<DataRow[]> {
    try {
      // Dynamic import of xlsx module
      const XLSX = await import('xlsx');
      
      const workbook = XLSX.readFile(filePath);
      const sheetName = options.sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        throw new Error(`工作表 "${sheetName}" 不存在`);
      }
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: options.hasHeader ? undefined : 1,
        raw: false,
        dateNF: 'yyyy-mm-dd'
      });
      
      return jsonData as DataRow[];
    } catch (error) {
      if ((error as any).code === 'MODULE_NOT_FOUND') {
        throw new Error('Excel解析模块未安装，请安装xlsx包');
      }
      throw error;
    }
  }
  
  /**
   * 解析CSV文件
   */
  private static async parseCSV(filePath: string, options: {
    hasHeader: boolean;
    encoding: string;
  }): Promise<DataRow[]> {
    const content = fs.readFileSync(filePath, { encoding: options.encoding as BufferEncoding });
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return [];
    }
    
    const results: DataRow[] = [];
    let headers: string[] = [];
    
    // 简单的CSV解析（不处理引号内的逗号等复杂情况）
    const parseCSVLine = (line: string): string[] => {
      return line.split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1'));
    };
    
    if (options.hasHeader) {
      headers = parseCSVLine(lines[0]);
      lines.shift(); // 移除头部
    } else {
      // 生成默认列名
      const firstRowLength = parseCSVLine(lines[0]).length;
      headers = Array.from({ length: firstRowLength }, (_, i) => `Column_${i + 1}`);
    }
    
    for (const line of lines) {
      const values = parseCSVLine(line);
      const row: DataRow = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      results.push(row);
    }
    
    return results;
  }
  
  /**
   * 数据验证
   */
  static validateData(data: DataRow[], rules: ValidationRule[]): {
    validData: DataRow[];
    errors: Array<{
      row: number;
      field: string;
      message: string;
      data: any;
    }>;
  } {
    const validData: DataRow[] = [];
    const errors: Array<{
      row: number;
      field: string;
      message: string;
      data: any;
    }> = [];
    
    data.forEach((row, rowIndex) => {
      const validatedRow: DataRow = { ...row };
      let isRowValid = true;
      
      rules.forEach(rule => {
        const value = row[rule.field];
        
        // 必填验证
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push({
            row: rowIndex + 1,
            field: rule.field,
            message: '必填字段不能为空',
            data: row
          });
          isRowValid = false;
          return;
        }
        
        // 如果值为空且非必填，跳过其他验证
        if (!value && !rule.required) {
          return;
        }
        
        // 类型验证
        let transformedValue = value;
        switch (rule.type) {
          case 'string':
            transformedValue = String(value);
            break;
          
          case 'number':
            transformedValue = Number(value);
            if (isNaN(transformedValue)) {
              errors.push({
                row: rowIndex + 1,
                field: rule.field,
                message: '数值格式不正确',
                data: row
              });
              isRowValid = false;
              return;
            }
            break;
          
          case 'date':
            transformedValue = new Date(value);
            if (isNaN(transformedValue.getTime())) {
              errors.push({
                row: rowIndex + 1,
                field: rule.field,
                message: '日期格式不正确',
                data: row
              });
              isRowValid = false;
              return;
            }
            break;
          
          case 'email':
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(String(value))) {
              errors.push({
                row: rowIndex + 1,
                field: rule.field,
                message: '邮箱格式不正确',
                data: row
              });
              isRowValid = false;
              return;
            }
            break;
          
          case 'uuid':
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidPattern.test(String(value))) {
              errors.push({
                row: rowIndex + 1,
                field: rule.field,
                message: 'UUID格式不正确',
                data: row
              });
              isRowValid = false;
              return;
            }
            break;
        }
        
        // 长度验证
        if (rule.type === 'string') {
          const strValue = String(transformedValue);
          if (rule.minLength && strValue.length < rule.minLength) {
            errors.push({
              row: rowIndex + 1,
              field: rule.field,
              message: `长度不能少于${rule.minLength}个字符`,
              data: row
            });
            isRowValid = false;
            return;
          }
          
          if (rule.maxLength && strValue.length > rule.maxLength) {
            errors.push({
              row: rowIndex + 1,
              field: rule.field,
              message: `长度不能超过${rule.maxLength}个字符`,
              data: row
            });
            isRowValid = false;
            return;
          }
        }
        
        // 正则表达式验证
        if (rule.pattern && !rule.pattern.test(String(transformedValue))) {
          errors.push({
            row: rowIndex + 1,
            field: rule.field,
            message: '格式不符合要求',
            data: row
          });
          isRowValid = false;
          return;
        }
        
        // 应用数据转换
        if (rule.transform) {
          try {
            transformedValue = rule.transform(transformedValue);
          } catch (error) {
            errors.push({
              row: rowIndex + 1,
              field: rule.field,
              message: `数据转换失败: ${(error as Error).message}`,
              data: row
            });
            isRowValid = false;
            return;
          }
        }
        
        validatedRow[rule.field] = transformedValue;
      });
      
      if (isRowValid) {
        validData.push(validatedRow);
      }
    });
    
    return { validData, errors };
  }
  
  /**
   * 批量导入企业数据
   */
  static async importEnterprises(
    jobId: string,
    data: DataRow[],
    options: { 
      batchSize?: number;
      skipDuplicates?: boolean;
    } = {}
  ): Promise<ImportResult> {
    const { batchSize = 100, skipDuplicates = true } = options;
    
    // 企业数据验证规则
    const validationRules: ValidationRule[] = [
      { field: 'name', type: 'string', required: true, minLength: 1, maxLength: 500 },
      { field: 'legal_name', type: 'string', maxLength: 500 },
      { field: 'credit_code', type: 'string', maxLength: 100 },
      { field: 'registration_number', type: 'string', maxLength: 100 },
      { field: 'industry', type: 'string', maxLength: 200 },
      { field: 'registered_capital', type: 'number' },
      { field: 'establish_date', type: 'date' },
      { field: 'legal_representative', type: 'string', maxLength: 200 },
      { field: 'address', type: 'string' },
      { field: 'phone', type: 'string', maxLength: 50 },
      { field: 'email', type: 'email', maxLength: 255 },
      { field: 'website', type: 'string', maxLength: 255 }
    ];
    
    // 验证数据
    const { validData, errors } = this.validateData(data, validationRules);
    
    const client = await pool.connect();
    const result: ImportResult = {
      success: false,
      jobId,
      message: '',
      stats: {
        totalRows: data.length,
        successfulRows: 0,
        failedRows: errors.length,
        duplicateRows: 0
      },
      errors
    };
    
    try {
      await client.query('BEGIN');
      
      // 更新导入任务状态
      this.updateImportJob(jobId, {
        status: 'processing',
        totalRows: data.length,
        processedRows: 0,
        failedRows: errors.length
      });
      
      let successfulRows = 0;
      let duplicateRows = 0;
      
      // 分批处理数据
      for (let i = 0; i < validData.length; i += batchSize) {
        const batch = validData.slice(i, i + batchSize);
        
        for (const row of batch) {
          try {
            // 检查重复数据
            if (skipDuplicates && row.credit_code) {
              const existing = await client.query(
                'SELECT id FROM enterprises WHERE credit_code = $1',
                [row.credit_code]
              );
              
              if (existing.rows.length > 0) {
                duplicateRows++;
                continue;
              }
            }
            
            // 插入数据
            await client.query(`
              INSERT INTO enterprises (
                name, legal_name, credit_code, registration_number, industry,
                establish_date, registered_capital, legal_representative, address,
                phone, email, website, status, risk_level
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', 'low'
              )
            `, [
              row.name,
              row.legal_name || null,
              row.credit_code || null,
              row.registration_number || null,
              row.industry || null,
              row.establish_date || null,
              row.registered_capital || null,
              row.legal_representative || null,
              row.address || null,
              row.phone || null,
              row.email || null,
              row.website || null
            ]);
            
            successfulRows++;
          } catch (error) {
            console.error('Import row error:', error);
            result.errors.push({
              row: i + data.indexOf(row) + 1,
              field: 'general',
              message: `数据库插入失败: ${(error as Error).message}`,
              data: row
            });
          }
        }
        
        // 更新进度
        this.updateImportJob(jobId, {
          processedRows: Math.min(i + batchSize, validData.length),
          successfulRows,
          progress: Math.round((Math.min(i + batchSize, validData.length) / data.length) * 100)
        });
      }
      
      await client.query('COMMIT');
      
      result.success = true;
      result.stats.successfulRows = successfulRows;
      result.stats.duplicateRows = duplicateRows;
      result.stats.failedRows = data.length - successfulRows - duplicateRows;
      result.message = `导入完成：成功 ${successfulRows} 条，跳过重复 ${duplicateRows} 条，失败 ${result.stats.failedRows} 条`;
      
      // 更新最终状态
      this.updateImportJob(jobId, {
        status: 'completed',
        progress: 100,
        endTime: new Date()
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Import transaction error:', error);
      
      result.message = `导入失败: ${(error as Error).message}`;
      this.updateImportJob(jobId, {
        status: 'failed',
        errorMessages: [(error as Error).message]
      });
      
      throw error;
    } finally {
      client.release();
    }
    
    return result;
  }
  
  /**
   * 创建导入任务
   */
  static createImportJob(fileName: string, fileSize: number): string {
    const jobId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: ImportJobStatus = {
      id: jobId,
      fileName,
      fileSize,
      status: 'processing',
      progress: 0,
      totalRows: 0,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      errorMessages: [],
      startTime: new Date()
    };
    
    this.importJobs.set(jobId, job);
    return jobId;
  }
  
  /**
   * 更新导入任务状态
   */
  static updateImportJob(jobId: string, updates: Partial<ImportJobStatus>): void {
    const job = this.importJobs.get(jobId);
    if (job) {
      Object.assign(job, updates);
      
      // 计算预估剩余时间
      if (job.progress > 0 && job.status === 'processing') {
        const elapsed = Date.now() - job.startTime.getTime();
        const estimatedTotal = (elapsed / job.progress) * 100;
        job.estimatedRemainingTime = estimatedTotal - elapsed;
      }
    }
  }
  
  /**
   * 获取导入任务状态
   */
  static getImportJob(jobId: string): ImportJobStatus | null {
    return this.importJobs.get(jobId) || null;
  }
  
  /**
   * 获取所有导入任务
   */
  static getAllImportJobs(): ImportJobStatus[] {
    return Array.from(this.importJobs.values());
  }
  
  /**
   * 清理完成的导入任务
   */
  static cleanupCompletedJobs(olderThanHours: number = 24): void {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    for (const [jobId, job] of this.importJobs.entries()) {
      if ((job.status === 'completed' || job.status === 'failed') && 
          job.startTime.getTime() < cutoffTime) {
        this.importJobs.delete(jobId);
      }
    }
  }
}

export default DataImportService; 