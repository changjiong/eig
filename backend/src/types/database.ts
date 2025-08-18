// 基础接口定义
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

// 用户系统
export type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';
export type Permission =
  | 'view_dashboard' | 'view_enterprise' | 'view_graph' | 'view_prospects'
  | 'view_search' | 'view_clients' | 'manage_data' | 'manage_system'
  | 'export_data' | 'import_data' | 'user_management';

export interface User {
  id: string;
  email: string;
  name: string;
  department: string;
  role: UserRole;
  permissions: Permission[];
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'id'>;
  token: string;
  expiresAt: string;
}

// 企业数据
export interface Enterprise {
  id: string;
  name: string;
  legalName: string;
  creditCode: string;
  registrationNumber: string;
  industry: string;
  establishDate: Date;
  registeredCapital: number;
  businessScope: string;
  legalRepresentative: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  status: 'active' | 'inactive' | 'dissolved';
  riskLevel: 'low' | 'medium' | 'high';
  
  // 评分系统
  svs: number; // 供应商价值评分
  des: number; // 需求企业评分
  nis: number; // 网络影响评分
  pcs: number; // 合作潜力评分
  
  // 关系统计
  supplierCount: number;
  customerCount: number;
  partnerCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// 人员数据
export interface Person {
  id: string;
  name: string;
  gender?: 'male' | 'female';
  birthDate?: Date;
  education?: string;
  position: string;
  company: string;
  companyId: string;
  phone?: string;
  email?: string;
  linkedinUrl?: string;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

// 产品数据
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  manufacturer: string;
  manufacturerId: string;
  price?: number;
  currency?: string;
  specifications?: Record<string, any>;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 关系网络
export interface Relationship {
  id: string;
  fromId: string;
  fromType: 'enterprise' | 'person' | 'product';
  toId: string;
  toType: 'enterprise' | 'person' | 'product';
  relationshipType: 'investment' | 'guarantee' | 'supply' | 'risk' | 'employment' | 'partnership' | 'ownership' | 'other';
  strength: number; // 关系强度 0-1
  isDirectional: boolean;
  startDate?: Date;
  endDate?: Date;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// 图谱数据
export interface GraphNode {
  id: string;
  name: string;
  type: 'enterprise' | 'person' | 'product';
  value: number;
  industry?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'investment' | 'guarantee' | 'supply' | 'risk' | 'other';
  value: number;
  strength?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// 客户管理
export interface Client {
  id: string;
  name: string;
  company: string;
  industry: string;
  position: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'potential' | 'lost';
  priority: 'high' | 'medium' | 'low';
  assignedTo: string; // 负责人ID
  assignedToName: string; // 负责人姓名
  lastContact?: Date | undefined;
  nextFollowUp?: Date | undefined;
  estimatedValue?: number | undefined;
  notes: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 搜索和筛选
export interface SearchParams {
  keyword?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  industry?: string[];
  status?: string[];
  riskLevel?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// 数据管理
export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'web_scraping';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: Date | undefined;
  totalRecords: number;
  errorCount: number;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataImportTask {
  id: string;
  name: string;
  sourceId: string;
  sourceName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  startTime?: Date | undefined;
  endTime?: Date | undefined;
  errorMessage?: string;
  createdBy: string;
  createdAt: Date;
}

// 分析报告
export interface AnalyticsReport {
  id: string;
  title: string;
  type: 'enterprise_analysis' | 'market_analysis' | 'risk_analysis' | 'network_analysis';
  parameters: Record<string, any>;
  results: Record<string, any>;
  status: 'generating' | 'completed' | 'failed';
  generatedBy: string;
  generatedAt: Date;
  expiresAt?: Date;
}

// 图表数据
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }>;
}

// 系统配置
export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'security' | 'performance' | 'integration';
  description: string;
  isPublic: boolean;
  updatedBy: string;
  updatedAt: Date;
}

// 操作日志
export interface OperationLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: 'success' | 'failure';
  errorMessage?: string;
}

// 数据库操作接口
export interface DatabaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EntityType = Enterprise | Person | Product | Client | User | Relationship;

// 通用数据库操作接口
export interface DatabaseOperations<T extends DatabaseEntity> {
  findById(id: string): Promise<ApiResponse<T>>;
  findMany(params?: SearchParams & FilterParams): Promise<PaginatedResponse<T>>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<T>>;
  update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<T>>;
  delete(id: string): Promise<ApiResponse<boolean>>;
  bulkCreate(data: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<T[]>>;
  bulkUpdate(updates: Array<{ id: string; data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> }>): Promise<ApiResponse<T[]>>;
  bulkDelete(ids: string[]): Promise<ApiResponse<boolean>>;
  count(params?: FilterParams): Promise<ApiResponse<number>>;
}

// 业务操作接口
export interface BusinessOperations {
  // 企业相关
  getEnterpriseNetwork(id: string, depth?: number): Promise<ApiResponse<GraphData>>;
  calculateEnterpriseScores(id: string): Promise<ApiResponse<{ svs: number; des: number; nis: number; pcs: number }>>;
  findSimilarEnterprises(id: string, limit?: number): Promise<ApiResponse<Enterprise[]>>;
  
  // 关系分析
  findShortestPath(fromId: string, toId: string): Promise<ApiResponse<Relationship[]>>;
  analyzeRelationshipStrength(fromId: string, toId: string): Promise<ApiResponse<{ strength: number; factors: string[] }>>;
  
  // 风险分析
  assessRisk(entityId: string, entityType: 'enterprise' | 'person'): Promise<ApiResponse<{ level: string; factors: string[] }>>;
  
  // 推荐系统
  recommendClients(userId: string, limit?: number): Promise<ApiResponse<Client[]>>;
  recommendPartners(enterpriseId: string, limit?: number): Promise<ApiResponse<Enterprise[]>>;
} 