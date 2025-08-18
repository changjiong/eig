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
  OperationLog
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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

// 企业数据服务
export class EnterpriseService {
  // 获取企业列表
  static async getEnterprises(
    params: SearchParams & FilterParams = {}
  ): Promise<PaginatedResponse<Enterprise>> {
    const cacheKey = `enterprises_${JSON.stringify(params)}`;
    const cached = apiCache.get<PaginatedResponse<Enterprise>>(cacheKey);
    if (cached) return cached;

    try {
      const response = await httpClient.get<PaginatedResponse<Enterprise>>('/enterprises', params);
      apiCache.set(cacheKey, response, 2 * 60 * 1000); // 2分钟缓存
      return response;
    } catch (error) {
      console.error('获取企业列表失败:', error);
      // 返回模拟数据作为后备
      return this.getMockEnterprises(params);
    }
  }

  // 获取单个企业
  static async getEnterprise(id: string): Promise<ApiResponse<Enterprise>> {
    const cacheKey = `enterprise_${id}`;
    const cached = apiCache.get<ApiResponse<Enterprise>>(cacheKey);
    if (cached) return cached;

    try {
      const response = await httpClient.get<ApiResponse<Enterprise>>(`/enterprises/${id}`);
      apiCache.set(cacheKey, response);
      return response;
    } catch (error) {
      console.error('获取企业信息失败:', error);
      return this.getMockEnterprise(id);
    }
  }

  // 获取企业关系图谱
  static async getEnterpriseGraph(id: string): Promise<ApiResponse<GraphData>> {
    const cacheKey = `enterprise_graph_${id}`;
    const cached = apiCache.get<ApiResponse<GraphData>>(cacheKey);
    if (cached) return cached;

    try {
      const response = await httpClient.get<ApiResponse<GraphData>>(`/enterprises/${id}/graph`);
      apiCache.set(cacheKey, response, 5 * 60 * 1000); // 5分钟缓存
      return response;
    } catch (error) {
      console.error('获取企业图谱失败:', error);
      return this.getMockEnterpriseGraph(id);
    }
  }

  // 计算企业评分
  static async calculateScore(id: string): Promise<ApiResponse<{
    svsScore: number;
    desScore: number;
    nisScore: number;
    pcsScore: number;
  }>> {
    try {
      return await httpClient.post(`/enterprises/${id}/calculate-score`);
    } catch (error) {
      console.error('计算企业评分失败:', error);
      // 返回模拟评分
      return {
        success: true,
        data: {
          svsScore: 87.5,
          desScore: 92.3,
          nisScore: 78.6,
          pcsScore: 86.1,
        }
      };
    }
  }

  // 模拟数据方法
  private static async getMockEnterprises(params: SearchParams & FilterParams): Promise<PaginatedResponse<Enterprise>> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockEnterprises: Enterprise[] = [
      {
        id: '1',
        name: '星达科技有限公司',
        creditCode: '91330106MA2GL1RQ5X',
        registrationAddress: '北京市海淀区中关村南大街5号',
        establishmentDate: '2018-03-15',
        registeredCapital: 80000000,
        industry: '信息技术服务',
        businessScope: '计算机软硬件技术开发、技术服务、技术咨询',
        employeeCount: 235,
        contactPhone: '010-88887777',
        legalRepresentative: '张三',
        businessStatus: 'active',
        svsScore: 87.5,
        desScore: 92.3,
        nisScore: 78.6,
        pcsScore: 86.1,
        isClient: true,
        isProspect: false,
        clientLevel: 'A',
        riskLevel: 'low',
        createdAt: '2023-01-15T08:00:00Z',
        updatedAt: '2025-01-15T08:00:00Z',
        lastContactDate: '2025-01-15T08:00:00Z',
      },
      // 可以添加更多模拟数据
    ];

    return {
      success: true,
      data: mockEnterprises,
      pagination: {
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        total: mockEnterprises.length,
        totalPages: Math.ceil(mockEnterprises.length / (params.pageSize || 20)),
      }
    };
  }

  private static async getMockEnterprise(id: string): Promise<ApiResponse<Enterprise>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockEnterprise: Enterprise = {
      id,
      name: '星达科技有限公司',
      creditCode: '91330106MA2GL1RQ5X',
      registrationAddress: '北京市海淀区中关村南大街5号',
      establishmentDate: '2018-03-15',
      registeredCapital: 80000000,
      industry: '信息技术服务',
      businessScope: '计算机软硬件技术开发、技术服务、技术咨询',
      employeeCount: 235,
      contactPhone: '010-88887777',
      legalRepresentative: '张三',
      businessStatus: 'active',
      svsScore: 87.5,
      desScore: 92.3,
      nisScore: 78.6,
      pcsScore: 86.1,
      isClient: true,
      isProspect: false,
      clientLevel: 'A',
      riskLevel: 'low',
      createdAt: '2023-01-15T08:00:00Z',
      updatedAt: '2025-01-15T08:00:00Z',
      lastContactDate: '2025-01-15T08:00:00Z',
    };

    return {
      success: true,
      data: mockEnterprise
    };
  }

  private static async getMockEnterpriseGraph(id: string): Promise<ApiResponse<GraphData>> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockGraphData: GraphData = {
      nodes: [
        { id: "ent1", name: "星达科技有限公司", type: "enterprise", value: 1.0 },
        { id: "ent2", name: "蓝海科技", type: "enterprise", value: 0.8 },
        { id: "person1", name: "王总", type: "person", value: 0.8 },
        { id: "product1", name: "科技贷", type: "product", value: 0.6 },
      ],
      links: [
        { source: "person1", target: "ent1", type: "investment", value: 0.8 },
        { source: "ent1", target: "ent2", type: "supply", value: 0.9 },
        { source: "ent1", target: "product1", type: "other", value: 0.6 },
      ]
    };

    return {
      success: true,
      data: mockGraphData
    };
  }
}

