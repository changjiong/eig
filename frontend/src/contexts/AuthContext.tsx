import React, { createContext, useContext, useEffect, useState } from 'react';

// 用户角色定义
export type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';

// 用户权限定义
export type Permission = 
  | 'view_dashboard' 
  | 'view_enterprise' 
  | 'view_graph' 
  | 'view_prospects' 
  | 'view_search' 
  | 'view_clients' 
  | 'manage_data' 
  | 'manage_system'
  | 'export_data'
  | 'import_data'
  | 'user_management';

// 用户信息接口
export interface User {
  id?: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  avatar?: string;
  permissions: Permission[];
}

// 认证状态接口
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 认证上下文接口
export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

// API调用函数
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('eig_token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API调用失败: ${endpoint}`, error);
    throw error;
  }
};

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供程序组件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // 验证当前token并获取用户信息
  const verifyToken = async (): Promise<User | null> => {
    try {
      const response = await apiCall('/auth/me');
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Token验证失败:', error);
      // 清除无效的token
      localStorage.removeItem('eig_token');
      localStorage.removeItem('eig_user');
      return null;
    }
  };

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('eig_token');
        
        if (storedToken) {
          const user = await verifyToken();
          if (user) {
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false
            });
            return;
          }
        }
        
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      } catch (error) {
        console.error('初始化认证状态失败:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    };

    initAuth();
  }, []);

  // 登录函数
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // 存储token和用户信息
        localStorage.setItem('eig_token', token);
        localStorage.setItem('eig_user', JSON.stringify(user));
        
        // 更新状态
        setAuthState({
          user: user,
          isAuthenticated: true,
          isLoading: false
        });

        return true;
      }
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    } catch (error) {
      console.error('登录失败:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  // 登出函数
  const logout = async () => {
    try {
      // 调用后端登出API（可选）
      await apiCall('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('登出API调用失败:', error);
      // 即使API调用失败，也要清除本地状态
    }
    
    // 清除本地存储
    localStorage.removeItem('eig_user');
    localStorage.removeItem('eig_token');
    
    // 更新状态
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  // 权限检查函数
  const hasPermission = (permission: Permission): boolean => {
    if (!authState.user) return false;
    return authState.user.permissions.includes(permission);
  };

  // 角色检查函数
  const hasRole = (role: UserRole): boolean => {
    if (!authState.user) return false;
    return authState.user.role === role;
  };

  // 多角色检查函数
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!authState.user) return false;
    return roles.includes(authState.user.role);
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    hasPermission,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 认证Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

// 权限检查Hook
export const usePermission = (permission: Permission): boolean => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

// 角色检查Hook
export const useRole = (role: UserRole): boolean => {
  const { hasRole } = useAuth();
  return hasRole(role);
};

export default AuthContext; 