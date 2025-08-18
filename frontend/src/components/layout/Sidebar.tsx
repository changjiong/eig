import { cn } from "@/lib/utils";
import {
  BarChart3,
  Home,
  Network,
  Search,
  Settings,
  Target,
  Users,
  Database,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth, Permission } from "@/contexts/AuthContext";

interface SidebarProps {
  className?: string;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  permission?: Permission;
  allowedRoles?: string[];
}

function NavItem({ to, icon, label, permission, allowedRoles }: NavItemProps) {
  const { hasPermission, hasAnyRole, user } = useAuth();

  // 检查权限
  if (permission && !hasPermission(permission)) {
    return null;
  }

  // 检查角色
  if (allowedRoles && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:bg-muted"
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();

  // 如果用户未登录，不显示侧边栏
  if (!user) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col border-r border-border bg-card h-[calc(100vh-4rem)]",
        className
      )}
    >
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          <NavItem 
            to="/" 
            icon={<Home className="h-4 w-4" />} 
            label="工作台" 
            permission="view_dashboard"
          />
          <NavItem
            to="/enterprise"
            icon={<Network className="h-4 w-4" />}
            label="企业360°"
            permission="view_enterprise"
          />
          <NavItem
            to="/graph"
            icon={<BarChart3 className="h-4 w-4" />}
            label="图谱探索"
            permission="view_graph"
          />
          <NavItem
            to="/prospects"
            icon={<Target className="h-4 w-4" />}
            label="潜客发现"
            permission="view_prospects"
          />
          <NavItem
            to="/search"
            icon={<Search className="h-4 w-4" />}
            label="高级搜索"
            permission="view_search"
          />
          <NavItem
            to="/clients"
            icon={<Users className="h-4 w-4" />}
            label="客户管理"
            permission="view_clients"
          />
        </nav>
      </div>
      
      <div className="border-t border-border py-4">
        <nav className="grid gap-1 px-2">
          <NavItem
            to="/data"
            icon={<Database className="h-4 w-4" />}
            label="数据管理"
            permission="manage_data"
            allowedRoles={['admin', 'manager']}
          />
          <NavItem
            to="/settings"
            icon={<Settings className="h-4 w-4" />}
            label="系统设置"
          />
        </nav>
      </div>

      {/* 用户信息栏 */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {user.name.substring(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-xs truncate">{user.name}</div>
            <div className="text-xs text-muted-foreground truncate">{user.department}</div>
          </div>
        </div>
      </div>
    </div>
  );
}