// 基础响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 企业数据类型 - 与后端保持一致
export interface Enterprise {
  id: string;
  name: string;
  legalName?: string;
  creditCode?: string;
  registrationNumber?: string;
  industry?: string;
  establishDate?: Date | string;
  registeredCapital?: number;
  businessScope?: string;
  legalRepresentative?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  status: 'active' | 'inactive' | 'dissolved';
  riskLevel: 'low' | 'medium' | 'high';
  
  // 评分系统 - 与后端字段名保持一致
  svs?: number; // 供应商价值评分
  des?: number; // 需求企业评分
  nis?: number; // 网络影响评分
  pcs?: number; // 合作潜力评分
  
  // 关系统计
  supplierCount?: number;
  customerCount?: number;
  partnerCount?: number;
  
  // 前端特有的分类标签（可选）
  isClient?: boolean;
  isProspect?: boolean;
  clientLevel?: 'A' | 'B' | 'C' | 'D';
  
  // 时间戳
  createdAt: Date | string;
  updatedAt: Date | string;
  lastContactDate?: Date | string;
  
  // 兼容性字段（向后兼容）
  registrationAddress?: string;
  establishmentDate?: string;
  employeeCount?: number;
  contactPhone?: string;
  businessStatus?: 'active' | 'inactive' | 'cancelled' | 'suspended';
  svsScore?: number;
  desScore?: number;
  nisScore?: number;
  pcsScore?: number;
}

// 关系数据类型 - 与后端保持一致
export interface Relationship {
  id: string;
  fromId: string;
  fromType: 'enterprise' | 'person' | 'product';
  toId: string;
  toType: 'enterprise' | 'person' | 'product';
  relationshipType: 'investment' | 'guarantee' | 'supply' | 'risk' | 'employment' | 'partnership' | 'ownership' | 'other';
  
  // 关系详情
  strength: number; // 关系强度 0-1
  isDirectional?: boolean;
  startDate?: Date | string;
  endDate?: Date | string;
  description?: string;
  metadata?: Record<string, any>;
  
  // 时间戳
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // 兼容性字段（向后兼容）
  sourceId?: string;
  targetId?: string;
  sourceType?: 'enterprise' | 'person' | 'product';
  targetType?: 'enterprise' | 'person' | 'product';
  confidence?: number;
  dataSource?: string;
  verificationStatus?: 'verified' | 'pending' | 'disputed';
}

// 个人数据类型 - 与后端保持一致
export interface Person {
  id: string;
  name: string;
  gender?: 'male' | 'female';
  birthDate?: Date | string;
  education?: string;
  position?: string;
  company?: string;
  companyId?: string;
  phone?: string;
  email?: string;
  linkedinUrl?: string;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // 兼容性字段（向后兼容）
  idNumber?: string;
  enterprises?: string[];
}

// 产品数据类型 - 与后端保持一致
export interface Product {
  id: string;
  name: string;
  category?: string;
  description?: string;
  manufacturer?: string;
  manufacturerId?: string;
  price?: number;
  currency?: string;
  specifications?: Record<string, any>;
  tags?: string[];
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // 兼容性字段（向后兼容）
  type?: 'loan' | 'credit' | 'investment' | 'insurance' | 'other';
  minAmount?: number;
  maxAmount?: number;
  interestRate?: number;
  term?: string;
  status?: 'active' | 'inactive' | 'discontinued';
}

// 图谱节点类型
export interface GraphNode {
  id: string;
  name: string;
  type: 'enterprise' | 'person' | 'product';
  value?: number; // 节点重要性
  
  // 显示属性
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  
  // 额外属性
  industry?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
  [key: string]: any;
}

// 图谱边类型
export interface GraphLink {
  id?: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'investment' | 'guarantee' | 'supply' | 'risk' | 'employment' | 'partnership' | 'ownership' | 'other';
  value?: number; // 关系权重
  
  // 显示属性
  strength?: number;
  distance?: number;
}

// 图谱数据类型
export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// 客户数据类型 - 与后端保持一致
export interface Client {
  id: string;
  name: string;
  company: string;
  industry?: string;
  position?: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'potential' | 'lost';
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string; // 负责人ID
  assignedToName?: string; // 负责人姓名
  lastContact?: Date | string;
  nextFollowUp?: Date | string;
  estimatedValue?: number;
  notes?: string;
  tags?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 搜索参数类型
export interface SearchParams {
  query?: string;
  keyword?: string;
  type?: 'all' | 'enterprise' | 'person' | 'product';
  industry?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  limit?: number; // 后端兼容
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 筛选参数类型
export interface FilterParams {
  industries?: string[];
  businessStatus?: string[];
  clientLevels?: string[];
  riskLevels?: string[];
  riskLevel?: string[];
  scoreRange?: {
    min: number;
    max: number;
    scoreType: 'svs' | 'des' | 'nis' | 'pcs';
  };
  dateRange?: {
    startDate: string;
    endDate: string;
    dateType: 'created' | 'updated' | 'establishment';
    start?: Date;
    end?: Date;
  };
}

// 数据导入/导出类型
export interface DataImportTask {
  id: string;
  name: string;
  sourceId?: string;
  sourceName?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  
  // 任务信息
  dataType?: 'enterprise' | 'relationship' | 'person' | 'product';
  fileName?: string;
  fileSize?: number;
  totalRecords?: number;
  processedRecords?: number;
  errorRecords?: number;
  
