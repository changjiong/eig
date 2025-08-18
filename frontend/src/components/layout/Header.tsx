import { Bell, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  className?: string;
}

// 角色显示映射
const getRoleDisplayName = (role: string): string => {
  const roleNames: Record<string, string> = {
    admin: '系统管理员',
    manager: '部门经理',
    analyst: '数据分析师',
    viewer: '客户经理'
  };
  return roleNames[role] || role;
};

// 角色颜色映射
const getRoleBadgeColor = (role: string): string => {
  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    analyst: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  };
  return roleColors[role] || 'bg-gray-100 text-gray-800';
};

export default function Header({ className }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/settings');
  };

  // 获取用户名首字母作为头像
  const getAvatarFallback = (name: string): string => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className={`flex items-center justify-between px-6 py-4 border-b border-border bg-card ${className}`}>
      {/* 左侧标题 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">EIG</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">企业智能图谱</h1>
            <p className="text-xs text-muted-foreground">Enterprise Intelligence Graph</p>
          </div>
        </div>
      </div>

      {/* 右侧用户信息和操作 */}
      <div className="flex items-center gap-4">
        {/* 通知按钮 */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {/* 通知红点 */}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></div>
        </Button>

        {/* 用户信息和菜单 */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 px-3 py-2 h-auto">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {getAvatarFallback(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-3 text-left">
                  <div>
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.department}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs px-2 py-0.5 ${getRoleBadgeColor(user.role)}`}
                    >
                      {getRoleDisplayName(user.role)}
                    </Badge>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getAvatarFallback(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground mt-1">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getRoleBadgeColor(user.role)}`}
                    >
                      {getRoleDisplayName(user.role)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {user.department}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>个人资料</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>系统设置</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}