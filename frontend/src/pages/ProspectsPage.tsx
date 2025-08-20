import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import ProspectCard from "@/components/prospects/ProspectCard";
import { Skeleton } from "@/components/ui/skeleton";
import ApiService from "@/services/api";
import { Prospect } from "@/types/database";
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



export default function ProspectsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("discovery");
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取潜客列表
  useEffect(() => {
    const fetchProspects = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ApiService.Prospect.getProspects({ limit: 50 });
        
        if (response.success && response.data) {
          setProspects(response.data);
        } else {
          setError(response.message || "获取潜客列表失败");
        }
      } catch (err) {
        console.error("Error fetching prospects:", err);
        setError("网络错误，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchProspects();
  }, []);

  // Handler for prospect selection
  const handleProspectSelect = (id: string) => {
    navigate(`/prospect/${id}`);
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
              {loading ? (
                // 加载骨架屏
                [...Array(6)].map((_, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              ) : error ? (
                // 错误状态
                <div className="col-span-full">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{error}</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => window.location.reload()}
                    >
                      重试
                    </Button>
                  </div>
                </div>
              ) : prospects.length === 0 ? (
                // 空状态
                <div className="col-span-full">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">暂无潜客数据</p>
                  </div>
                </div>
              ) : (
                // 正常显示潜客列表
                prospects.map((prospect) => (
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
              )}
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