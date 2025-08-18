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
import { useState } from "react";
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

// Define task type for better type safety
type TaskType = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  dueDate: string;
  priority: number;
  status: "pending" | "in_progress" | "completed" | "rejected";
  type: "entity_review" | "relationship_review" | "event_verification";
};

// Mock data for the dashboard
const mockTasks: TaskType[] = [
  {
    id: "t1",
    title: "企业信息审核 - 新阳科技有限公司",
    description:
      "请审核新阳科技有限公司的基本信息和财务数据，确认数据准确性并更新风险标签。",
    createdAt: "2025-08-10T08:30:00Z",
    dueDate: "2025-08-16T17:00:00Z",
    priority: 3,
    status: "pending",
    type: "entity_review",
  },
  {
    id: "t2",
    title: "关系审核 - 投资链关系确认",
    description:
      "确认华泰集团与锦程控股之间的投资关系，验证持股比例和投资时间的准确性。",
    createdAt: "2025-08-12T14:20:00Z",
    dueDate: "2025-08-14T17:00:00Z",
    priority: 4,
    status: "in_progress",
    type: "relationship_review",
  },
  {
    id: "t3",
    title: "事件验证 - 融资事件核实",
    description:
      "核实蓝海科技最新一轮融资信息，包括融资金额、投资方和融资时间。",
    createdAt: "2025-08-13T09:15:00Z",
    dueDate: "2025-08-17T17:00:00Z",
    priority: 2,
    status: "pending",
    type: "event_verification",
  },
];

const mockEvents = [
  {
    id: "e1",
    title: "星达科技完成C轮5亿元融资",
    description:
      "星达科技于8月5日宣布完成C轮5亿元融资，由红杉资本领投，老股东蓝湖资本、IDG资本跟投。",
    enterpriseId: "ent1",
    enterpriseName: "星达科技有限公司",
    eventType: "financing" as "financing",
    date: "2025-08-05T10:00:00Z",
    importance: 85,
    source: "企业公告",
  },
  {
    id: "e2",
    title: "远洋集团收购金海物流30%股权",
    description:
      "远洋集团宣布以6.8亿元收购金海物流30%股权，成为其第二大股东。",
    enterpriseId: "ent2",
    enterpriseName: "远洋集团",
    eventType: "investment" as "investment",
    date: "2025-08-08T14:30:00Z",
    importance: 75,
    source: "行业资讯",
  },
  {
    id: "e3",
    title: "蓝天电子涉及专利侵权诉讼",
    description:
      "蓝天电子被竞争对手提起专利侵权诉讼，涉案金额约2000万元。",
    enterpriseId: "ent3",
    enterpriseName: "蓝天电子科技有限公司",
    eventType: "litigation" as "litigation",
    date: "2025-08-10T09:45:00Z",
    importance: 60,
    source: "法院公告",
  },
];

const mockProspects = [
  {
    id: "p1",
    name: "未来科技有限公司",
    industry: "信息技术",
    registeredCapital: 50000000,
    employeeCount: 128,
    pcsScore: 92,
    svsScore: 88,
    desScore: 95,
    nisScore: 90,
    discoveryPath: "通过现有客户星达科技的供应链关系发现",
  },
  {
    id: "p2",
    name: "东方智能系统有限公司",
    industry: "人工智能",
    registeredCapital: 30000000,
    employeeCount: 75,
    pcsScore: 85,
    svsScore: 82,
    desScore: 78,
    nisScore: 91,
    discoveryPath: "通过远洋集团的投资关系发现",
  },
  {
    id: "p3",
    name: "绿源新能源科技有限公司",
    industry: "新能源",
    registeredCapital: 100000000,
    employeeCount: 210,
    pcsScore: 78,
    svsScore: 85,
    desScore: 72,
    nisScore: 76,
    discoveryPath: "通过行业关联性分析发现",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskType[]>(mockTasks);
  
  // 使用数据Hook获取Dashboard数据
  const { 
    enterprises, 
    clients, 
    dataSources, 
    isLoading, 
    hasError, 
    refetchAll 
  } = useDashboardData();
  const [events, setEvents] = useState(mockEvents);

  // Handler for task actions
  const handleTaskAction = (id: string, action: "start" | "complete" | "reject") => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          return {
            ...task,
            status:
              action === "start"
                ? "in_progress"
                : action === "complete"
                ? "completed"
                : "rejected",
          };
        }
        return task;
      })
    );
  };

  // Handler for event actions
  const handleEventAction = (id: string, action: "view" | "ignore") => {
    if (action === "ignore") {
      setEvents(events.filter((event) => event.id !== id));
    } else {
      // Navigate to enterprise detail view
      const event = events.find((e) => e.id === id);
      if (event) {
        navigate(`/enterprise/${event.enterpriseId}`);
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
            value="48"
            icon={<Target className="h-5 w-5" />}
            trend={{ value: 12, label: "较上月", isPositive: true }}
          />
          <StatCard
            title="待处理任务"
            value="16"
            icon={<Clock className="h-5 w-5" />}
            trend={{ value: 5, label: "较昨日", isPositive: false }}
          />
          <StatCard
            title="潜客转化率"
            value="32.5%"
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{ value: 4.2, label: "较上季度", isPositive: true }}
          />
          <StatCard
            title="本季贡献收入"
            value="5.8亿"
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
              {mockProspects.map((prospect) => (
                <ProspectCard
                  key={prospect.id}
                  {...prospect}
                  onSelect={handleProspectSelect}
                />
              ))}
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