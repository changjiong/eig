import {
  BarChart3,
  Clock,
  Target,
  Briefcase,
  TrendingUp,
  ChevronRight,
  Users,
  Search,
  Network,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TaskItem from "@/components/dashboard/TaskItem";
import EventCard from "@/components/dashboard/EventCard";
import ProspectCard from "@/components/prospects/ProspectCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useData";
import { ApiService } from "@/services/api";
import { Task, Event, Prospect } from "@/types/database";



export default function HomePage() {
  const navigate = useNavigate();
  
  // State management for dashboard data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    newProspects: 0,
    pendingTasks: 0,
    conversionRate: 0,
    quarterlyRevenue: 0
  });
  
  const [tasksLoading, setTasksLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [prospectsLoading, setProspectsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 使用数据Hook获取Dashboard数据
  const { 
    enterprises, 
    clients, 
    dataSources, 
    isLoading, 
    hasError: dashboardHasError, 
    refetchAll 
  } = useDashboardData();

  // 加载任务数据
  const loadTasks = async () => {
    try {
      setTasksLoading(true);
      const response = await ApiService.Task.getTasks({ limit: 5 });
      if (response.success && response.data) {
        setTasks(response.data);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setHasError(true);
      setErrorMessage('加载任务数据失败');
    } finally {
      setTasksLoading(false);
    }
  };

  // 加载事件数据
  const loadEvents = async () => {
    try {
      setEventsLoading(true);
      const response = await ApiService.Event.getEvents({ 
        limit: 5, 
        importance_min: 60 
      });
      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  // 加载潜客数据
  const loadProspects = async () => {
    try {
      setProspectsLoading(true);
      const response = await ApiService.Prospect.getHighPriorityProspects(3);
      if (response.success && response.data) {
        setProspects(response.data);
      }
    } catch (error) {
      console.error('Failed to load prospects:', error);
    } finally {
      setProspectsLoading(false);
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      
      // 获取统计数据 - 这里可以并行获取多个API的数据
      const [prospectsResponse, graphStatsResponse] = await Promise.all([
        ApiService.Prospect.getProspects({ limit: 100 }).catch(() => ({ success: false, data: [] })),
        ApiService.Graph.getGraphStats().catch(() => ({ success: false, data: null }))
      ]);
      
      // 计算统计数据
      const prospectsCount = prospectsResponse.success && 'pagination' in prospectsResponse && prospectsResponse.pagination 
        ? prospectsResponse.pagination.total 
        : 0;
        
      const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
      
      setDashboardStats({
        newProspects: prospectsCount,
        pendingTasks: pendingTasksCount,
        conversionRate: 32.5, // 暂时使用默认值，后续可以从专门的统计API获取
        quarterlyRevenue: 5.8   // 暂时使用默认值
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      // 设置默认值
      setDashboardStats({
        newProspects: 0,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        conversionRate: 0,
        quarterlyRevenue: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // 初始化数据加载
  useEffect(() => {
    loadTasks();
    loadEvents();
    loadProspects();
    loadStats();
  }, []);

  // 更新统计数据中的任务数
  useEffect(() => {
    if (tasks.length > 0) {
      setDashboardStats(prev => ({
        ...prev,
        pendingTasks: tasks.filter(t => t.status === 'pending').length
      }));
    }
  }, [tasks]);

  // Handler for task actions
  const handleTaskAction = async (id: string, action: "start" | "complete" | "reject") => {
    try {
      const newStatus = action === "start" 
        ? "in_progress" 
        : action === "complete" 
        ? "completed" 
        : "cancelled";
        
      await ApiService.Task.updateTask(id, { status: newStatus });
      
      setTasks(
        tasks.map((task) => {
          if (task.id === id) {
            return {
              ...task,
              status: newStatus as any,
            };
          }
          return task;
        })
      );
    } catch (error) {
      console.error('Failed to update task:', error);
      setHasError(true);
      setErrorMessage('更新任务状态失败');
    }
  };

  // Handler for event actions
  const handleEventAction = (id: string, action: "view" | "ignore") => {
    if (action === "ignore") {
      setEvents(events.filter((event) => event.id !== id));
    } else {
      // Navigate to enterprise detail view
      const event = events.find((e) => e.id === id);
      if (event) {
        navigate(`/enterprise/${event.enterpriseId || event.id}`);
      }
    }
  };

  // Handler for prospect selection
  const handleProspectSelect = (id: string) => {
    navigate(`/prospects/${id}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">工作台</h1>
          <p className="text-muted-foreground mt-1">
            欢迎使用企业智能图谱平台，快速发现高价值客户和业务机会
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="本月新增潜客"
            value={statsLoading ? "-" : dashboardStats.newProspects.toString()}
            icon={<Target className="h-5 w-5" />}
            trend={{ value: 12, label: "较上月", isPositive: true }}
          />
          <StatCard
            title="待处理任务"
            value={tasksLoading ? "-" : dashboardStats.pendingTasks.toString()}
            icon={<Clock className="h-5 w-5" />}
            trend={{ value: 5, label: "较昨日", isPositive: false }}
          />
          <StatCard
            title="潜客转化率"
            value={statsLoading ? "-" : `${dashboardStats.conversionRate}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{ value: 4.2, label: "较上季度", isPositive: true }}
          />
          <StatCard
            title="本季贡献收入"
            value={statsLoading ? "-" : `${dashboardStats.quarterlyRevenue}亿`}
            icon={<Briefcase className="h-5 w-5" />}
            trend={{ value: 15, label: "较上季度", isPositive: true }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* High Priority Prospects */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">高优先级潜客</h2>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-muted-foreground"
                onClick={() => navigate("/prospects")}
              >
                <span>查看全部</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prospectsLoading ? (
                // Loading skeletons
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))
              ) : prospects.length > 0 ? (
                                 prospects.slice(0, 3).map((prospect) => (
                   <ProspectCard
                     key={prospect.id}
                     id={prospect.id}
                     name={prospect.name}
                     industry={prospect.industry}
                     registeredCapital={prospect.registeredCapital}
                     employeeCount={prospect.employeeCount}
                     pcsScore={prospect.pcs}
                     svsScore={prospect.svs}
                     desScore={prospect.des}
                     nisScore={prospect.nis}
                     discoveryPath={prospect.discoveryPath}
                     onSelect={handleProspectSelect}
                   />
                 ))
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  暂无高优先级潜客数据
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-medium mb-4">快捷操作</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => navigate("/search")}
              >
                <Search className="h-6 w-6" />
                <span>企业搜索</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => navigate("/graph")}
              >
                <Network className="h-6 w-6" />
                <span>图谱探索</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => navigate("/prospects")}
              >
                <Target className="h-6 w-6" />
                <span>潜客发现</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => navigate("/clients")}
              >
                <Users className="h-6 w-6" />
                <span>客户管理</span>
              </Button>
            </div>

            {/* Recent Reports */}
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  图谱洞察分析
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span>产业集群分析报告</span>
                    </div>
                    <span className="text-xs text-muted-foreground">昨天</span>
                  </div>
                  <div className="flex justify-between items-center text-sm p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span>高科技行业机会分析</span>
                    </div>
                    <span className="text-xs text-muted-foreground">3天前</span>
                  </div>
                  <div className="flex justify-between items-center text-sm p-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span>企业风险关联报告</span>
                    </div>
                    <span className="text-xs text-muted-foreground">上周</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Marketing Trigger Events */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">营销触发事件</h2>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-muted-foreground"
              >
                <span>查看全部</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  {...event}
                  onAction={handleEventAction}
                />
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">任务待办</h2>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-muted-foreground"
              >
                <span>查看全部</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  {...task}
                  onAction={handleTaskAction}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}