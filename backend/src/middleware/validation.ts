import { Request, Response, NextFunction } from 'express';
import { ValidationError, createValidationError } from './errorHandler';

// 通用验证接口
interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'uuid' | 'array' | 'object' | 'date';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[] | number[];
  custom?: (value: any) => boolean | string;
}

interface ValidationSchema {
  body?: ValidationRule[];
  query?: ValidationRule[];
  params?: ValidationRule[];
}

// 通用验证器类
class Validator {
  // 验证单个字段
  static validateField(value: any, rule: ValidationRule): string | null {
    const { field, required, type, minLength, maxLength, min, max, pattern, enum: enumValues, custom } = rule;
    
    // 检查必填
    if (required && (value === undefined || value === null || value === '')) {
      return `${field}是必填字段`;
    }
    
    // 如果不是必填且值为空，跳过后续验证
    if (!required && (value === undefined || value === null || value === '')) {
      return null;
    }
    
    // 类型验证
    if (type) {
      switch (type) {
        case 'string':
          if (typeof value !== 'string') {
            return `${field}必须是字符串类型`;
          }
          break;
          
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            return `${field}必须是数字类型`;
          }
          break;
          
        case 'boolean':
          if (typeof value !== 'boolean') {
            return `${field}必须是布尔类型`;
          }
          break;
          
        case 'email':
          if (!this.isValidEmail(value)) {
            return `${field}必须是有效的邮箱地址`;
          }
          break;
          
        case 'uuid':
          if (!this.isValidUUID(value)) {
            return `${field}必须是有效的UUID格式`;
          }
          break;
          
        case 'array':
          if (!Array.isArray(value)) {
            return `${field}必须是数组类型`;
          }
          break;
          
        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            return `${field}必须是对象类型`;
          }
          break;
          
        case 'date':
          if (!this.isValidDate(value)) {
            return `${field}必须是有效的日期格式`;
          }
          break;
      }
    }
    
    // 字符串长度验证
    if (typeof value === 'string') {
      if (minLength !== undefined && value.length < minLength) {
        return `${field}长度不能少于${minLength}个字符`;
      }
      if (maxLength !== undefined && value.length > maxLength) {
        return `${field}长度不能超过${maxLength}个字符`;
      }
    }
    
    // 数字范围验证
    if (typeof value === 'number') {
      if (min !== undefined && value < min) {
        return `${field}不能小于${min}`;
      }
      if (max !== undefined && value > max) {
        return `${field}不能大于${max}`;
      }
    }
    
    // 数组长度验证
    if (Array.isArray(value)) {
      if (minLength !== undefined && value.length < minLength) {
        return `${field}至少需要${minLength}个元素`;
      }
      if (maxLength !== undefined && value.length > maxLength) {
        return `${field}最多允许${maxLength}个元素`;
      }
    }
    
    // 正则表达式验证
    if (pattern && typeof value === 'string' && !pattern.test(value)) {
      return `${field}格式不正确`;
    }
    
    // 枚举值验证
    if (enumValues && !enumValues.includes(value)) {
      return `${field}必须是以下值之一: ${enumValues.join(', ')}`;
    }
    
    // 自定义验证
    if (custom) {
      const customResult = custom(value);
      if (customResult !== true) {
        return typeof customResult === 'string' ? customResult : `${field}验证失败`;
      }
    }
    
    return null;
  }
  
  // 辅助验证方法
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  
  static isValidDate(date: string): boolean {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }
  
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }
  
  static isValidCreditCode(code: string): boolean {
    const creditCodeRegex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
    return creditCodeRegex.test(code);
  }
}

// 验证中间件生成器
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    
    // 验证body参数
    if (schema.body) {
      for (const rule of schema.body) {
        const value = req.body[rule.field];
        const error = Validator.validateField(value, rule);
        if (error) {
          errors.push(error);
        }
      }
    }
    
    // 验证query参数
    if (schema.query) {
      for (const rule of schema.query) {
        const value = req.query[rule.field];
        const error = Validator.validateField(value, rule);
        if (error) {
          errors.push(error);
        }
      }
    }
    
    // 验证params参数
    if (schema.params) {
      for (const rule of schema.params) {
        const value = req.params[rule.field];
        const error = Validator.validateField(value, rule);
        if (error) {
          errors.push(error);
        }
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError('请求参数验证失败', { errors });
    }
    
    next();
  };
};

