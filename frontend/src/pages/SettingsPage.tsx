import { useState } from "react";
import { Settings, User, Shield, Bell, Palette, Globe } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    mobile: false,
  });

  const [userProfile, setUserProfile] = useState({
    name: "张三",
    email: "zhangsan@example.com",
    department: "企业金融部",
    role: "客户经理",
  });

  const handleNotificationChange = (type: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleProfileChange = (field: keyof typeof userProfile, value: string) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">系统设置</h1>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              个人信息
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              安全设置
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              通知设置
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              外观设置
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              系统设置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">个人资料</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="" alt="头像" />
                    <AvatarFallback>张三</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">更换头像</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">姓名</Label>
                    <Input
                      id="name"
                      value={userProfile.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">部门</Label>
                    <Input
                      id="department"
                      value={userProfile.department}
                      onChange={(e) => handleProfileChange('department', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">职位</Label>
                    <Select value={userProfile.role} onValueChange={(value) => handleProfileChange('role', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="客户经理">客户经理</SelectItem>
                        <SelectItem value="高级客户经理">高级客户经理</SelectItem>
                        <SelectItem value="部门经理">部门经理</SelectItem>
                        <SelectItem value="分行行长">分行行长</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>保存更改</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">安全设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">密码管理</h3>
                  <Button variant="outline">修改密码</Button>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-4">双因子认证</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">启用双因子认证</div>
                      <div className="text-sm text-muted-foreground">
                        为您的账户添加额外的安全保护
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-4">登录历史</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">Windows PC</div>
                        <div className="text-sm text-muted-foreground">192.168.1.100 • 北京</div>
                      </div>
                      <div className="text-sm text-muted-foreground">2 小时前</div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">Mobile App</div>
                        <div className="text-sm text-muted-foreground">192.168.1.101 • 北京</div>
                      </div>
                      <div className="text-sm text-muted-foreground">昨天</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">通知偏好</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">邮件通知</div>
                    <div className="text-sm text-muted-foreground">
                      接收重要系统通知和更新
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.email}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">浏览器通知</div>
                    <div className="text-sm text-muted-foreground">
                      在浏览器中显示通知提醒
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.browser}
                    onCheckedChange={(checked) => handleNotificationChange('browser', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">手机推送</div>
                    <div className="text-sm text-muted-foreground">
                      移动端推送消息
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.mobile}
                    onCheckedChange={(checked) => handleNotificationChange('mobile', checked)}
                  />
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-4">通知类型</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">任务提醒</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">数据更新</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">系统维护</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">安全警告</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">外观主题</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="theme">主题模式</Label>
                  <Select defaultValue="light">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">浅色模式</SelectItem>
                      <SelectItem value="dark">深色模式</SelectItem>
                      <SelectItem value="system">跟随系统</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">语言设置</Label>
                  <Select defaultValue="zh-CN">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="zh-TW">繁体中文</SelectItem>
                      <SelectItem value="en-US">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateFormat">日期格式</Label>
                  <Select defaultValue="YYYY-MM-DD">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">系统信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>系统版本</Label>
                    <div className="mt-1 text-sm text-muted-foreground">EIG Platform v2.1.0</div>
                  </div>
                  <div>
                    <Label>最后更新</Label>
                    <div className="mt-1 text-sm text-muted-foreground">2025-01-15</div>
                  </div>
                  <div>
                    <Label>数据库版本</Label>
                    <div className="mt-1 text-sm text-muted-foreground">PostgreSQL 14.2</div>
                  </div>
                  <div>
                    <Label>API版本</Label>
                    <div className="mt-1 text-sm text-muted-foreground">v2.1</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">系统维护</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">清除缓存</Button>
                    <Button variant="outline" size="sm">重建索引</Button>
                    <Button variant="outline" size="sm">系统检查</Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">支持与反馈</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Globe className="h-3 w-3 mr-1" />
                      帮助文档
                    </Button>
                    <Button variant="outline" size="sm">联系支持</Button>
                    <Button variant="outline" size="sm">问题反馈</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
} 