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

// 企业数据类型
export interface Enterprise {
  id: string;
  name: string;
  creditCode: string; // 统一社会信用代码
  registrationAddress: string;
  establishmentDate: string;
  registeredCapital: number;
  industry: string;
  businessScope: string;
  employeeCount?: number;
  contactPhone?: string;
  legalRepresentative?: string;
  businessStatus: 'active' | 'inactive' | 'cancelled' | 'suspended';
  
  // 评分系统
  svsScore?: number; // Supply chain Vulnerability Score
  desScore?: number; // Digital Economy Score  
  nisScore?: number; // Network Influence Score
  pcsScore?: number; // Partner Compatibility Score
  
  // 分类标签
  isClient: boolean;
  isProspect: boolean;
  clientLevel?: 'A' | 'B' | 'C' | 'D';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
  lastContactDate?: string;
}

// 关系数据类型
export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  sourceType: 'enterprise' | 'person' | 'product';
  targetType: 'enterprise' | 'person' | 'product';
  relationshipType: 'investment' | 'guarantee' | 'supply' | 'risk' | 'other';
  
  // 关系详情
  description?: string;
  strength: number; // 关系强度 0-1
  confidence: number; // 可信度 0-1
  startDate?: string;
  endDate?: string;
  
  // 元数据
  dataSource: string;
  verificationStatus: 'verified' | 'pending' | 'disputed';
  createdAt: string;
  updatedAt: string;
}

// 个人数据类型
export interface Person {
  id: string;
  name: string;
  idNumber?: string; // 身份证号（加密）
  phone?: string;
  email?: string;
  position?: string;
  
  // 关联信息
  enterprises: string[]; // 关联企业ID列表
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// 产品数据类型
export interface Product {
  id: string;
  name: string;
  type: 'loan' | 'credit' | 'investment' | 'insurance' | 'other';
  description?: string;
  
  // 产品参数
  minAmount?: number;
  maxAmount?: number;
  interestRate?: number;
  term?: string;
  
  // 状态
  status: 'active' | 'inactive' | 'discontinued';
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
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
  [key: string]: any;
}

// 图谱边类型
export interface GraphLink {
  id?: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'investment' | 'guarantee' | 'supply' | 'risk' | 'other';
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

// 客户数据类型
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

// 搜索参数类型
export interface SearchParams {
  query?: string;
  type?: 'all' | 'enterprise' | 'person' | 'product';
  industry?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 筛选参数类型
export interface FilterParams {
  industries?: string[];
  businessStatus?: string[];
  clientLevels?: string[];
  riskLevels?: string[];
  scoreRange?: {
    min: number;
    max: number;
    scoreType: 'svs' | 'des' | 'nis' | 'pcs';
  };
  dateRange?: {
    startDate: string;
    endDate: string;
    dateType: 'created' | 'updated' | 'establishment';
  };
}

// 数据导入/导出类型
export interface DataImportTask {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  
  // 任务信息
  dataType: 'enterprise' | 'relationship' | 'person' | 'product';
  fileName: string;
  fileSize: number;
  totalRecords?: number;
  processedRecords?: number;
  errorRecords?: number;
  
  // 时间戳
  startTime: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
  
  // 错误信息
  errors?: string[];
}

// 数据源状态类型
export interface DataSource {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'warning' | 'error' | 'maintenance';
  
  // 统计信息
  recordCount: number;
  dataSize: string;
  lastUpdate: string;
  lastSync?: string;
  
  // 连接信息
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  responseTime?: number;
  
  // 配置
  config: Record<string, any>;
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// 分析报告类型
export interface AnalyticsReport {
  id: string;
  name: string;
  type: 'enterprise_analysis' | 'relationship_analysis' | 'risk_assessment' | 'market_analysis';
  status: 'generating' | 'completed' | 'failed';
  
  // 报告内容
  data: Record<string, any>;
  charts: ChartData[];
  summary: string;
  recommendations: string[];
  
  // 参数
  parameters: Record<string, any>;
  
  // 时间戳
  generatedAt: string;
  validUntil?: string;
}

// 图表数据类型
export interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'network' | 'heatmap';
  data: any[];
  config: Record<string, any>;
}

// 系统配置类型
export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  category: string;
  updatedBy: string;
  updatedAt: string;
}

// 操作日志类型
export interface OperationLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  
  // 详情
  description: string;
  parameters?: Record<string, any>;
  result: 'success' | 'failure';
  errorMessage?: string;
  
  // 元数据
  ipAddress: string;
  userAgent: string;
  timestamp: string;
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
    svsScore: number;
    desScore: number;
    nisScore: number;
    pcsScore: number;
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