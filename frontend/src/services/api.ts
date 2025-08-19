import { 
  ApiResponse, 
  PaginatedResponse,
  Enterprise, 
  Person, 
  Product, 
  Client, 
  Relationship, 
  GraphData,
  GraphNode,
  SearchParams,
  FilterParams,
  DataImportTask,
  DataSource,
  AnalyticsReport,
  DatabaseEntity,
  EntityType,
  OperationLog,
  Task,
  Event,
  Prospect
} from '@/types/database';

// API配置
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// HTTP客户端类
class HttpClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string, timeout: number = 30000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // 设置认证token
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // 移除认证token
  removeAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // GET请求
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request<T>(url, { method: 'GET' });
  }

  // POST请求
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT请求
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE请求
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // PATCH请求
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// 创建HTTP客户端实例
const httpClient = new HttpClient(API_CONFIG.baseURL, API_CONFIG.timeout);

// API缓存管理
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5分钟

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

const apiCache = new ApiCache();

// 自动设置认证token
const initializeAuth = () => {
  const token = localStorage.getItem('eig_token');
  if (token) {
    httpClient.setAuthToken(token);
  }
};

// 初始化认证
initializeAuth();

// 监听token变化
window.addEventListener('storage', (e) => {
  if (e.key === 'eig_token') {
    if (e.newValue) {
      httpClient.setAuthToken(e.newValue);
    } else {
      httpClient.removeAuthToken();
      apiCache.clear();
    }
  }
});

// 认证服务
export class AuthService {
  // 用户登录
  static async login(credentials: { email: string; password: string }): Promise<ApiResponse<{
    user: any;
    token: string;
    expiresAt: string;
  }>> {
    return await httpClient.post<ApiResponse<any>>('/auth/login', credentials);
  }

  // 获取当前用户信息
  static async getCurrentUser(): Promise<ApiResponse<any>> {
    return await httpClient.get<ApiResponse<any>>('/auth/me');
  }

  // 用户登出
  static async logout(): Promise<ApiResponse<any>> {
    return await httpClient.post<ApiResponse<any>>('/auth/logout');
  }

  // 刷新token
  static async refreshToken(): Promise<ApiResponse<any>> {
    return await httpClient.post<ApiResponse<any>>('/auth/refresh');
  }
}

// 企业数据服务
export class EnterpriseService {
  // 获取企业列表
  static async getEnterprises(
    params: SearchParams & FilterParams = {}
  ): Promise<PaginatedResponse<Enterprise>> {
    const cacheKey = `enterprises_${JSON.stringify(params)}`;
    const cached = apiCache.get<PaginatedResponse<Enterprise>>(cacheKey);
    if (cached) return cached;

    // 转换分页参数：pageSize -> limit
    const apiParams = {
      ...params,
      limit: params.pageSize || 20,
    };
    // 移除前端特有的参数
    delete apiParams.pageSize;
    
    const response = await httpClient.get<PaginatedResponse<Enterprise>>('/enterprises', apiParams);
    
    apiCache.set(cacheKey, response, 2 * 60 * 1000); // 2分钟缓存
    return response;
  }

  // 获取单个企业
  static async getEnterprise(id: string): Promise<ApiResponse<Enterprise>> {
    const cacheKey = `enterprise_${id}`;
    const cached = apiCache.get<ApiResponse<Enterprise>>(cacheKey);
    if (cached) return cached;

    const response = await httpClient.get<ApiResponse<Enterprise>>(`/enterprises/${id}`);
    apiCache.set(cacheKey, response);
    return response;
  }

  // 创建企业
  static async createEnterprise(enterprise: Partial<Enterprise>): Promise<ApiResponse<Enterprise>> {
    const response = await httpClient.post<ApiResponse<Enterprise>>('/enterprises', enterprise);
    // 清除相关缓存
    apiCache.clear();
    return response;
  }

  // 更新企业
  static async updateEnterprise(id: string, enterprise: Partial<Enterprise>): Promise<ApiResponse<Enterprise>> {
    const response = await httpClient.put<ApiResponse<Enterprise>>(`/enterprises/${id}`, enterprise);
    // 清除相关缓存
    apiCache.delete(`enterprise_${id}`);
    return response;
  }

  // 删除企业
  static async deleteEnterprise(id: string): Promise<ApiResponse<boolean>> {
    const response = await httpClient.delete<ApiResponse<boolean>>(`/enterprises/${id}`);
    // 清除相关缓存
    apiCache.delete(`enterprise_${id}`);
    return response;
  }

