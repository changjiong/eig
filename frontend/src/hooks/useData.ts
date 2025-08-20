import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '@/services/api';
import { Enterprise, Client, DataSource } from '@/types/database';

// Dashboard数据Hook
export function useDashboardData() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // 企业数据状态
  const [enterpriseData, setEnterpriseData] = useState<{
    data: Enterprise[];
    isLoading: boolean;
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }>({
    data: [],
    isLoading: true,
    pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
  });

  // 客户数据状态
  const [clientData, setClientData] = useState<{
    data: Client[];
    isLoading: boolean;
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }>({
    data: [],
    isLoading: true,
    pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
  });

  // 数据源状态
  const [dataSourceData, setDataSourceData] = useState<{
    data: DataSource[];
    isLoading: boolean;
  }>({
    data: [],
    isLoading: true,
  });

  // 获取企业数据
  const fetchEnterprises = useCallback(async () => {
    try {
      setEnterpriseData(prev => ({ ...prev, isLoading: true }));
      const response = await ApiService.Enterprise.getEnterprises({ 
        page: 1, 
        pageSize: 10 
      });
      
      if (response.success) {
        setEnterpriseData({
          data: response.data,
          isLoading: false,
          pagination: response.pagination,
        });
      } else {
        throw new Error(response.message || '获取企业数据失败');
      }
    } catch (error) {
      console.error('获取企业数据失败:', error);
      setEnterpriseData(prev => ({ 
        ...prev, 
        isLoading: false, 
        data: [] 
      }));
    }
  }, []);

  // 获取客户数据
  const fetchClients = useCallback(async () => {
    try {
      setClientData(prev => ({ ...prev, isLoading: true }));
      const response = await ApiService.Client.getClients({ 
        page: 1, 
        pageSize: 10 
      });
      
      if (response.success) {
        setClientData({
          data: response.data,
          isLoading: false,
          pagination: response.pagination,
        });
      } else {
        throw new Error(response.message || '获取客户数据失败');
      }
    } catch (error) {
      console.error('获取客户数据失败:', error);
      setClientData(prev => ({ 
        ...prev, 
        isLoading: false, 
        data: [] 
      }));
    }
  }, []);

  // 获取数据源状态
  const fetchDataSources = useCallback(async () => {
    try {
      setDataSourceData(prev => ({ ...prev, isLoading: true }));
      const response = await ApiService.Data.getDataSources();
      
      if (response.success) {
        setDataSourceData({
          data: response.data,
          isLoading: false,
        });
      } else {
        throw new Error(response.message || '获取数据源状态失败');
      }
    } catch (error) {
      console.error('获取数据源状态失败:', error);
      setDataSourceData({ 
        data: [], 
        isLoading: false 
      });
    }
  }, []);

  // 刷新所有数据
  const refetchAll = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      await Promise.all([
        fetchEnterprises(),
        fetchClients(),
        fetchDataSources()
      ]);
    } catch (error) {
      console.error('刷新数据失败:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [fetchEnterprises, fetchClients, fetchDataSources]);

  // 初始化数据加载
  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  return {
    enterprises: {
      data: enterpriseData.data,
      isLoading: enterpriseData.isLoading,
      pagination: enterpriseData.pagination,
      refetch: fetchEnterprises
    },
    clients: {
      data: clientData.data,
      isLoading: clientData.isLoading,
      pagination: clientData.pagination,
      refetch: fetchClients
    },
    dataSources: {
      data: dataSourceData.data,
      isLoading: dataSourceData.isLoading,
      refetch: fetchDataSources
    },
    isLoading,
    hasError,
    refetchAll
  };
}

// 企业数据Hook
export function useEnterprises(params: { page?: number; pageSize?: number; keyword?: string } = {}) {
  const [data, setData] = useState<Enterprise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ 
    total: 0, 
    page: 1, 
    pageSize: 20, 
    totalPages: 0 
  });

  const fetchEnterprises = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.Enterprise.getEnterprises(params);
      
      if (response.success) {
        setData(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('获取企业列表失败:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [params.page, params.pageSize, params.keyword]); // 明确依赖项以避免不必要的重新渲染

  useEffect(() => {
    fetchEnterprises();
  }, [fetchEnterprises]);

  return {
    data,
    isLoading,
    pagination,
    refetch: fetchEnterprises
  };
}

// 客户数据Hook
export function useClients(params: { page?: number; pageSize?: number; query?: string } = {}) {
  const [data, setData] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ 
    total: 0, 
    page: 1, 
    pageSize: 20, 
    totalPages: 0 
  });

  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.Client.getClients(params);
      
      if (response.success) {
        setData(response.data);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('获取客户列表失败:', error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [params.page, params.pageSize, params.query]); // 明确依赖项以避免不必要的重新渲染

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    data,
    isLoading,
    pagination,
    refetch: fetchClients
  };
} 