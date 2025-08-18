import { useState } from "react";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import GraphVisualization from "@/components/graph/GraphVisualization";
import EnterpriseDataTable from "@/components/enterprise/EnterpriseDataTable";
import RiskAnalysis from "@/components/enterprise/RiskAnalysis";
import MarketingRecommendations from "@/components/enterprise/MarketingRecommendations";
import EnterpriseSummaryCard from "@/components/enterprise/EnterpriseSummaryCard";
import ScoreCard from "@/components/enterprise/ScoreCard";
import RelationshipPath from "@/components/enterprise/RelationshipPath";
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
import {
  Building2,
  FileText,
  BarChart2,
  Network,
  AlertCircle,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock graph data for visualization
const mockGraphData = {
  nodes: [
    { id: "ent1", name: "星达科技有限公司", type: "enterprise" as "enterprise", value: 1.0 },
    { id: "ent2", name: "蓝海科技", type: "enterprise" as "enterprise", value: 0.8 },
    { id: "ent3", name: "金辉集团", type: "enterprise" as "enterprise", value: 0.9 },
    { id: "ent4", name: "云尚数据", type: "enterprise" as "enterprise", value: 0.7 },
    { id: "ent5", name: "宏远投资", type: "enterprise" as "enterprise", value: 0.6 },
    { id: "person1", name: "王总", type: "person" as "person", value: 0.8 },
    { id: "person2", name: "李董", type: "person" as "person", value: 0.7 },
    { id: "person3", name: "张经理", type: "person" as "person", value: 0.5 },
    { id: "product1", name: "科技贷", type: "product" as "product", value: 0.6 },
  ],
  links: [
    { source: "ent1", target: "ent2", type: "supply" as "supply", value: 0.9 },
    { source: "person1", target: "ent1", type: "investment" as "investment", value: 0.8 },
    { source: "person2", target: "ent2", type: "investment" as "investment", value: 0.7 },
    { source: "ent3", target: "ent1", type: "investment" as "investment", value: 0.8 },
    { source: "ent1", target: "product1", type: "other" as "other", value: 0.6 },
    { source: "ent2", target: "ent4", type: "supply" as "supply", value: 0.5 },
    { source: "ent5", target: "ent1", type: "guarantee" as "guarantee", value: 0.7 },
    { source: "ent2", target: "ent1", type: "risk" as "risk", value: 0.4 },
    { source: "person3", target: "ent4", type: "investment" as "investment", value: 0.6 },
    { source: "ent3", target: "person2", type: "other" as "other", value: 0.3 },
  ]
};

// Mock enterprise data
const mockEnterprise = {
  id: "ent1",
  name: "星达科技有限公司",
  creditCode: "91330106MA2GL1RQ5X",
  registrationAddress: "北京市海淀区中关村南大街5号",
  establishmentDate: "2018-03-15",
  registeredCapital: 80000000,
  industry: "信息技术服务",
  business_scope:
    "计算机软硬件技术开发、技术服务、技术咨询；数据处理；应用软件服务；计算机系统服务；销售计算机软硬件及辅助设备；企业管理咨询；市场调查；经济贸易咨询；会议服务；承办展览展示活动；设计、制作、代理、发布广告。",
  employeeCount: 235,
  contactPhone: "010-88887777",
  isClient: true,
  isProspect: false,
  svs_score: 87.5,
  des_score: 92.3,
  nis_score: 78.6,
  pcs_score: 86.1,
};

// Mock relationship paths data
const mockPaths = [
  {
    title: "最短授信路径",
    path: {
      nodes: [
        { id: "bank", name: "我行", type: "enterprise" as "enterprise" },
        { id: "ent5", name: "金辉集团", type: "enterprise" as "enterprise" },
        { id: "person1", name: "王总", type: "person" as "person" },
        { id: "ent1", name: "星达科技", type: "enterprise" as "enterprise" },
      ],
      edges: [
        {
          type: "合作",
          description: "是战略合作客户",
        },
        {
          type: "任职",
          description: "是法人代表",
        },
        {
          type: "控股",
          description: "持股35%",
        },
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
        { id: "ent1", name: "星达科技", type: "enterprise" as "enterprise" },
      ],
      edges: [
        {
          type: "客户",
          description: "是总行级战略客户",
        },
        {
          type: "供应",
          description: "提供核心部件",
        },
      ],
    },
    confidence: 92,
  },
  {
    title: "产品推荐路径",
    path: {
      nodes: [
        { id: "bank", name: "我行", type: "enterprise" as "enterprise" },
        { id: "product1", name: "科技贷", type: "product" as "product" },
        { id: "ent1", name: "星达科技", type: "enterprise" as "enterprise" },
      ],
      edges: [
        {
          type: "提供",
          description: "提供专属贷款产品",
        },
        {
          type: "适用",
          description: "高度匹配企业需求",
        },
      ],
    },
    confidence: 78,
  },
];

// Mock marketing data
const mockProductRecommendations = [
  {
    id: "pr1",
    name: "科技企业贷",
    description: "为科技企业量身定制的信贷产品，提供灵活的额度及还款方式，加快企业技术创新和业务扩张。",
    matchScore: 95,
    features: [
      "专属信贷额度最高5000万元",
      "短期周转融资可地推出放",
      "短期利率优惠，最低4.8%",
      "线上快捷审批流程",
    ],
    benefits: [
      "提升资金周转效率",
      "改善企业现金流",
      "降低融资成本",
      "加速业务发展",
    ],
  },
  {
    id: "pr2",
    name: "供应链金融",
    description: "基于核心企业信用的供应链融资方案，助力供应商管理，编织安全高效的供应链金融网络。",
    matchScore: 87,
    features: [
      "基于真实交易背景的融资",
      "畅通企业上下游资金流",
      "综合授信额度准划",
      "订单融资、应收账款融资等多元产品",
    ],
    benefits: [
      "优化供应链市场投放",
      "增强上下游关系",
      "降低供应商资金压力",
      "提高整体运营效率",
    ],
  },
];

const mockMarketingStrategies = [
  {
    id: "ms1",
    title: "技术创新成果展示会",
    description: "通过组织技术成果展示会，展示星达科技的最新技术创新，同时推介我行科技企业贷产品，形成业务协同效应。",
    priority: "high" as "high",
    expectedOutcome: "预计带动3-5笔金额超过3000万元的信贷合作，建立科技金融服务品牌形象。",
    steps: [
      "签约关键客户经理和技术专家组成联合团队",
      "选择目标行业高端企业进行邀请",
      "准备案例分析与实时技术展示",
      "量身定制科技贷方案并现场推介",
    ],
  },
  {
    id: "ms2",
    title: "供应链合作伙伴计划",
    description: "基于星达科技在供应链中的重要位置，推出供应链金融整体解决方案，覆盖上下游核心企业。",
    priority: "medium" as "medium",
    expectedOutcome: "预计可覆盖6-8家供应链企业，建立完整的供应链金融生态圈。",
    steps: [
      "构建星达科技供应链图谱",
      "识别关键供应商及其金融需求",
      "设计多元化金融产品组合",
      "组织供应链金融合作洽谈会",
    ],
  },
];

const mockValueProposition = "星达科技作为行业领先的技术创新企业，我行将提供全方位的金融支持，包括灵活的短期融资、供应链金融和技术升级专项贷款，帮助贵公司保持现金流健康，加快新一代产品研发周期，并为即将到来的国际市场扩张提供充足的资金储备。同时，我们的供应链金融解决方案将帮助贵公司优化上下游合作伙伴的资金管理，形成更健康高效的商业生态圈。";

// Mock risk data
const mockRiskFactors = [
  {
    id: "rf1",
    name: "担保链风险",
    level: "high" as "high",
    score: 75,
    description: "与蓝海科技之间存在交叉担保情况，担保金额达5000万元，存在连环担保风险。",
  },
  {
    id: "rf2",
    name: "财务风险",
    level: "medium" as "medium",
    score: 45,
    description: "近两年财务杠杆率增加，资产负债率从45%上升至58%，但仍处于行业平均水平范围内。",
  },
  {
    id: "rf3",
    name: "法律诉讼风险",
    level: "low" as "low",
    score: 25,
    description: "存在3起商业合同纠纷，均为小额诉讼，总涉案金额约200万元，对企业经营影响有限。",
  },
  {
    id: "rf4",
    name: "行业政策风险",
    level: "medium" as "medium",
    score: 50,
    description: "所在IT行业面临政策调整，需关注数据安全与隐私保护相关新规对企业业务的影响。",
  },
  {
    id: "rf5",
    name: "信用记录风险",
    level: "none" as "none",
    score: 5,
    description: "近5年内无不良信用记录，各项贷款均按时还款，征信记录良好。",
  },
];

// Mock financial data
const mockFinancialData = [
  { year: "2025", revenue: 2578000000, profit: 298000000, assets: 3125000000, liabilities: 1820000000, cashflow: 356000000 },
  { year: "2024", revenue: 2150000000, profit: 258000000, assets: 2890000000, liabilities: 1650000000, cashflow: 275000000 },
  { year: "2023", revenue: 1820000000, profit: 205000000, assets: 2450000000, liabilities: 1380000000, cashflow: 235000000 },
  { year: "2022", revenue: 1450000000, profit: 178000000, assets: 2130000000, liabilities: 1180000000, cashflow: 198000000 },
  { year: "2021", revenue: 1230000000, profit: 148000000, assets: 1780000000, liabilities: 980000000, cashflow: 165000000 },
];

// Mock news data
const mockNews = [
  {
    id: "news1",
    title: "星达科技完成C轮5亿元融资",
    date: "2025-08-05",
    source: "企业公告",
    type: "financing",
  },
  {
    id: "news2",
    title: "星达科技与微软达成战略合作",
    date: "2025-07-12",
    source: "行业资讯",
    type: "partnership",
  },
  {
    id: "news3",
    title: "星达科技推出新一代AI解决方案",
    date: "2025-06-28",
    source: "公司官网",
    type: "product",
  },
];

export default function EnterprisePage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock SVS score breakdown
  const svsDetails = [
    { label: "财务健康度", value: 85.2 },
    { label: "成长性", value: 92.5 },
    { label: "行业地位", value: 78.6 },
    { label: "规模评级", value: 90.1 },
  ];

  // Mock DES score breakdown
  const desDetails = [
    { label: "互动频率", value: 94.3 },
    { label: "互动质量", value: 88.7 },
    { label: "合作深度", value: 95.6 },
    { label: "依赖程度", value: 90.5 },
  ];

  // Mock NIS score breakdown
  const nisDetails = [
    { label: "供应链影响力", value: 82.3 },
    { label: "投资网络", value: 75.8 },
    { label: "担保网络", value: 85.2 },
    { label: "行业关联度", value: 72.0 },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">企业360°视图</h1>
          <p className="text-muted-foreground mt-1">
            全方位了解企业信息、关系网络和价值评分
          </p>
        </div>

        {/* Enterprise Summary */}
        <EnterpriseSummaryCard
          name={mockEnterprise.name}
          creditCode={mockEnterprise.creditCode}
          registrationAddress={mockEnterprise.registrationAddress}
          establishmentDate={mockEnterprise.establishmentDate}
          registeredCapital={mockEnterprise.registeredCapital}
          industry={mockEnterprise.industry}
          employeeCount={mockEnterprise.employeeCount}
          contactPhone={mockEnterprise.contactPhone}
          isClient={mockEnterprise.isClient}
          isProspect={mockEnterprise.isProspect}
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
                score={mockEnterprise.svs_score}
                description="基于企业基本信息、财务状况、行业地位等静态指标综合评估的企业价值得分"
                details={svsDetails}
              />
              <ScoreCard
                title="动态互动评分 (DES)"
                score={mockEnterprise.des_score}
                description="基于企业与银行的互动频率、质量和深度评估的关系活跃度得分"
                details={desDetails}
              />
              <ScoreCard
                title="网络影响力评分 (NIS)"
                score={mockEnterprise.nis_score}
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
                    <GraphVisualization height={300} data={mockGraphData} />
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
                          {mockEnterprise.business_scope}
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
                          PCS评分: {mockEnterprise.pcs_score} (A级)
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
                              {item.type === "financing" ? (
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
                <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-destructive">风险提示</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-destructive/90">
                      检测到该企业存在关联担保风险，与"蓝海科技"之间存在交叉担保情况，请关注相关风险传导可能性。
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
                <GraphVisualization height={520} data={mockGraphData} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Placeholder for other tabs */}
          <TabsContent value="financial" className="space-y-6">
            <EnterpriseDataTable 
              enterpriseName={mockEnterprise.name} 
              financialData={mockFinancialData}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">财务指标趋势</CardTitle>
                  <CardDescription>平均年增长率: 18.5%</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
                    <p className="text-sm text-muted-foreground">财务图表将在下一阶段实现</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">行业对比分析</CardTitle>
                  <CardDescription>在IT行业中排名前15%</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
                    <p className="text-sm text-muted-foreground">行业对比图表将在下一阶段实现</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <RiskAnalysis
              enterpriseName={mockEnterprise.name}
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
                    <p className="text-sm text-muted-foreground">担保链图表将在下一阶段实现</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">风险预警记录</CardTitle>
                  <CardDescription>近30天检测到的12个风险事件</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
                    <p className="text-sm text-muted-foreground">风险预警列表将在下一阶段实现</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="marketing">
            <MarketingRecommendations
              enterpriseName={mockEnterprise.name}
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