  // 获取企业关系图谱
  static async getEnterpriseGraph(id: string): Promise<ApiResponse<GraphData>> {
    const cacheKey = `enterprise_graph_${id}`;
    const cached = apiCache.get<ApiResponse<GraphData>>(cacheKey);
    if (cached) return cached;

    // 使用正确的图谱API路径
    const response = await httpClient.get<ApiResponse<GraphData>>(`/graph/enterprise/${id}`);
    apiCache.set(cacheKey, response, 5 * 60 * 1000); // 5分钟缓存
    return response;
  }

  // 计算企业评分
  static async calculateScore(id: string): Promise<ApiResponse<{
    svs: number;
    des: number;
    nis: number;
    pcs: number;
  }>> {
    const response = await httpClient.post<ApiResponse<{
      svs: number;
      des: number;
      nis: number;
      pcs: number;
    }>>(`/enterprises/${id}/calculate-score`);
    
    // 清除该企业的缓存
    apiCache.delete(`enterprise_${id}`);
    
    return response;
  }
}

// 图谱数据服务
export class GraphService {
  // 获取完整图谱
  static async getFullGraph(filters?: FilterParams): Promise<ApiResponse<GraphData>> {
    const cacheKey = `full_graph_${JSON.stringify(filters || {})}`;
    const cached = apiCache.get<ApiResponse<GraphData>>(cacheKey);
    if (cached) return cached;

    const response = await httpClient.get<ApiResponse<GraphData>>('/graph', filters);
    apiCache.set(cacheKey, response, 3 * 60 * 1000); // 3分钟缓存
    return response;
  }

  // 查找最短路径
  static async findShortestPath(fromId: string, toId: string): Promise<ApiResponse<any>> {
    return await httpClient.get<ApiResponse<any>>('/graph/path', { fromId, toId });
  }

  // 获取节点邻居 - 修改为使用正确的API
  static async getNodeNeighbors(nodeId: string, depth: number = 1): Promise<ApiResponse<GraphData>> {
    return await httpClient.get<ApiResponse<GraphData>>(`/graph/enterprise/${nodeId}`, { depth });
  }

  // 创建关系
  static async createRelationship(relationship: {
    fromId: string;
    fromType: string;
    toId: string;
    toType: string;
    relationshipType: string;
    strength?: number;
    description?: string;
    metadata?: any;
  }): Promise<ApiResponse<any>> {
    const response = await httpClient.post<ApiResponse<any>>('/graph/relationships', relationship);
    apiCache.clear(); // 清除图谱相关缓存
    return response;
  }

  // 更新关系
  static async updateRelationship(id: string, updates: {
    relationshipType?: string;
    strength?: number;
    description?: string;
    metadata?: any;
  }): Promise<ApiResponse<any>> {
    const response = await httpClient.put<ApiResponse<any>>(`/graph/relationships/${id}`, updates);
    apiCache.clear();
    return response;
  }

  // 删除关系
  static async deleteRelationship(id: string): Promise<ApiResponse<any>> {
    const response = await httpClient.delete<ApiResponse<any>>(`/graph/relationships/${id}`);
    apiCache.clear();
    return response;
  }

  // 获取图谱统计信息
  static async getGraphStats(): Promise<ApiResponse<any>> {
    const cacheKey = 'graph_stats';
    const cached = apiCache.get<ApiResponse<any>>(cacheKey);
    if (cached) return cached;

    const response = await httpClient.get<ApiResponse<any>>('/graph/stats');
    apiCache.set(cacheKey, response, 2 * 60 * 1000); // 2分钟缓存
    return response;
  }

  // 搜索节点
  static async searchNodes(query: string, type?: string, limit: number = 20): Promise<ApiResponse<any>> {
    return await httpClient.get<ApiResponse<any>>('/graph/search/nodes', { query, type, limit });
  }
}

// 客户数据服务
export class ClientService {
  // 获取客户列表
  static async getClients(params: SearchParams & FilterParams = {}): Promise<PaginatedResponse<Client>> {
    const cacheKey = `clients_${JSON.stringify(params)}`;
    const cached = apiCache.get<PaginatedResponse<Client>>(cacheKey);
    if (cached) return cached;

    const response = await httpClient.get<PaginatedResponse<Client>>('/clients', params);
    apiCache.set(cacheKey, response, 2 * 60 * 1000);
    return response;
  }

