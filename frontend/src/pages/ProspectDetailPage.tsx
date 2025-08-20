import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import ScoreCircle from "@/components/prospects/ScoreCircle";
import { ArrowLeft, Building, Users, DollarSign, TrendingUp, Target, Info, CheckCircle } from "lucide-react";
import ApiService from "@/services/api";
import { Prospect } from "@/types/database";

export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取潜客详情
  useEffect(() => {
    const fetchProspect = async () => {
      if (!id) {
        setError("缺少潜客ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await ApiService.Prospect.getProspect(id);
        
        if (response.success && response.data) {
          setProspect(response.data);
        } else {
          setError(response.message || "获取潜客详情失败");
        }
      } catch (err) {
        console.error("Error fetching prospect:", err);
        setError("网络错误，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchProspect();
  }, [id]);

  // 加载状态
  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  // 错误状态
  if (error || !prospect) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {error || "未找到指定潜客信息，请检查潜客ID是否正确。"}
              <Button variant="link" className="ml-2" onClick={() => navigate('/prospects')}>
                返回潜客列表
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                onClick={() => navigate('/prospects')}
                className="cursor-pointer hover:text-foreground"
              >
                潜客发现
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{prospect.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/prospects')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{prospect.name}</h1>
              <p className="text-muted-foreground">潜在客户详细信息</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Target className="h-4 w-4 mr-2" />
              加入跟进
            </Button>
            <Button>
              <CheckCircle className="h-4 w-4 mr-2" />
              转化为客户
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-500" />
                <div className="text-sm text-muted-foreground">行业领域</div>
              </div>
              <div className="text-2xl font-bold">{prospect.industry}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <div className="text-sm text-muted-foreground">注册资本</div>
              </div>
              <div className="text-2xl font-bold">
                {prospect.registeredCapital 
                  ? (prospect.registeredCapital / 10000).toFixed(0) + '万元'
                  : '--'
                }
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <div className="text-sm text-muted-foreground">员工人数</div>
              </div>
              <div className="text-2xl font-bold">
                {prospect.employeeCount ? prospect.employeeCount + '人' : '--'}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <div className="text-sm text-muted-foreground">综合评分</div>
              </div>
              <div className="text-2xl font-bold">
                {prospect.pcs && prospect.svs && prospect.des && prospect.nis
                  ? Math.round((prospect.pcs + prospect.svs + prospect.des + prospect.nis) / 4)
                  : '--'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">企业概览</TabsTrigger>
            <TabsTrigger value="scores">评分详情</TabsTrigger>
            <TabsTrigger value="discovery">发现路径</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">公司名称</div>
                    <div className="font-medium">{prospect.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">行业领域</div>
                    <div className="font-medium">{prospect.industry}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">优先级</div>
                    <div className="font-medium capitalize">{'--'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">状态</div>
                    <div className="font-medium capitalize">{prospect.status || '--'}</div>
                  </div>
                </div>
                {prospect.notes && (
                  <div>
                    <div className="text-sm text-muted-foreground">备注</div>
                    <div className="font-medium">{prospect.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scores" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>四维评分体系</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="flex flex-col items-center">
                    <ScoreCircle score={prospect.pcs || 0} />
                    <h3 className="text-sm font-medium mt-4">PCS评分</h3>
                    <p className="text-xs text-muted-foreground text-center">
                      潜在客户评分
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ScoreCircle score={prospect.svs || 0} />
                    <h3 className="text-sm font-medium mt-4">SVS评分</h3>
                    <p className="text-xs text-muted-foreground text-center">
                      服务价值评分
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ScoreCircle score={prospect.des || 0} />
                    <h3 className="text-sm font-medium mt-4">DES评分</h3>
                    <p className="text-xs text-muted-foreground text-center">
                      数字化评分
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ScoreCircle score={prospect.nis || 0} />
                    <h3 className="text-sm font-medium mt-4">NIS评分</h3>
                    <p className="text-xs text-muted-foreground text-center">
                      网络影响力评分
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discovery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>潜客发现路径</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">发现方式</p>
                  <p className="font-medium">
                    {prospect.discoveryPath || '暂无发现路径信息'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
