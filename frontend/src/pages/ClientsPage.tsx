import { useState } from "react";
import { Users, Plus, Filter, Download, RefreshCw, AlertCircle, Phone, Mail, Building2, Calendar } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients } from "@/hooks/useData";
import { Client } from "@/types/database";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  // 使用真实数据hook
  const { 
    data: clients, 
    isLoading, 
    pagination, 
    refetch 
  } = useClients({ 
    query: searchQuery || undefined,
    page: 1,
    pageSize: 50
  });

  // 过滤客户数据
  const filteredClients = clients.filter(client => {
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || client.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  // 获取状态对应的颜色
  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case "active": return "default";
      case "potential": return "secondary";
      case "inactive": return "outline";
      case "lost": return "destructive";
      default: return "outline";
    }
  };

  // 获取优先级对应的颜色
  const getPriorityColor = (priority: Client['priority']) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  // 获取状态对应的中文
  const getStatusText = (status: Client['status']) => {
    switch (status) {
      case "active": return "活跃";
      case "potential": return "潜在";
      case "inactive": return "不活跃";
      case "lost": return "已流失";
      default: return "未知";
    }
  };

  // 获取优先级对应的中文
  const getPriorityText = (priority: Client['priority']) => {
    switch (priority) {
      case "high": return "高";
      case "medium": return "中";
      case "low": return "低";
      default: return "未设置";
    }
  };

  // 格式化日期
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "未设置";
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('zh-CN');
  };

  // 手动刷新数据
  const handleRefresh = () => {
    refetch();
  };

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-6 p-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">客户管理</h1>
            <p className="text-muted-foreground">
              管理和跟进您的客户关系
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加客户
            </Button>
          </div>
        </div>

        {/* 搜索和筛选栏 */}
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索客户姓名、公司或邮箱..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="potential">潜在</SelectItem>
                <SelectItem value="inactive">不活跃</SelectItem>
                <SelectItem value="lost">已流失</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部优先级</SelectItem>
                <SelectItem value="high">高优先级</SelectItem>
                <SelectItem value="medium">中优先级</SelectItem>
                <SelectItem value="low">低优先级</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总客户数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : pagination.total}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃客户</CardTitle>
              <Badge variant="default" className="text-xs">活跃</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : clients.filter(c => c.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">潜在客户</CardTitle>
              <Badge variant="secondary" className="text-xs">潜在</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : clients.filter(c => c.status === 'potential').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">高优先级</CardTitle>
              <Badge variant="destructive" className="text-xs">高</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : clients.filter(c => c.priority === 'high').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 客户列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>客户列表</span>
              <Badge variant="outline">{filteredClients.length} 个客户</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[300px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">暂无客户数据</h3>
                <p className="mt-2 text-muted-foreground">
                  {searchQuery ? "没有找到匹配的客户" : "还没有添加任何客户"}
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery("")}
                    className="mt-4"
                  >
                    清除搜索
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClients.map((client) => (
                  <div key={client.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <Avatar>
                      <AvatarFallback>
                        {client.name?.substring(0, 2) || "客"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold">{client.name}</h3>
                          <Badge variant={getStatusColor(client.status)}>
                            {getStatusText(client.status)}
                          </Badge>
                          <Badge variant={getPriorityColor(client.priority)}>
                            {getPriorityText(client.priority)}优先级
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          负责人: {client.assignedToName || "未分配"}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Building2 className="h-4 w-4" />
                          <span>{client.company} - {client.position}</span>
                        </div>
                        
                        {client.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        
                        {client.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>上次联系: {formatDate(client.lastContact)}</span>
                        </div>
                      </div>
                      
                      {client.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {client.notes}
                        </p>
                      )}
                      
                      {client.tags && client.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {client.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 