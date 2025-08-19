import { useState, useEffect } from "react";
import { Database, Upload, Download, Trash2, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiService } from "@/services/api";
import { DataSource, DataImportTask } from "@/types/database";

export default function DataPage() {
  // 状态管理
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("sources");

  // 数据状态
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [importTasks, setImportTasks] = useState<DataImportTask[]>([]);
  const [stats, setStats] = useState<any>(null);

  // 获取数据源列表
  const fetchDataSources = async () => {
    try {
      const response = await ApiService.Data.getDataSources();
      if (response.success) {
        setDataSources(response.data);
      } else {
        console.error('获取数据源失败:', response.message);
      }
    } catch (error) {
      console.error('获取数据源失败:', error);
      setError('获取数据源失败');
    }
  };

  // 获取导入任务列表
  const fetchImportTasks = async () => {
    try {
      const response = await ApiService.Data.getImportTasks();
      if (response.success) {
        setImportTasks(response.data);
      } else {
        console.error('获取导入任务失败:', response.message);
      }
    } catch (error) {
      console.error('获取导入任务失败:', error);
      setError('获取导入任务失败');
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      // 使用现有的图谱统计API或企业统计
      const response = await ApiService.Graph.getGraphStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 初始化数据加载
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await Promise.allSettled([
        fetchDataSources(),
        fetchImportTasks(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('获取数据失败:', error);
      setError('获取数据失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchAllData();
  };

  // 创建数据源
  const handleCreateDataSource = async () => {
    try {
      const response = await ApiService.Data.createDataSource({
        name: '新建数据源',
        type: 'database',
        config: {}
      });
      
      if (response.success) {
        await fetchDataSources();
      } else {
        setError('创建数据源失败：' + response.message);
      }
    } catch (error) {
      console.error('创建数据源失败:', error);
      setError('创建数据源失败');
    }
  };

  // 创建导入任务
  const handleImportData = async () => {
    try {
      setIsImporting(true);
      setImportProgress(0);
      
      // 创建导入任务
      const response = await ApiService.Data.createImportTask({
        name: '数据导入任务',
        sourceId: dataSources[0]?.id || '',
        sourceName: dataSources[0]?.name || '未知数据源'
      });
      
      if (response.success) {
        // 模拟进度更新
        const interval = setInterval(() => {
          setImportProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              setIsImporting(false);
              fetchImportTasks(); // 刷新任务列表
              return 100;
            }
            return prev + 10;
          });
        }, 500);
      } else {
        setError('创建导入任务失败：' + response.message);
        setIsImporting(false);
      }
    } catch (error) {
      console.error('导入数据失败:', error);
      setError('导入数据失败');
      setIsImporting(false);
    }
  };

  // 获取状态标记样式
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">正常</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">警告</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">异常</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">已完成</Badge>;
      case "running":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">运行中</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">失败</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">等待中</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // 格式化日期
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "未知";
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('zh-CN');
  };

  // 格式化文件大小
  const formatSize = (bytes: number | undefined) => {
    if (!bytes) return "未知";
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';
  };

  // 初始化
  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">数据管理</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              导出数据
            </Button>
            <Button 
              onClick={handleImportData} 
              disabled={isImporting || dataSources.length === 0}
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isImporting ? "导入中..." : "导入数据"}
            </Button>
            <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              刷新
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="link" className="ml-2" onClick={() => setError(null)}>
                关闭
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Import Progress */}
        {isImporting && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <div className="space-y-2">
                <div>正在导入数据，请稍候...</div>
                <Progress value={importProgress} className="w-full" />
                <div className="text-sm text-muted-foreground">{importProgress}% 完成</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="sources">数据源管理</TabsTrigger>
            <TabsTrigger value="tasks">导入任务</TabsTrigger>
            <TabsTrigger value="stats">数据统计</TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  数据源状态
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleCreateDataSource}>
                  <Upload className="h-4 w-4 mr-2" />
                  新增数据源
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border border-border rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-1/3" />
                            <div className="flex gap-2">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-12" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : dataSources.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">暂无数据源，请添加数据源</p>
                    <Button onClick={handleCreateDataSource}>
                      <Upload className="h-4 w-4 mr-2" />
                      新增数据源
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dataSources.map((source) => (
                      <div
                        key={source.id}
                        className="p-4 border border-border rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-base">{source.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{source.type}</Badge>
                              {getStatusBadge("active")}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">最后更新：</span>
                            <div className="font-medium">{formatDate(source.updatedAt)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">创建时间：</span>
                            <div className="font-medium">{formatDate(source.createdAt)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">状态：</span>
                            <div className="font-medium">正常运行</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">类型：</span>
                            <div className="font-medium text-xs">
                              {source.type}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">数据导入任务</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border border-border rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-1/2" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                          <Skeleton className="h-8 w-8" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                        <div className="grid grid-cols-4 gap-4">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : importTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">暂无导入任务</p>
                    <Button onClick={handleImportData} disabled={dataSources.length === 0}>
                      <Upload className="h-4 w-4 mr-2" />
                      开始导入
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {importTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 border border-border rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-base">{task.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {getTaskStatusBadge(task.status)}
                            </div>
                          </div>
                          {task.status === 'failed' && (
                            <Button size="sm" variant="outline" className="text-red-600">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        {task.status === 'running' && (
                          <div className="mb-3">
                            <Progress value={task.progress} className="w-full" />
                            <div className="text-sm text-muted-foreground mt-1">{task.progress}% 完成</div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">开始时间：</span>
                            <div className="font-medium">{formatDate(task.createdAt)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">更新时间：</span>
                            <div className="font-medium">{formatDate(task.updatedAt)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">状态：</span>
                            <div className="font-medium">
                              {task.status === 'completed' ? '已完成' :
                               task.status === 'running' ? '运行中' :
                               task.status === 'failed' ? '失败' : '等待中'}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">进度：</span>
                            <div className="font-medium">{task.progress || 0}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {/* Data Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Database className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {stats?.totalNodes || dataSources.length}
                      </div>
                      <div className="text-xs text-muted-foreground">数据源数量</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Database className="h-4 w-4 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {stats?.nodes?.enterprise || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">企业记录</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Upload className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {importTasks.filter(t => t.status === 'completed').length}
                      </div>
                      <div className="text-xs text-muted-foreground">完成任务</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <RefreshCw className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {dataSources.length}/{dataSources.length}
                      </div>
                      <div className="text-xs text-muted-foreground">活跃数据源</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Quality Alert */}
            {stats && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  系统运行正常。当前共有 {dataSources.length} 个数据源，
                  {dataSources.length} 个活跃状态。
                  <Button variant="link" className="p-0 ml-2 text-primary">
                    查看详情
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
} 