// 图谱数据服务
export class GraphService {
  // 获取完整图谱
  static async getFullGraph(filters?: FilterParams): Promise<ApiResponse<GraphData>> {
    const cacheKey = `full_graph_${JSON.stringify(filters || {})}`;
    const cached = apiCache.get<ApiResponse<GraphData>>(cacheKey);
    if (cached) return cached;

    try {
      const response = await httpClient.get<ApiResponse<GraphData>>('/graph', filters);
      apiCache.set(cacheKey, response, 3 * 60 * 1000); // 3分钟缓存
      return response;
    } catch (error) {
      console.error('获取完整图谱失败:', error);
      return this.getMockFullGraph(filters);
    }
  }

  // 查找最短路径
  static async findShortestPath(sourceId: string, targetId: string): Promise<ApiResponse<GraphNode[]>> {
    try {
      return await httpClient.get<ApiResponse<GraphNode[]>>(`/graph/path/${sourceId}/${targetId}`);
    } catch (error) {
      console.error('查找路径失败:', error);
      return {
        success: false,
        message: '路径查找功能暂时不可用'
      };
    }
  }

  // 获取节点邻居
  static async getNodeNeighbors(nodeId: string, depth: number = 2): Promise<ApiResponse<GraphData>> {
    try {
      return await httpClient.get<ApiResponse<GraphData>>(`/graph/neighbors/${nodeId}`, { depth });
    } catch (error) {
      console.error('获取节点邻居失败:', error);
      return EnterpriseService['getMockEnterpriseGraph'](nodeId);
    }
  }

  private static async getMockFullGraph(filters?: FilterParams): Promise<ApiResponse<GraphData>> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 大型模拟图谱数据
    const mockGraphData: GraphData = {
      nodes: [
        { id: "e1", name: "星达科技有限公司", type: "enterprise", value: 1.0, industry: "IT" },
        { id: "e2", name: "蓝海科技", type: "enterprise", value: 0.8, industry: "IT" },
        { id: "e3", name: "金辉集团", type: "enterprise", value: 0.9, industry: "投资" },
        { id: "p1", name: "王总", type: "person", value: 0.8 },
        { id: "p2", name: "李董", type: "person", value: 0.7 },
        { id: "pr1", name: "科技贷", type: "product", value: 0.6 },
      ],
      links: [
        { source: "p1", target: "e1", type: "investment", value: 0.8 },
        { source: "p2", target: "e2", type: "investment", value: 0.7 },
        { source: "e3", target: "e1", type: "investment", value: 0.8 },
        { source: "e1", target: "e2", type: "supply", value: 0.9 },
        { source: "e1", target: "pr1", type: "other", value: 0.6 },
      ]
    };

    return {
      success: true,
      data: mockGraphData
    };
  }
}

// 客户数据服务
export class ClientService {
  // 获取客户列表
  static async getClients(params: SearchParams & FilterParams = {}): Promise<PaginatedResponse<Client>> {
    const cacheKey = `clients_${JSON.stringify(params)}`;
    const cached = apiCache.get<PaginatedResponse<Client>>(cacheKey);
    if (cached) return cached;

    try {
      const response = await httpClient.get<PaginatedResponse<Client>>('/clients', params);
      apiCache.set(cacheKey, response, 2 * 60 * 1000);
      return response;
    } catch (error) {
      console.error('获取客户列表失败:', error);
      return this.getMockClients(params);
    }
  }

  private static async getMockClients(params: SearchParams & FilterParams): Promise<PaginatedResponse<Client>> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const mockClients: Client[] = [
      {
        id: '1',
        name: '张三',
        company: '星达科技有限公司',
        industry: '信息技术',
        position: '技术总监',
        email: 'zhangsan@xingda.com',
        phone: '13800138001',
        status: 'active' as const,
        priority: 'high' as const,
        assignedTo: 'manager1',
        assignedToName: '张经理',
        lastContact: new Date('2025-01-15'),
        nextFollowUp: new Date('2025-01-25'),
        estimatedValue: 1200000,
        notes: '重要客户，技术需求强烈',
        tags: ['重点客户', '技术导向'],
        createdAt: new Date('2023-01-15T08:00:00Z'),
        updatedAt: new Date('2025-01-15T08:00:00Z'),
      },
    ];