  // 时间戳
  startTime?: Date | string;
  endTime?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdBy?: string;
  
  // 错误信息
  errors?: string[];
  errorMessage?: string;
}

// 数据源状态类型
export interface DataSource {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'warning' | 'error' | 'maintenance' | 'connected' | 'disconnected' | 'syncing';
  
  // 统计信息
  recordCount?: number;
  totalRecords?: number;
  errorCount?: number;
  dataSize?: string;
  lastUpdate?: string;
  lastSync?: Date | string;
  
  // 连接信息
  connectionStatus?: 'connected' | 'disconnected' | 'connecting';
  responseTime?: number;
  
  // 配置
  config: Record<string, any>;
  
  // 时间戳
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 分析报告类型
export interface AnalyticsReport {
  id: string;
  name?: string;
  title?: string;
  type: 'enterprise_analysis' | 'relationship_analysis' | 'risk_assessment' | 'market_analysis';
  status: 'generating' | 'completed' | 'failed';
  
  // 报告内容
  data?: Record<string, any>;
  results?: Record<string, any>;
  charts?: ChartData[];
  summary?: string;
  recommendations?: string[];
  
  // 参数
  parameters: Record<string, any>;
  
  // 时间戳
  generatedAt?: string;
  generatedBy?: string;
  validUntil?: string;
  expiresAt?: Date;
}

// 图表数据类型
export interface ChartData {
  id?: string;
  title?: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'network' | 'heatmap';
  data: any[];
  config?: Record<string, any>;
  labels?: string[];
  datasets?: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }>;
}

// 系统配置类型
export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'json';
  description?: string;
  category: string;
  isPublic?: boolean;
  updatedBy: string;
  updatedAt: string;
}

// 操作日志类型
export interface OperationLog {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  
  // 详情
  description?: string;
  details?: Record<string, any>;
  parameters?: Record<string, any>;
  result?: 'success' | 'failure';
  status?: 'success' | 'failure';
  errorMessage?: string;
  
  // 元数据
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date | string;
}

// 用户系统
export type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';
export type Permission =
  | 'view_dashboard' | 'view_enterprise' | 'view_graph' | 'view_prospects'
  | 'view_search' | 'view_clients' | 'manage_data' | 'manage_system'
  | 'export_data' | 'import_data' | 'user_management';

export interface User {
  id?: string;
  email: string;
  name: string;
  department: string;
  role: UserRole;
  permissions: Permission[];
  avatar?: string;
  isActive?: boolean;
  lastLogin?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: string;
}

// 导出所有类型的联合类型，方便使用
export type DatabaseEntity = Enterprise | Person | Product | Client | Relationship;
export type EntityType = 'enterprise' | 'person' | 'product' | 'client' | 'relationship';

// 数据库操作接口
export interface DatabaseOperations<T> {
  // CRUD 操作
  findById(id: string): Promise<ApiResponse<T>>;
  findMany(params?: SearchParams & FilterParams): Promise<PaginatedResponse<T>>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<T>>;
  update(id: string, data: Partial<T>): Promise<ApiResponse<T>>;
  delete(id: string): Promise<ApiResponse<boolean>>;
  
  // 批量操作
  bulkCreate(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<ApiResponse<T[]>>;
  bulkUpdate(updates: { id: string; data: Partial<T> }[]): Promise<ApiResponse<T[]>>;
  bulkDelete(ids: string[]): Promise<ApiResponse<boolean>>;
}

// 特定业务操作接口
export interface BusinessOperations {
  // 企业相关
  getEnterpriseGraph(id: string): Promise<ApiResponse<GraphData>>;
  getEnterpriseRelationships(id: string): Promise<ApiResponse<Relationship[]>>;
  calculateEnterpriseScore(id: string): Promise<ApiResponse<{
    svs: number;
    des: number;
    nis: number;
    pcs: number;
  }>>;
  
  // 图谱相关
  getFullGraph(filters?: FilterParams): Promise<ApiResponse<GraphData>>;
  findShortestPath(sourceId: string, targetId: string): Promise<ApiResponse<GraphNode[]>>;
  getNodeNeighbors(nodeId: string, depth: number): Promise<ApiResponse<GraphData>>;
  
  // 搜索相关
  searchEntities(query: string, params?: SearchParams): Promise<PaginatedResponse<DatabaseEntity>>;
  suggestEntities(query: string, type?: EntityType): Promise<ApiResponse<DatabaseEntity[]>>;
  
  // 分析相关
  generateReport(type: string, parameters: Record<string, any>): Promise<ApiResponse<AnalyticsReport>>;
  getAnalytics(entityId: string, entityType: EntityType): Promise<ApiResponse<Record<string, any>>>;
} 