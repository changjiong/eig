import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import ProspectCard from "@/components/prospects/ProspectCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Search,
  Filter,
  Download,
  Sliders,
  Settings,
  Target,
  Users,
} from "lucide-react";

// Mock prospects data
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
  {
    id: "p4",
    name: "康健医疗器械有限公司",
    industry: "医疗健康",
    registeredCapital: 45000000,
    employeeCount: 156,
    pcsScore: 88,
    svsScore: 84,
    desScore: 90,
    nisScore: 82,
    discoveryPath: "通过供应商关系网络发现",
  },
  {
    id: "p5",
    name: "蓝海数据科技有限公司",
    industry: "大数据",
    registeredCapital: 25000000,
    employeeCount: 68,
    pcsScore: 83,
    svsScore: 80,
    desScore: 87,
    nisScore: 79,
    discoveryPath: "通过行业聚类分析发现",
  },
  {
    id: "p6",
    name: "金辉半导体科技有限公司",
    industry: "半导体",
    registeredCapital: 150000000,
    employeeCount: 320,
    pcsScore: 94,
    svsScore: 92,
    desScore: 89,
    nisScore: 95,
    discoveryPath: "通过产业链分析发现",
  },
];

export default function ProspectsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("discovery");

  // Handler for prospect selection
  const handleProspectSelect = (id: string) => {
    navigate(`/enterprise/${id}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">潜客发现中心</h1>
          <p className="text-muted-foreground mt-1">
            发现高价值潜在客户，智能推荐最佳营销策略
          </p>
        </div>

        <Tabs
          defaultValue="discovery"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="discovery" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>潜客发现</span>
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>我的潜客</span>
            </TabsTrigger>
          </TabsList>

          {/* Discovery Tab Content */}
          <TabsContent value="discovery" className="space-y-6">
            {/* Algorithm Task Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  潜客挖掘任务配置
                </CardTitle>
                <CardDescription>
                  配置挖掘算法的种子节点、路径规则和过滤条件
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      种子客户选择
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择种子企业" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">所有现有客户</SelectItem>
                        <SelectItem value="strategic">战略级客户</SelectItem>
                        <SelectItem value="tech">科技行业客户</SelectItem>
                        <SelectItem value="manufacturing">制造业客户</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      关系路径类型
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择关系类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">所有关系</SelectItem>
                        <SelectItem value="investment">投资关系</SelectItem>
                        <SelectItem value="supply">供应链关系</SelectItem>
                        <SelectItem value="similar">同业关系</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      最小PCS评分要求
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择最低分数" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="70">70分以上</SelectItem>
                        <SelectItem value="80">80分以上</SelectItem>
                        <SelectItem value="90">90分以上</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <Button variant="outline" size="sm">
                      高级配置
                    </Button>
                  </div>
                  <Button>运行挖掘算法</Button>
                </div>
              </CardContent>
            </Card>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 flex items-center gap-2 min-w-[300px]">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索潜客名称、行业或特征..."
                  className="flex-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Sliders className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Prospects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockProspects.map((prospect) => (
                <ProspectCard
                  key={prospect.id}
                  {...prospect}
                  onSelect={handleProspectSelect}
                />
              ))}
            </div>
          </TabsContent>

          {/* My Prospects Tab Content */}
          <TabsContent value="assigned">
            <Card>
              <CardHeader>
                <CardTitle>我的潜客</CardTitle>
                <CardDescription>
                  查看和管理分配给你的潜在客户
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  我的潜客页面将在下一阶段实现
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}