    return {
      success: true,
      data: mockClients,
      pagination: {
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        total: mockClients.length,
        totalPages: Math.ceil(mockClients.length / (params.pageSize || 20)),
      }
    };
  }
}

// 搜索服务
export class SearchService {
  // 通用实体搜索
  static async searchEntities(
    query: string, 
    params: SearchParams = {}
  ): Promise<PaginatedResponse<DatabaseEntity>> {
    try {
      return await httpClient.get<PaginatedResponse<DatabaseEntity>>('/search', { query, ...params });
    } catch (error) {
      console.error('搜索失败:', error);
      return this.getMockSearchResults(query, params);
    }
  }

  // 搜索建议
  static async getSuggestions(query: string, type?: EntityType): Promise<ApiResponse<DatabaseEntity[]>> {
    try {
      return await httpClient.get<ApiResponse<DatabaseEntity[]>>('/search/suggestions', { query, type });
    } catch (error) {
      console.error('获取搜索建议失败:', error);
      return { success: true, data: [] };
    }
  }

  private static async getMockSearchResults(
    query: string, 
    params: SearchParams
  ): Promise<PaginatedResponse<DatabaseEntity>> {
    await new Promise(resolve => setTimeout(resolve, 400));

    // 简单的模拟搜索结果
    const mockResults: DatabaseEntity[] = [
      {
        id: '1',
        name: '星达科技有限公司',
        creditCode: '91330106MA2GL1RQ5X',
        registrationAddress: '北京市海淀区中关村南大街5号',
        establishmentDate: '2018-03-15',
        registeredCapital: 80000000,
        industry: '信息技术服务',
        businessScope: '计算机软硬件技术开发',
        businessStatus: 'active',
        isClient: true,
        isProspect: false,
        createdAt: '2023-01-15T08:00:00Z',
        updatedAt: '2025-01-15T08:00:00Z',
      } as Enterprise,
    ];

    return {
      success: true,
      data: mockResults,
      pagination: {
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        total: mockResults.length,
        totalPages: 1,
      }
    };
  }
}

// 数据管理服务
export class DataService {
  // 获取数据源状态
  static async getDataSources(): Promise<ApiResponse<DataSource[]>> {
    try {
      return await httpClient.get<ApiResponse<DataSource[]>>('/data/sources');
    } catch (error) {
      console.error('获取数据源状态失败:', error);
      return this.getMockDataSources();
    }
  }

  // 获取导入任务
  static async getImportTasks(): Promise<ApiResponse<DataImportTask[]>> {
    try {
      return await httpClient.get<ApiResponse<DataImportTask[]>>('/data/import-tasks');
    } catch (error) {
      console.error('获取导入任务失败:', error);
      return this.getMockImportTasks();
    }
  }

  // 开始数据导入
  static async startImport(file: File, dataType: string): Promise<ApiResponse<DataImportTask>> {
    try {
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
    } catch (error) {
      console.error('启动数据导入失败:', error);
      return {
        success: false,
        message: '数据导入功能暂时不可用'
      };
    }
  }

  private static async getMockDataSources(): Promise<ApiResponse<DataSource[]>> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockSources: DataSource[] = [
      {
        id: '1',
        name: '企业基础信息数据库',
        type: '企业数据',
        status: 'active',
        recordCount: 125430,
        dataSize: '2.3 GB',
        lastUpdate: '2025-01-15 10:30',
        connectionStatus: 'connected',
        responseTime: 145,
        config: {},
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2025-01-15T10:30:00Z',
      },
    ];

    return {
      success: true,
      data: mockSources
    };
  }

  private static async getMockImportTasks(): Promise<ApiResponse<DataImportTask[]>> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockTasks: DataImportTask[] = [
      {
        id: '1',
        name: '企业基础信息更新',
        status: 'completed',
        progress: 100,
        dataType: 'enterprise',
        fileName: 'enterprises.csv',
        fileSize: 2048576,
        totalRecords: 12450,
        processedRecords: 12450,
        errorRecords: 0,
        startTime: '2025-01-15 10:00',
        endTime: '2025-01-15 10:30',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:30:00Z',
        errors: [],
      },
    ];

    return {
      success: true,
      data: mockTasks
    };
  }
}

// 设置认证token
export function setAuthToken(token: string) {
  httpClient.setAuthToken(token);
}

// 移除认证token
export function removeAuthToken() {
  httpClient.removeAuthToken();
  apiCache.clear();
}

// 清除缓存
export function clearCache() {
  apiCache.clear();
}

// 导出所有服务
export const ApiService = {
  Enterprise: EnterpriseService,
  Graph: GraphService,
  Client: ClientService,
  Search: SearchService,
  Data: DataService,
  setAuthToken,
  removeAuthToken,
  clearCache,
};

export default ApiService; 