  // 获取单个客户
  static async getClient(id: string): Promise<ApiResponse<Client>> {
    const cacheKey = `client_${id}`;
    const cached = apiCache.get<ApiResponse<Client>>(cacheKey);
    if (cached) return cached;

    const response = await httpClient.get<ApiResponse<Client>>(`/clients/${id}`);
    apiCache.set(cacheKey, response);
    return response;
  }

  // 创建客户
  static async createClient(client: Partial<Client>): Promise<ApiResponse<Client>> {
    const response = await httpClient.post<ApiResponse<Client>>('/clients', client);
    apiCache.clear();
    return response;
  }

  // 更新客户
  static async updateClient(id: string, client: Partial<Client>): Promise<ApiResponse<Client>> {
    const response = await httpClient.put<ApiResponse<Client>>(`/clients/${id}`, client);
    apiCache.delete(`client_${id}`);
    return response;
  }

  // 删除客户
  static async deleteClient(id: string): Promise<ApiResponse<boolean>> {
    const response = await httpClient.delete<ApiResponse<boolean>>(`/clients/${id}`);
    apiCache.delete(`client_${id}`);
    return response;
  }

  // 批量更新客户状态
  static async batchUpdateStatus(clientIds: string[], status: string): Promise<ApiResponse<any>> {
    const response = await httpClient.patch<ApiResponse<any>>('/clients/batch/status', { clientIds, status });
    apiCache.clear(); // 清除客户相关缓存
    return response;
  }

  // 获取客户统计信息
  static async getClientStats(): Promise<ApiResponse<any>> {
    const cacheKey = 'client_stats';
    const cached = apiCache.get<ApiResponse<any>>(cacheKey);
    if (cached) return cached;

    const response = await httpClient.get<ApiResponse<any>>('/clients/stats/overview');
    apiCache.set(cacheKey, response, 60 * 1000); // 1分钟缓存
    return response;
  }

  // 添加客户跟进记录
  static async addFollowUp(clientId: string, notes: string, nextFollowUp?: string): Promise<ApiResponse<any>> {
    const response = await httpClient.post<ApiResponse<any>>(`/clients/${clientId}/follow-up`, {
      notes,
      nextFollowUp
    });
    apiCache.delete(`client_${clientId}`); // 清除该客户的缓存
    return response;
  }
}

// 搜索服务
export class SearchService {
  // 通用实体搜索
  static async searchEntities(
    query: string, 
    params: SearchParams = {}
  ): Promise<PaginatedResponse<DatabaseEntity>> {
    return await httpClient.get<PaginatedResponse<DatabaseEntity>>('/search', { query, ...params });
  }

  // 搜索建议
  static async getSuggestions(query: string, type?: EntityType): Promise<ApiResponse<DatabaseEntity[]>> {
    return await httpClient.get<ApiResponse<DatabaseEntity[]>>('/search/suggestions', { query, type });
  }
}

// 用户管理服务
export class UserService {
  // 获取用户列表
  static async getUsers(params: SearchParams & FilterParams = {}): Promise<PaginatedResponse<any>> {
    return await httpClient.get<PaginatedResponse<any>>('/users', params);
  }

  // 获取用户详情
  static async getUser(id: string): Promise<ApiResponse<any>> {
    return await httpClient.get<ApiResponse<any>>(`/users/${id}`);
  }

  // 创建用户
  static async createUser(userData: any): Promise<ApiResponse<any>> {
    return await httpClient.post<ApiResponse<any>>('/users', userData);
  }

  // 更新用户
  static async updateUser(id: string, userData: any): Promise<ApiResponse<any>> {
    return await httpClient.put<ApiResponse<any>>(`/users/${id}`, userData);
  }

  // 删除用户
  static async deleteUser(id: string): Promise<ApiResponse<boolean>> {
    return await httpClient.delete<ApiResponse<boolean>>(`/users/${id}`);
  }

  // 更新用户状态
  static async updateUserStatus(id: string, isActive: boolean): Promise<ApiResponse<any>> {
    return await httpClient.patch<ApiResponse<any>>(`/users/${id}/status`, { isActive });
  }

  // 获取用户统计
  static async getUserStats(): Promise<ApiResponse<any>> {
    return await httpClient.get<ApiResponse<any>>('/users/stats/overview');
  }

  // 批量更新用户状态
  static async batchUpdateStatus(userIds: string[], isActive: boolean): Promise<ApiResponse<any>> {
    return await httpClient.patch<ApiResponse<any>>('/users/batch/status', { userIds, isActive });
  }

