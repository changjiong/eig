import { useState, useEffect, useCallback } from 'react';

// 简化的Hook，专门用于Dashboard
export function useDashboardData() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 模拟企业数据
  const enterprises = {
    data: [],
    isLoading: false,
    pagination: { total: 12453, page: 1, pageSize: 10, totalPages: 1246 },
    refetch: async () => {}
  };

  // 模拟客户数据
  const clients = {
    data: [],
    isLoading: false,
    pagination: { total: 8239, page: 1, pageSize: 10, totalPages: 824 },
    refetch: async () => {}
  };

  // 模拟数据源
  const dataSources = {
    data: [
      { id: '1', status: 'active' },
      { id: '2', status: 'active' },
      { id: '3', status: 'active' },
      { id: '4', status: 'warning' }
    ],
    isLoading: false,
    refetch: async () => {}
  };

  const refetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        enterprises.refetch(),
        clients.refetch(),
        dataSources.refetch()
      ]);
      setHasError(false);
    } catch (error) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    enterprises,
    clients,
    dataSources,
    isLoading,
    hasError,
    refetchAll
  };
} 