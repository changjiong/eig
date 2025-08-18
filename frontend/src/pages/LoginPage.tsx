import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 获取重定向路径
  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  // 表单状态
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  
  const [formState, setFormState] = useState({
    isLoading: false,
    error: "",
    showPassword: false
  });

  // 如果已登录，重定向到目标页面
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // 认证系统加载中
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>系统初始化中...</span>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // 清除错误
    if (formState.error) {
      setFormState(prev => ({ ...prev, error: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setFormState(prev => ({
        ...prev,
        error: "请填写完整的登录信息"
      }));
      return;
    }

    setFormState(prev => ({
      ...prev,
      isLoading: true,
      error: ""
    }));

    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        navigate(from, { replace: true });
      } else {
        setFormState(prev => ({
          ...prev,
          error: "邮箱或密码错误，请检查后重试"
        }));
      }
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        error: "登录过程中发生错误，请稍后重试"
      }));
    } finally {
      setFormState(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setFormState(prev => ({
      ...prev,
      showPassword: !prev.showPassword
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center space-y-1 pb-8">
          {/* Logo and Title */}
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <div className="text-2xl font-bold text-primary-foreground">EIG</div>
          </div>
          
          <CardTitle className="text-2xl font-bold">欢迎使用 EIG 平台</CardTitle>
          <CardDescription className="text-base">
            企业智能图谱系统 - 银行企业关系分析平台
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 演示账号提示 */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground mb-2">演示账号：</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Badge variant="outline" className="justify-start p-2">
                <div>
                  <div className="font-medium">管理员</div>
                  <div className="text-muted-foreground">admin@bank.com</div>
                </div>
              </Badge>
              <Badge variant="outline" className="justify-start p-2">
                <div>
                  <div className="font-medium">部门经理</div>
                  <div className="text-muted-foreground">manager@bank.com</div>
                </div>
              </Badge>
              <Badge variant="outline" className="justify-start p-2">
                <div>
                  <div className="font-medium">分析师</div>
                  <div className="text-muted-foreground">analyst@bank.com</div>
                </div>
              </Badge>
              <Badge variant="outline" className="justify-start p-2">
                <div>
                  <div className="font-medium">客户经理</div>
                  <div className="text-muted-foreground">viewer@bank.com</div>
                </div>
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              所有演示账号密码：对应角色名 + 123 (如: admin123)
            </div>
          </div>

          {/* 错误提示 */}
          {formState.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formState.error}</AlertDescription>
            </Alert>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱地址</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入您的邮箱地址"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className="pl-10"
                  disabled={formState.isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={formState.showPassword ? "text" : "password"}
                  placeholder="请输入您的密码"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className="pl-10 pr-10"
                  disabled={formState.isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={formState.isLoading}
                >
                  {formState.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={formState.isLoading}
              size="lg"
            >
              {formState.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                "登录"
              )}
            </Button>
          </form>

          {/* 底部信息 */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <div>© 2025 Enterprise Intelligence Graph Platform</div>
            <div>企业智能图谱系统 v2.1.0</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 