// 预定义的验证模式
export const validationSchemas = {
  // 用户相关验证
  createUser: validate({
    body: [
      { field: 'email', required: true, type: 'email' },
      { field: 'password', required: true, type: 'string', minLength: 6, maxLength: 50 },
      { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 50 },
      { field: 'department', required: true, type: 'string', maxLength: 100 },
      { field: 'role', required: true, type: 'string', enum: ['admin', 'manager', 'analyst', 'viewer'] }
    ]
  }),
  
  updateUser: validate({
    params: [
      { field: 'id', required: true, type: 'uuid' }
    ],
    body: [
      { field: 'email', type: 'email' },
      { field: 'name', type: 'string', minLength: 2, maxLength: 50 },
      { field: 'department', type: 'string', maxLength: 100 },
      { field: 'role', type: 'string', enum: ['admin', 'manager', 'analyst', 'viewer'] }
    ]
  }),
  
  // 企业相关验证
  createEnterprise: validate({
    body: [
      { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 500 },
      { field: 'credit_code', type: 'string', custom: (value) => !value || Validator.isValidCreditCode(value) },
      { field: 'industry', type: 'string', maxLength: 200 },
      { field: 'legal_representative', type: 'string', maxLength: 200 },
      { field: 'phone', type: 'string', custom: (value) => !value || Validator.isValidPhoneNumber(value) },
      { field: 'email', type: 'email' },
      { field: 'status', type: 'string', enum: ['active', 'inactive', 'dissolved'] },
      { field: 'risk_level', type: 'string', enum: ['low', 'medium', 'high'] }
    ]
  }),
  
  // 客户相关验证
  createClient: validate({
    body: [
      { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 255 },
      { field: 'company', required: true, type: 'string', minLength: 2, maxLength: 500 },
      { field: 'email', type: 'email' },
      { field: 'phone', type: 'string', custom: (value) => !value || Validator.isValidPhoneNumber(value) },
      { field: 'status', type: 'string', enum: ['active', 'inactive', 'potential', 'lost'] },
      { field: 'priority', type: 'string', enum: ['high', 'medium', 'low'] },
      { field: 'assigned_to', type: 'uuid' }
    ]
  }),
  
  // 关系相关验证
  createRelationship: validate({
    body: [
      { field: 'from_id', required: true, type: 'uuid' },
      { field: 'from_type', required: true, type: 'string', enum: ['enterprise', 'person', 'product'] },
      { field: 'to_id', required: true, type: 'uuid' },
      { field: 'to_type', required: true, type: 'string', enum: ['enterprise', 'person', 'product'] },
      { field: 'relationship_type', required: true, type: 'string', enum: ['investment', 'guarantee', 'supply', 'risk', 'employment', 'partnership', 'ownership', 'other'] },
      { field: 'strength', type: 'number', min: 0, max: 1 },
      { field: 'is_directional', type: 'boolean' }
    ]
  }),
  
  // 搜索相关验证
  search: validate({
    body: [
      { field: 'keyword', type: 'string', minLength: 1, maxLength: 500 },
      { field: 'entityType', type: 'string', enum: ['all', 'enterprises', 'clients', 'relationships'] },
      { field: 'page', type: 'number', min: 1 },
      { field: 'pageSize', type: 'number', min: 1, max: 100 }
    ]
  }),
  
  // 分页验证
  pagination: validate({
    query: [
      { field: 'page', type: 'string', custom: (value) => !value || (!isNaN(Number(value)) && Number(value) >= 1) },
      { field: 'pageSize', type: 'string', custom: (value) => !value || (!isNaN(Number(value)) && Number(value) >= 1 && Number(value) <= 100) },
      { field: 'sortBy', type: 'string' },
      { field: 'sortOrder', type: 'string', enum: ['asc', 'desc'] }
    ]
  }),
  
  // UUID参数验证
  uuidParam: validate({
    params: [
      { field: 'id', required: true, type: 'uuid' }
    ]
  }),
  
  // 登录验证
  login: validate({
    body: [
      { field: 'email', required: true, type: 'email' },
      { field: 'password', required: true, type: 'string', minLength: 1 }
    ]
  }),
  
  // 修改密码验证
  changePassword: validate({
    body: [
      { field: 'currentPassword', required: true, type: 'string' },
      { field: 'newPassword', required: true, type: 'string', minLength: 6, maxLength: 50 }
    ]
  })
};

// 文件上传验证
export const validateFileUpload = (allowedTypes: string[], maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file && !req.files) {
      throw createValidationError('请选择要上传的文件');
    }
    
    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.file]) : [req.file];
    
    for (const file of files) {
      if (!file) continue;
      
      // 检查文件类型
      if (!allowedTypes.includes(file.mimetype)) {
        throw createValidationError(`不支持的文件类型，仅支持: ${allowedTypes.join(', ')}`);
      }
      
      // 检查文件大小
      if (file.size > maxSize) {
        throw createValidationError(`文件大小超过限制，最大允许${Math.round(maxSize / 1024 / 1024)}MB`);
      }
    }
    
    next();
  };
};

export { Validator };
export default validate;