  // 修改密码
  static async changePassword(id: string, currentPassword: string, newPassword: string): Promise<ApiResponse<any>> {
    return await httpClient.put<ApiResponse<any>>(`/users/${id}/password`, {
      currentPassword,
      newPassword
    });
  }
}

// 搜索服务增强
export class SearchServiceEnhanced extends SearchService {
  // 高级搜索
  static async advancedSearch(searchParams: {
    keyword?: string;
    entityType?: string;
    filters?: any;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    return await httpClient.post<ApiResponse<any>>('/search/advanced', searchParams);
  }

  // 获取搜索建议
  static async getSearchSuggestions(query: string, type?: string): Promise<ApiResponse<any>> {
    return await httpClient.get<ApiResponse<any>>('/search/suggestions', { query, type });
  }

  // 获取热门搜索
  static async getPopularSearches(): Promise<ApiResponse<any>> {
    return await httpClient.get<ApiResponse<any>>('/search/popular');
  }
}

// 数据管理服务
export class DataService {
  // 获取数据源状态
  static async getDataSources(): Promise<PaginatedResponse<DataSource>> {
    return await httpClient.get<PaginatedResponse<DataSource>>('/data/sources');
  }

  // 创建数据源
  static async createDataSource(dataSource: {
    name: string;
    type: string;
    config: any;
  }): Promise<ApiResponse<DataSource>> {
    return await httpClient.post<ApiResponse<DataSource>>('/data/sources', dataSource);
  }

  // 获取导入任务
  static async getImportTasks(status?: string): Promise<PaginatedResponse<DataImportTask>> {
    return await httpClient.get<PaginatedResponse<DataImportTask>>('/data/tasks', { status });
  }

  // 创建导入任务
  static async createImportTask(task: {
    name: string;
    sourceId: string;
    sourceName: string;
  }): Promise<ApiResponse<DataImportTask>> {
    return await httpClient.post<ApiResponse<DataImportTask>>('/data/import', task);
  }

  // 更新任务状态
  static async updateTaskStatus(taskId: string, updates: {
    status?: string;
    progress?: number;
    processedRecords?: number;
    errorRecords?: number;
    errorMessage?: string;
  }): Promise<ApiResponse<DataImportTask>> {
    return await httpClient.put<ApiResponse<DataImportTask>>(`/data/tasks/${taskId}`, updates);
  }

  // 开始数据导入 - 保持原有的文件上传方法
  static async startImport(file: File, dataType: string): Promise<ApiResponse<DataImportTask>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataType', dataType);
    
    const response = await fetch(`${API_CONFIG.baseURL}/data/import`, {
      method: 'POST',
      headers: {
        'Authorization': httpClient['defaultHeaders']['Authorization'] || '',
      },
      body: formData,
    });

    return await response.json();
  }
}

// 任务管理服务
export class TaskService {
  // 获取任务列表
  static async getTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assigned_to?: string;
  }): Promise<PaginatedResponse<Task>> {
    return await httpClient.get<PaginatedResponse<Task>>('/tasks', params);
  }

  // 获取单个任务
  static async getTask(id: string): Promise<ApiResponse<Task>> {
    return await httpClient.get<ApiResponse<Task>>(`/tasks/${id}`);
  }

  // 创建任务
  static async createTask(task: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    assigned_to?: string;
    due_date?: string;
    tags?: string[];
  }): Promise<ApiResponse<Task>> {
    return await httpClient.post<ApiResponse<Task>>('/tasks', task);
  }

  // 更新任务
  static async updateTask(id: string, updates: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    assigned_to?: string;
    due_date?: string;
    tags?: string[];
  }): Promise<ApiResponse<Task>> {
    return await httpClient.put<ApiResponse<Task>>(`/tasks/${id}`, updates);
  }

  // 删除任务
  static async deleteTask(id: string): Promise<ApiResponse<Task>> {
    return await httpClient.delete<ApiResponse<Task>>(`/tasks/${id}`);
  }

  // 批量更新任务状态
  static async batchUpdateStatus(taskIds: string[], status: string): Promise<ApiResponse<Task[]>> {
    return await httpClient.patch<ApiResponse<Task[]>>('/tasks/batch/status', {
      task_ids: taskIds,
      status
    });
  }
}

