import { useState } from "react";
import { Database, Upload, Download, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DataPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Mock data sources
  const dataSources = [
    {
      id: "1",
      name: "企业基础信息数据库",
      type: "企业数据",
      lastUpdate: "2025-01-15 10:30",
      status: "active",
      records: "125,430",
      size: "2.3 GB",
    },
    {
      id: "2", 
      name: "工商登记信息",
      type: "工商数据",
      lastUpdate: "2025-01-14 18:45",
      status: "active",
      records: "89,234",
      size: "1.8 GB",
    },
    {
      id: "3",
      name: "投资关系数据",
      type: "关系数据", 
      lastUpdate: "2025-01-13 14:20",
      status: "warning",
      records: "45,672",
      size: "890 MB",
    },
    {
      id: "4",
      name: "担保关系数据",
      type: "关系数据",
      lastUpdate: "2025-01-10 09:15",
      status: "error",
      records: "23,156",
      size: "456 MB",
    },
  ];

  // Mock import tasks
  const importTasks = [
    {
      id: "1",
      name: "企业基础信息更新",
      status: "completed",
      progress: 100,
      startTime: "2025-01-15 10:00",
      endTime: "2025-01-15 10:30",
      records: "12,450",
    },
    {
      id: "2",
      name: "关系数据导入",
      status: "running",
      progress: 65,
      startTime: "2025-01-15 11:00",
      endTime: null,
      records: "8,900",
    },
    {
      id: "3",
      name: "历史数据清理",
      status: "failed",
      progress: 45,
      startTime: "2025-01-14 16:00",
      endTime: "2025-01-14 16:30",
      records: "0",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">正常</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">警告</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">异常</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">已完成</Badge>;
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">运行中</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">失败</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleImportData = () => {
    setIsImporting(true);
    setImportProgress(0);
    
    // Simulate import progress
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

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
              disabled={isImporting}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isImporting ? "导入中..." : "导入数据"}
            </Button>
          </div>
        </div>

        {/* Import Progress */}
        {isImporting && (
          <Alert>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <div className="space-y-2">
                <div>正在导入数据，请稍候...</div>
                <Progress value={importProgress} className="w-full" />
                <div className="text-sm text-muted-foreground">{importProgress}% 完成</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="sources" className="w-full">
          <TabsList>
            <TabsTrigger value="sources">数据源管理</TabsTrigger>
            <TabsTrigger value="tasks">导入任务</TabsTrigger>
            <TabsTrigger value="stats">数据统计</TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="space-y-4">
            {/* Data Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  数据源状态
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                            {getStatusBadge(source.status)}
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
                          <div className="font-medium">{source.lastUpdate}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">记录数：</span>
                          <div className="font-medium">{source.records}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">数据大小：</span>
                          <div className="font-medium">{source.size}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">状态：</span>
                          <div className="font-medium">
                            {source.status === 'active' ? '正常运行' : 
                             source.status === 'warning' ? '需要注意' : '需要修复'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {/* Import Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">数据导入任务</CardTitle>
              </CardHeader>
              <CardContent>
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
                          <div className="font-medium">{task.startTime}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">结束时间：</span>
                          <div className="font-medium">{task.endTime || "进行中"}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">处理记录：</span>
                          <div className="font-medium">{task.records}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">进度：</span>
                          <div className="font-medium">{task.progress}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                      <div className="text-2xl font-bold">283,492</div>
                      <div className="text-xs text-muted-foreground">总记录数</div>
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
                      <div className="text-2xl font-bold">5.4 GB</div>
                      <div className="text-xs text-muted-foreground">数据总量</div>
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
                      <div className="text-2xl font-bold">12,450</div>
                      <div className="text-xs text-muted-foreground">今日导入</div>
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
                      <div className="text-2xl font-bold">98.5%</div>
                      <div className="text-xs text-muted-foreground">数据质量</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Quality Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                数据质量监控：发现 1.5% 的数据存在质量问题，建议及时处理。
                <Button variant="link" className="p-0 ml-2 text-primary">
                  查看详情
                </Button>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
} 