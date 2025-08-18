import { useState, useEffect } from "react";
import { Users, Plus, Filter, Download, RefreshCw, AlertCircle } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import ApiService from "@/services/api";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // 数据状态
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取客户数据
  const loadClients = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = {
        query: searchQuery,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: 1,
        pageSize: 50,
      };
      
      const response = await ApiService.Client.getClients(params);
      
      if (response.success && response.data) {
        setClients(response.data);
      } else {
        throw new Error(response.message || '获取客户数据失败');
      }
    } catch (err) {
      console.error('获取客户数据失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
      // 使用模拟数据
      setClients(mockClients);
    } finally {
      setIsLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadClients();
  }, [searchQuery, statusFilter]);

  // Mock client data for fallback
  const mockClients = [
    {
      id: "1",
      name: "星达科技有限公司",
      manager: "张经理",
      status: "active",
      lastContact: "2025-01-15",
      revenue: "120万",
      products: ["科技贷", "综合授信"],
      score: 87.5,
    },
    {
      id: "2",
      name: "蓝海科技集团", 
      manager: "李经理",
      status: "potential",
      lastContact: "2025-01-10",
      revenue: "80万",
      products: ["企业债"],
      score: 82.3,
    },
    {
      id: "3",
      name: "金辉投资有限公司",
      manager: "王经理", 
      status: "inactive",
      lastContact: "2024-12-20",
      revenue: "200万",
      products: ["投资贷", "保证贷"],
      score: 91.2,
    },
  ];

  // 统计数据
  const activeClients = clients.filter(c => c.status === 'active').length;
  const potentialClients = clients.filter(c => c.status === 'potential').length;
  const totalRevenue = clients.reduce((sum, c) => sum + (parseFloat(c.revenue?.replace('万', '') || '0') * 10000), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">活跃客户</Badge>;
      case "potential":
        return <Badge className="bg-blue-100 text-blue-800">潜在客户</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">非活跃</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.manager.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">客户管理</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={loadClients}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              刷新数据
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              导出数据
            </Button>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              新增客户
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error} 当前显示的是缓存数据。
              <Button 
                variant="link" 
                className="p-0 ml-2 text-destructive-foreground underline" 
                onClick={loadClients}
              >
                重新加载
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Filter Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              筛选条件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="搜索客户名称或客户经理..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="客户状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">活跃客户</SelectItem>
                  <SelectItem value="potential">潜在客户</SelectItem>
                  <SelectItem value="inactive">非活跃</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Users className="h-4 w-4 text-green-600 dark:text-green-300" />
                </div>
                <div>
                                     <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-6 w-8" /> : activeClients}</div>
                   <div className="text-xs text-muted-foreground">活跃客户</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                                     <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-6 w-8" /> : potentialClients}</div>
                   <div className="text-xs text-muted-foreground">潜在客户</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Users className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                </div>
                <div>
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-xs text-muted-foreground">本月新增</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <div className="text-2xl font-bold">1,240万</div>
                  <div className="text-xs text-muted-foreground">总业务量</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">客户列表 ({filteredClients.length})</CardTitle>
          </CardHeader>
                     <CardContent>
             <div className="space-y-4">
               {isLoading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                   <Card key={i} className="p-4">
                     <div className="flex items-center space-x-4">
                       <Skeleton className="h-12 w-12 rounded-full" />
                       <div className="space-y-2">
                         <Skeleton className="h-4 w-48" />
                         <Skeleton className="h-3 w-32" />
                       </div>
                     </div>
                   </Card>
                 ))
               ) : clients.length > 0 ? (
                 clients.map((client) => (
                <div
                  key={client.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-base">{client.name}</h3>
                        {getStatusBadge(client.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        客户经理：{client.manager}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{client.score}</div>
                      <div className="text-xs text-muted-foreground">综合评分</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">最后联系：</span>
                      <div className="font-medium">{client.lastContact}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">业务量：</span>
                      <div className="font-medium text-green-600">{client.revenue}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">产品数量：</span>
                      <div className="font-medium">{client.products.length}个</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">主要产品：</span>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {client.products.slice(0, 2).map((product) => (
                          <Badge key={product} variant="outline" className="text-xs">
                            {product}
                          </Badge>
                        ))}
                        {client.products.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{client.products.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                               ))
               ) : (
                 <div className="text-center text-muted-foreground py-8">
                   暂无客户数据
                 </div>
               )}
             </div>
           </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 