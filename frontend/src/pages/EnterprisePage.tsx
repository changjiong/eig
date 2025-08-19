import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import GraphVisualization from "@/components/graph/GraphVisualization";
import EnterpriseDataTable from "@/components/enterprise/EnterpriseDataTable";
import RiskAnalysis from "@/components/enterprise/RiskAnalysis";
import MarketingRecommendations from "@/components/enterprise/MarketingRecommendations";
import EnterpriseSummaryCard from "@/components/enterprise/EnterpriseSummaryCard";
import ScoreCard from "@/components/enterprise/ScoreCard";
import RelationshipPath from "@/components/enterprise/RelationshipPath";
import EnterpriseSelectionList from "@/components/enterprise/EnterpriseSelectionList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import {
  Building2,
  FileText,
  BarChart2,
  Network,
  AlertCircle,
  Globe,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiService } from "@/services/api";
import { Enterprise, GraphData } from "@/types/database";

// 占位数据类型定义
interface MockRiskFactor {
  id: string;
  name: string;
  level: 'high' | 'medium' | 'low' | 'none';
  score: number;
  description: string;
}

interface MockFinancialData {
  year: string;
  revenue: number;
  profit: number;
  assets: number;
  liabilities: number;
  cashflow: number;
}

export default function EnterprisePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  
  // API数据状态
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [graphStats, setGraphStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!!id); // 只在有id时才显示loading
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 暂时保留的mock数据（待后续替换为真实API）
  const mockPaths = [
    {
      title: "最短授信路径",
      path: {
        nodes: [
          { id: "bank", name: "我行", type: "enterprise" as "enterprise" },
          { id: "ent5", name: "金辉集团", type: "enterprise" as "enterprise" },
          { id: "person1", name: "王总", type: "person" as "person" },
          { id: "ent1", name: enterprise?.name || "目标企业", type: "enterprise" as "enterprise" },
        ],
        edges: [
          { type: "合作", description: "是战略合作客户" },
          { type: "任职", description: "是法人代表" },
          { type: "控股", description: "持股35%" },
        ],
      },
      confidence: 85,
    },
    {
      title: "最佳推荐路径",
      path: {
        nodes: [
          { id: "bank", name: "我行", type: "enterprise" as "enterprise" },
          { id: "ent2", name: "蓝海科技", type: "enterprise" as "enterprise" },
          { id: "ent1", name: enterprise?.name || "目标企业", type: "enterprise" as "enterprise" },
        ],
        edges: [
          { type: "客户", description: "是总行级战略客户" },
          { type: "供应", description: "提供核心部件" },
        ],
      },
      confidence: 92,
    },
  ];

  const mockRiskFactors: MockRiskFactor[] = [
    {
      id: "rf1",
      name: "担保链风险",
      level: "high",
      score: 75,
      description: "检测到潜在担保链风险，建议进一步核实担保关系。",
    },
    {
      id: "rf2",
      name: "财务风险",
      level: "medium",
      score: 45,
      description: "财务指标正常，但需关注资产负债率变化趋势。",
    },
    {
      id: "rf3",
      name: "法律诉讼风险",
      level: "low",
      score: 25,
      description: "历史诉讼记录较少，法律风险可控。",
    },
    {
      id: "rf4",
      name: "行业政策风险",
      level: "medium",
      score: 50,
      description: "需关注相关行业政策变化对企业的影响。",
    },
    {
      id: "rf5",
      name: "信用记录风险",
      level: "none",
      score: 5,
      description: "信用记录良好，无不良征信信息。",
    },
  ];

  const mockFinancialData: MockFinancialData[] = [
    { year: "2024", revenue: 2150000000, profit: 258000000, assets: 2890000000, liabilities: 1650000000, cashflow: 275000000 },
    { year: "2023", revenue: 1820000000, profit: 205000000, assets: 2450000000, liabilities: 1380000000, cashflow: 235000000 },
    { year: "2022", revenue: 1450000000, profit: 178000000, assets: 2130000000, liabilities: 1180000000, cashflow: 198000000 },
    { year: "2021", revenue: 1230000000, profit: 148000000, assets: 1780000000, liabilities: 980000000, cashflow: 165000000 },
  ];

  const mockNews = [
    {
      id: "news1",
      title: `${enterprise?.name || "企业"} 最新业务动态`,
      date: "2025-01-15",
      source: "企业公告",
      type: "business" as const,
    },
    {
      id: "news2",
      title: "行业合作伙伴关系建立",
      date: "2025-01-10",
      source: "行业资讯",
      type: "partnership" as const,
    },
  ];

  const mockProductRecommendations = [
    {
      id: "pr1",
      name: "科技企业贷",
      description: "为科技企业量身定制的信贷产品，提供灵活的额度及还款方式。",
      matchScore: 95,
      features: ["专属信贷额度最高5000万元", "短期利率优惠，最低4.8%", "线上快捷审批流程"],
      benefits: ["提升资金周转效率", "降低融资成本", "加速业务发展"],
    },
  ];

  const mockMarketingStrategies = [
    {
      id: "ms1",
      title: "技术创新成果展示会",
      description: `针对${enterprise?.name || "该企业"}的技术优势，组织专项展示会推介相关金融产品。`,
      priority: "high" as const,
      expectedOutcome: "预计带动3-5笔金额超过3000万元的信贷合作。",
      steps: ["组建专业团队", "邀请目标客户", "准备技术展示", "现场产品推介"],
    },
  ];

  const mockValueProposition = enterprise?.name 
    ? `${enterprise.name}作为${enterprise.industry || "行业"}的优质企业，我行将提供全方位的金融支持，包括灵活的短期融资、供应链金融等产品，帮助企业保持健康的现金流并支持业务发展。`
    : "我行将为企业提供全方位的金融服务支持，助力企业发展壮大。";

  // 获取企业详情
  const fetchEnterpriseDetails = async () => {
    if (!id) {
      // 没有ID时，不需要加载企业详情，直接显示企业选择列表
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const [enterpriseResponse, graphResponse, statsResponse] = await Promise.allSettled([
        ApiService.Enterprise.getEnterprise(id),
        ApiService.Enterprise.getEnterpriseGraph(id),
        ApiService.Graph.getGraphStats()
      ]);

      // 处理企业详情
      if (enterpriseResponse.status === 'fulfilled' && enterpriseResponse.value.success) {
        setEnterprise(enterpriseResponse.value.data);
      } else {
        console.error('获取企业详情失败:', enterpriseResponse);
      }

      // 处理图谱数据
      if (graphResponse.status === 'fulfilled' && graphResponse.value.success) {
        setGraphData(graphResponse.value.data);
      } else {
        console.error('获取企业图谱失败:', graphResponse);
      }

      // 处理统计数据
      if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
        setGraphStats(statsResponse.value.data);
      }

    } catch (error) {
      console.error('获取企业数据失败:', error);
      setError('获取企业数据失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 计算企业评分
  const handleCalculateScore = async () => {
    if (!id) return;
    
    try {
      setIsCalculatingScore(true);
      const response = await ApiService.Enterprise.calculateScore(id);
      
      if (response.success && enterprise) {
        setEnterprise({
          ...enterprise,
          svs: response.data.svs,
          des: response.data.des,
          nis: response.data.nis,
          pcs: response.data.pcs,
        });
      }
    } catch (error) {
      console.error('计算评分失败:', error);
    } finally {
      setIsCalculatingScore(false);
    }
  };

  // 初始化loading状态
  useEffect(() => {
    setIsLoading(!!id);
    setError(null);
    if (id) {
      setEnterprise(null);
      setGraphData(null);
      setGraphStats(null);
    }
  }, [id]);

  // 初始化数据加载
  useEffect(() => {
    fetchEnterpriseDetails();
  }, [id]);

  // SVS评分明细
  const svsDetails = enterprise ? [
    { label: "财务健康度", value: (enterprise.svs * 0.9) || 0 },
    { label: "成长性", value: (enterprise.svs * 1.1) || 0 },
    { label: "行业地位", value: (enterprise.svs * 0.85) || 0 },
    { label: "规模评级", value: (enterprise.svs * 1.05) || 0 },
  ] : [];

  // DES评分明细
  const desDetails = enterprise ? [
    { label: "互动频率", value: (enterprise.des * 1.02) || 0 },
    { label: "互动质量", value: (enterprise.des * 0.96) || 0 },
    { label: "合作深度", value: (enterprise.des * 1.08) || 0 },
    { label: "依赖程度", value: (enterprise.des * 0.98) || 0 },
  ] : [];

  // NIS评分明细
  const nisDetails = enterprise ? [
    { label: "供应链影响力", value: (enterprise.nis * 0.92) || 0 },
    { label: "投资网络", value: (enterprise.nis * 0.88) || 0 },
    { label: "担保网络", value: (enterprise.nis * 1.05) || 0 },
    { label: "行业关联度", value: (enterprise.nis * 0.95) || 0 },
  ] : [];

  // Loading状态 - 只在有ID时才显示loading
  if (isLoading && id) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  // 错误状态
  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="link" className="ml-2" onClick={fetchEnterpriseDetails}>
                重试
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  // 没有企业ID时显示企业选择列表
  if (!id) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <EnterpriseSelectionList />
        </div>
      </MainLayout>
    );
  }

  // 企业不存在
  if (!enterprise) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              未找到指定企业信息，请检查企业ID是否正确。
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 面包屑导航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                onClick={() => navigate('/enterprise')}
                className="cursor-pointer hover:text-foreground"
              >
                企业管理
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{enterprise?.name || "企业详情"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/enterprise')}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              返回企业列表
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-2xl font-bold">企业360°视图</h1>
              <p className="text-muted-foreground mt-1">
                全方位了解企业信息、关系网络和价值评分
              </p>
            </div>
          </div>
          <Button 
            onClick={handleCalculateScore}
            disabled={isCalculatingScore}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isCalculatingScore ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart2 className="h-4 w-4" />
            )}
            {isCalculatingScore ? "计算中..." : "重新计算评分"}
          </Button>
        </div>

        {/* Enterprise Summary */}
        <EnterpriseSummaryCard
          name={enterprise.name}
          creditCode={enterprise.creditCode || ""}
          registrationAddress={enterprise.address || ""}
          establishmentDate={enterprise.establishDate ? new Date(enterprise.establishDate).toLocaleDateString() : ""}
          registeredCapital={enterprise.registeredCapital || 0}
          industry={enterprise.industry || ""}
          employeeCount={Math.floor(Math.random() * 500) + 100} // 临时数据
          contactPhone={enterprise.phone || ""}
          isClient={false} // 临时数据
          isProspect={true} // 临时数据
          onViewDetails={() => {}}
        />

        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="graph">关系图谱</TabsTrigger>
            <TabsTrigger value="financial">财务信息</TabsTrigger>
            <TabsTrigger value="risk">风险视图</TabsTrigger>
            <TabsTrigger value="marketing">营销建议</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Enterprise Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreCard
                title="静态价值评分 (SVS)"
                score={enterprise.svs || 0}
                description="基于企业基本信息、财务状况、行业地位等静态指标综合评估的企业价值得分"
                details={svsDetails}
              />
              <ScoreCard
                title="动态互动评分 (DES)"
                score={enterprise.des || 0}
                description="基于企业与银行的互动频率、质量和深度评估的关系活跃度得分"
                details={desDetails}
              />
              <ScoreCard
                title="网络影响力评分 (NIS)"
                score={enterprise.nis || 0}
                description="基于企业在产业链、投资网络和担保网络中的地位评估的影响力得分"
                details={nisDetails}
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Relationship Graph Preview */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-medium">
                        关系网络图谱
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("graph")}
                      >
                        展开详情
                      </Button>
                    </div>
                    <CardDescription>
                      显示企业核心关系网络，包括投资、担保、供应链关系
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {graphData ? (
                      <GraphVisualization height={300} data={graphData} />
                    ) : (
                      <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
                        <p className="text-muted-foreground">暂无图谱数据</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Warm Introduction Paths */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium">暖性介绍路径</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockPaths.map((path, index) => (
                      <RelationshipPath
                        key={index}
                        title={path.title}
                        path={path.path}
                        confidence={path.confidence}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column (1/3 width) */}
              <div className="space-y-6">
                {/* Enterprise Basic Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">
                      基本信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">经营范围</div>
                        <div className="text-sm text-muted-foreground line-clamp-4">
                          {enterprise.businessScope || "暂无经营范围信息"}
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">
                          企业评分与等级
                        </div>
                        <div className="text-sm text-primary font-medium">
                          PCS评分: {enterprise.pcs?.toFixed(1) || "未计算"} (A级)
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* News Feed */}
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">
                      最新动态
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[240px]">
                      <div className="space-y-0">
                        {mockNews.map((item, i) => (
                          <>
                            <div
                              key={item.id}
                              className="flex gap-2 p-4 hover:bg-muted/50 cursor-pointer"
                            >
                              {item.type === "business" ? (
                                <BarChart2 className="h-5 w-5 text-primary" />
                              ) : item.type === "partnership" ? (
                                <Network className="h-5 w-5 text-secondary" />
                              ) : (
                                <Globe className="h-5 w-5 text-accent" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">
                                  {item.title}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                  <span>{item.date}</span>
                                  <span>{item.source}</span>
                                </div>
                              </div>
                            </div>
                            {i < mockNews.length - 1 && <Separator />}
                          </>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Risk Warning */}
                <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-600">风险提示</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-yellow-600/90">
                      系统检测到该企业可能存在行业政策风险，建议关注相关政策变化对企业经营的影响。
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Graph Tab */}
          <TabsContent value="graph">
            <Card className="w-full h-[600px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  企业关系网络图谱
                </CardTitle>
                <CardDescription>
                  全面展示企业的投资关系、担保关系、供应链关系等
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {graphData ? (
                  <GraphVisualization height={520} data={graphData} />
                ) : (
                  <div className="h-[520px] flex flex-col items-center justify-center bg-muted/30 rounded-md">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">暂无图谱数据</p>
                    <Button variant="outline" className="mt-4" onClick={fetchEnterpriseDetails}>
                      重新加载
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <EnterpriseDataTable 
              enterpriseName={enterprise.name} 
              financialData={mockFinancialData}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">财务指标趋势</CardTitle>
                  <CardDescription>基于历史数据分析</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
                    <p className="text-sm text-muted-foreground">财务图表功能开发中</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">行业对比分析</CardTitle>
                  <CardDescription>在{enterprise.industry}行业中的表现</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
                    <p className="text-sm text-muted-foreground">行业对比功能开发中</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Tab */}
          <TabsContent value="risk" className="space-y-6">
            <RiskAnalysis
              enterpriseName={enterprise.name}
              riskFactors={mockRiskFactors}
              overallRiskScore={62}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">担保链分析</CardTitle>
                  <CardDescription>企业担保关系网络及风险传导</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
                    <p className="text-sm text-muted-foreground">担保链分析功能开发中</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">风险预警记录</CardTitle>
                  <CardDescription>近期检测到的风险事件</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
                    <p className="text-sm text-muted-foreground">风险预警功能开发中</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing">
            <MarketingRecommendations
              enterpriseName={enterprise.name}
              productRecommendations={mockProductRecommendations}
              strategies={mockMarketingStrategies}
              valueProposition={mockValueProposition}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}