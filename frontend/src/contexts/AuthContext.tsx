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
  id: string;
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

// 角色权限映射
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_dashboard',
    'view_enterprise',
    'view_graph',
    'view_prospects',
    'view_search',
    'view_clients',
    'manage_data',
    'manage_system',
    'export_data',
    'import_data',
    'user_management'
  ],
  manager: [
    'view_dashboard',
    'view_enterprise',
    'view_graph',
    'view_prospects',
    'view_search',
    'view_clients',
    'manage_data',
    'export_data',
    'import_data'
  ],
  analyst: [
    'view_dashboard',
    'view_enterprise',
    'view_graph',
    'view_prospects',
    'view_search',
    'view_clients',
    'export_data'
  ],
  viewer: [
    'view_dashboard',
    'view_enterprise',
    'view_graph',
    'view_prospects',
    'view_search'
  ]
};

// 模拟用户数据
const MOCK_USERS: Record<string, { password: string; userData: User }> = {
  'admin@bank.com': {
    password: 'admin123',
    userData: {
      id: '1',
      name: '系统管理员',
      email: 'admin@bank.com',
      department: '信息技术部',
      role: 'admin',
      permissions: ROLE_PERMISSIONS.admin
    }
  },
  'manager@bank.com': {
    password: 'manager123',
    userData: {
      id: '2',
      name: '部门经理',
      email: 'manager@bank.com',
      department: '企业金融部',
      role: 'manager',
      permissions: ROLE_PERMISSIONS.manager
    }
  },
  'analyst@bank.com': {
    password: 'analyst123',
    userData: {
      id: '3',
      name: '数据分析师',
      email: 'analyst@bank.com',
      department: '风险管理部',
      role: 'analyst',
      permissions: ROLE_PERMISSIONS.analyst
    }
  },
  'viewer@bank.com': {
    password: 'viewer123',
    userData: {
      id: '4',
      name: '客户经理',
      email: 'viewer@bank.com',
      department: '营业部',
      role: 'viewer',
      permissions: ROLE_PERMISSIONS.viewer
    }
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

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('eig_user');
        const storedToken = localStorage.getItem('eig_token');
        
        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser) as User;
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false
          }));
        }
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
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      const userCredentials = MOCK_USERS[email];
      
      if (!userCredentials || userCredentials.password !== password) {
        return false;
      }

      const { userData } = userCredentials;
      
      // 生成模拟token
      const token = `mock_token_${Date.now()}_${userData.id}`;
      
      // 存储到localStorage
      localStorage.setItem('eig_user', JSON.stringify(userData));
      localStorage.setItem('eig_token', token);
      
      // 更新状态
      setAuthState({
        user: userData,
        isAuthenticated: true,
        isLoading: false
      });

      return true;
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem('eig_user');
    localStorage.removeItem('eig_token');
    
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