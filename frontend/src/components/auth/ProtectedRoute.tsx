import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldX } from "lucide-react";
import { useAuth, Permission, UserRole } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredPermission?: Permission;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredPermission,
  requiredRole,
  allowedRoles,
  fallback
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasPermission, hasRole, hasAnyRole, logout } = useAuth();
  const location = useLocation();

  // 认证系统加载中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>验证用户权限中...</span>
        </div>
      </div>
    );
  }

  // 需要登录但未登录，重定向到登录页
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已登录用户的权限检查
  if (isAuthenticated && user) {
    let hasRequiredPermission = true;
    let hasRequiredRole = true;

    // 检查特定权限
    if (requiredPermission) {
      hasRequiredPermission = hasPermission(requiredPermission);
    }

    // 检查特定角色
    if (requiredRole) {
      hasRequiredRole = hasRole(requiredRole);
    }

    // 检查允许的角色列表
    if (allowedRoles && allowedRoles.length > 0) {
      hasRequiredRole = hasAnyRole(allowedRoles);
    }

    // 权限或角色不足，显示无权限页面
    if (!hasRequiredPermission || !hasRequiredRole) {
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <ShieldX className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">访问受限</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>您没有权限访问此页面</p>
                <div className="bg-muted/50 rounded-lg p-3 text-left space-y-1">
                  <div><strong>当前用户：</strong>{user.name}</div>
                  <div><strong>用户角色：</strong>{getRoleDisplayName(user.role)}</div>
                  <div><strong>所属部门：</strong>{user.department}</div>
                </div>
                
                {requiredPermission && (
                  <p className="text-xs">
                    需要权限: <code className="bg-muted px-1 rounded">{getPermissionDisplayName(requiredPermission)}</code>
                  </p>
                )}
                
                {requiredRole && (
                  <p className="text-xs">
                    需要角色: <code className="bg-muted px-1 rounded">{getRoleDisplayName(requiredRole)}</code>
                  </p>
                )}
                
                {allowedRoles && allowedRoles.length > 0 && (
                  <p className="text-xs">
                    允许角色: {allowedRoles.map(role => (
                      <code key={role} className="bg-muted px-1 rounded mr-1">
                        {getRoleDisplayName(role)}
                      </code>
                    ))}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()}
                  className="flex-1"
                >
                  返回上页
                </Button>
                <Button 
                  variant="outline" 
                  onClick={logout}
                  className="flex-1"
                >
                  重新登录
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // 权限检查通过，渲染子组件
  return <>{children}</>;
}

// 角色显示名称映射
function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: '系统管理员',
    manager: '部门经理',
    analyst: '数据分析师',
    viewer: '客户经理'
  };
  return roleNames[role] || role;
}

// 权限显示名称映射
function getPermissionDisplayName(permission: Permission): string {
  const permissionNames: Record<Permission, string> = {
    view_dashboard: '查看工作台',
    view_enterprise: '查看企业信息',
    view_graph: '查看图谱',
    view_prospects: '查看潜客',
    view_search: '使用搜索',
    view_clients: '查看客户',
    manage_data: '数据管理',
    manage_system: '系统管理',
    export_data: '导出数据',
    import_data: '导入数据',
    user_management: '用户管理'
  };
  return permissionNames[permission] || permission;
}

export default ProtectedRoute; 