// 事件管理服务
export class EventService {
  // 获取事件列表
  static async getEvents(params?: {
    page?: number;
    limit?: number;
    event_type?: string;
    importance_min?: number;
    enterprise_id?: string;
  }): Promise<PaginatedResponse<Event>> {
    return await httpClient.get<PaginatedResponse<Event>>('/events', params);
  }

  // 获取单个事件
  static async getEvent(id: string): Promise<ApiResponse<Event>> {
    return await httpClient.get<ApiResponse<Event>>(`/events/${id}`);
  }

  // 创建事件
  static async createEvent(event: {
    title: string;
    description?: string;
    event_type: string;
    enterprise_id: string;
    date?: string;
    importance?: number;
    source?: string;
    metadata?: any;
  }): Promise<ApiResponse<Event>> {
    return await httpClient.post<ApiResponse<Event>>('/events', event);
  }

  // 更新事件
  static async updateEvent(id: string, updates: {
    title?: string;
    description?: string;
    event_type?: string;
    enterprise_id?: string;
    date?: string;
    importance?: number;
    source?: string;
    metadata?: any;
  }): Promise<ApiResponse<Event>> {
    return await httpClient.put<ApiResponse<Event>>(`/events/${id}`, updates);
  }

  // 删除事件
  static async deleteEvent(id: string): Promise<ApiResponse<Event>> {
    return await httpClient.delete<ApiResponse<Event>>(`/events/${id}`);
  }
}

// 潜客管理服务
export class ProspectService {
  // 获取潜客列表
  static async getProspects(params?: {
    page?: number;
    limit?: number;
    industry?: string;
    score_min?: number;
    status?: string;
    priority?: string;
  }): Promise<PaginatedResponse<Prospect>> {
    return await httpClient.get<PaginatedResponse<Prospect>>('/prospects', params);
  }

  // 获取高优先级潜客
  static async getHighPriorityProspects(limit = 5): Promise<ApiResponse<Prospect[]>> {
    return await httpClient.get<ApiResponse<Prospect[]>>('/prospects/high-priority', { limit });
  }

  // 获取单个潜客
  static async getProspect(id: string): Promise<ApiResponse<Prospect>> {
    return await httpClient.get<ApiResponse<Prospect>>(`/prospects/${id}`);
  }

  // 创建潜客
  static async createProspect(prospect: {
    name: string;
    industry: string;
    registeredCapital?: number;
    employeeCount?: number;
    svs?: number;
    des?: number;
    nis?: number;
    pcs?: number;
    discoveryPath?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: string;
    contactInfo?: any;
    notes?: string;
  }): Promise<ApiResponse<Prospect>> {
    return await httpClient.post<ApiResponse<Prospect>>('/prospects', prospect);
  }

  // 更新潜客
  static async updateProspect(id: string, updates: {
    name?: string;
    industry?: string;
    registeredCapital?: number;
    employeeCount?: number;
    svs?: number;
    des?: number;
    nis?: number;
    pcs?: number;
    discoveryPath?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: string;
    contactInfo?: any;
    notes?: string;
  }): Promise<ApiResponse<Prospect>> {
    return await httpClient.put<ApiResponse<Prospect>>(`/prospects/${id}`, updates);
  }

  // 删除潜客
  static async deleteProspect(id: string): Promise<ApiResponse<Prospect>> {
    return await httpClient.delete<ApiResponse<Prospect>>(`/prospects/${id}`);
  }

  // 批量更新潜客状态
  static async batchUpdateStatus(prospectIds: string[], status: string): Promise<ApiResponse<Prospect[]>> {
    return await httpClient.patch<ApiResponse<Prospect[]>>('/prospects/batch/status', {
      prospect_ids: prospectIds,
      status
    });
  }
}

// 设置认证token
export function setAuthToken(token: string) {
  httpClient.setAuthToken(token);
  localStorage.setItem('eig_token', token);
}

// 移除认证token
export function removeAuthToken() {
  httpClient.removeAuthToken();
  localStorage.removeItem('eig_token');
  apiCache.clear();
}

// 清除缓存
export function clearCache() {
  apiCache.clear();
}

// 导出所有服务
export const ApiService = {
  Auth: AuthService,
  Enterprise: EnterpriseService,
  Graph: GraphService,
  Client: ClientService,
  Search: SearchService,
  SearchEnhanced: SearchServiceEnhanced,
  User: UserService,
  Data: DataService,
  Task: TaskService,
  Event: EventService,
  Prospect: ProspectService,
  setAuthToken,
  removeAuthToken,
  clearCache,
};

export default ApiService; 