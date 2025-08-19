import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import GraphVisualization from "@/components/graph/GraphVisualization";
import EnhancedGraphVisualization from "@/components/graph/EnhancedGraphVisualization";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  Filter,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Save,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiService } from "@/services/api";
import { GraphData, GraphNode } from "@/types/database";

export default function GraphPage() {
  const [graphSize, setGraphSize] = useState<{ width: number; height: number }>({
    width: 1100,
    height: 600,
  });
  
  // 数据状态
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<GraphData | null>(null);
  const [filteredData, setFilteredData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [graphStats, setGraphStats] = useState<any>(null);
  const [useEnhancedView, setUseEnhancedView] = useState(false);
  
  // 筛选状态
  const [searchTerm, setSearchTerm] = useState("");
  const [relationshipType, setRelationshipType] = useState("all");
  const [pathDepth, setPathDepth] = useState("3");
  const [showEnterpriseNodes, setShowEnterpriseNodes] = useState(true);
  const [showPersonNodes, setShowPersonNodes] = useState(true);
  const [showProductNodes, setShowProductNodes] = useState(true);
  const [minimumRelationshipStrength, setMinimumRelationshipStrength] = useState(30);
  
  // 获取图谱数据
  const fetchGraphData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
             const [graphResponse, statsResponse] = await Promise.allSettled([
         ApiService.Graph.getFullGraph(),
         ApiService.Graph.getGraphStats()
       ]);
      
      // 处理图谱数据
      if (graphResponse.status === 'fulfilled' && graphResponse.value.success) {
        setOriginalData(graphResponse.value.data);
        setFilteredData(graphResponse.value.data);
      } else {
        console.error('获取图谱数据失败:', graphResponse);
        setError('获取图谱数据失败');
      }
      
      // 处理统计数据
      if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
        setGraphStats(statsResponse.value.data);
      }
      
    } catch (error) {
      console.error('获取图谱数据失败:', error);
      setError('获取图谱数据失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 搜索节点
  const searchNodes = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      const response = await ApiService.Graph.searchNodes(query, relationshipType === "all" ? undefined : relationshipType);
      
      if (response.success) {
        const searchResults = response.data.nodes || [];
        // 创建基于搜索结果的图谱数据
        const searchGraphData: GraphData = {
          nodes: searchResults,
          links: originalData?.links?.filter(link => 
            searchResults.some(node => node.id === link.source || node.id === link.target)
          ) || []
        };
        setFilteredData(searchGraphData);
      }
    } catch (error) {
      console.error('搜索节点失败:', error);
    }
  };
  
  // 应用筛选器
  const applyFilters = () => {
    if (!originalData) return;
    
    let nodes = [...originalData.nodes];
    
    // 应用节点类型筛选
    const allowedTypes: ("enterprise" | "person" | "product")[] = [];
    if (showEnterpriseNodes) allowedTypes.push("enterprise");
    if (showPersonNodes) allowedTypes.push("person");
    if (showProductNodes) allowedTypes.push("product");
    
    nodes = nodes.filter(node => allowedTypes.includes(node.type));
    
    // 应用搜索词筛选
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      nodes = nodes.filter(node => node.name.toLowerCase().includes(term));
    }
    
    // 获取通过筛选的节点ID
    const nodeIds = new Set(nodes.map(node => node.id));
    
    // 筛选连接
    let links = originalData.links.filter(link => 
      nodeIds.has(link.source as string) && 
      nodeIds.has(link.target as string) &&
      (relationshipType === "all" || link.type === relationshipType) &&
      (link.value !== undefined ? link.value * 100 >= minimumRelationshipStrength : true)
    );
    
    setFilteredData({ nodes, links });
  };
  
  // 重新获取数据
  const handleRefresh = () => {
    fetchGraphData();
  };
  
  // 搜索处理
  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchNodes(searchTerm);
    } else {
      applyFilters();
    }
  };
  
  // 初始化数据加载
  useEffect(() => {
    fetchGraphData();
  }, []);
  
  // 筛选器变化时应用筛选
  useEffect(() => {
    if (originalData && !searchTerm.trim()) {
      applyFilters();
    }
  }, [originalData, relationshipType, pathDepth, showEnterpriseNodes, showPersonNodes, showProductNodes, minimumRelationshipStrength]);
  
  // 加载状态
  if (isLoading) {
    return (
      <MainLayout className="p-0 flex flex-col">
        <div className="border-b border-border p-4 bg-card">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-72 border-r border-border bg-card p-4">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <div className="text-muted-foreground">正在加载图谱数据...</div>
            </div>
          </div>
          <div className="w-80 border-l border-border bg-card p-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // 错误状态
  if (error) {
    return (
      <MainLayout className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="link" className="ml-2" onClick={handleRefresh}>
              重试
            </Button>
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout className="p-0 flex flex-col">
      {/* Top toolbar */}
      <div className="border-b border-border p-4 bg-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 flex items-center gap-2 min-w-[300px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="输入企业或个人名称搜索..."
              className="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="outline" size="sm" onClick={handleSearch}>
              搜索
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="relationship-type" className="text-sm">
                关系类型:
              </Label>
              <Select 
                defaultValue="all" 
                value={relationshipType}
                onValueChange={setRelationshipType}
              >
                <SelectTrigger
                  id="relationship-type"
                  className="w-[160px]"
                >
                  <SelectValue placeholder="选择关系类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部关系</SelectItem>
                  <SelectItem value="investment">投资关系</SelectItem>
                  <SelectItem value="guarantee">担保关系</SelectItem>
                  <SelectItem value="supply">供应链关系</SelectItem>
                  <SelectItem value="risk">风险关系</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="path-depth" className="text-sm">
                路径深度:
              </Label>
              <Select 
                defaultValue="3" 
                value={pathDepth}
                onValueChange={setPathDepth}
              >
                <SelectTrigger id="path-depth" className="w-[80px]">
                  <SelectValue placeholder="深度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1级</SelectItem>
                  <SelectItem value="2">2级</SelectItem>
                  <SelectItem value="3">3级</SelectItem>
                  <SelectItem value="4">4级</SelectItem>
                  <SelectItem value="5">5级</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="icon">
              <Save className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Controls */}
        <div className="w-72 border-r border-border bg-card overflow-y-auto">
          <div className="p-4 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">图谱控制</h3>
              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
              
              {/* 视图切换 */}
              <div className="flex items-center justify-between">
                <Label className="text-xs">视图模式</Label>
                <Button
                  variant={useEnhancedView ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseEnhancedView(!useEnhancedView)}
                  className="h-7 px-3 text-xs"
                >
                  {useEnhancedView ? "增强版" : "标准版"}
                </Button>
              </div>
            </div>

            <Accordion type="single" collapsible defaultValue="filters">
              <AccordionItem value="filters">
                <AccordionTrigger>过滤条件</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">节点类型</Label>
                      <div className="flex flex-col gap-2 pl-1">
                        <div className="flex items-center gap-2">
                          <Switch 
                            id="enterprise" 
                            checked={showEnterpriseNodes} 
                            onCheckedChange={setShowEnterpriseNodes} 
                          />
                          <Label htmlFor="enterprise" className="text-sm">
                            企业节点
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            id="person" 
                            checked={showPersonNodes}
                            onCheckedChange={setShowPersonNodes}
                          />
                          <Label htmlFor="person" className="text-sm">
                            人物节点
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            id="product" 
                            checked={showProductNodes}
                            onCheckedChange={setShowProductNodes}
                          />
                          <Label htmlFor="product" className="text-sm">
                            产品节点
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">关系强度 ({minimumRelationshipStrength}%)</Label>
                      <Slider 
                        value={[minimumRelationshipStrength]} 
                        onValueChange={(values) => setMinimumRelationshipStrength(values[0])} 
                        min={0} 
                        max={100} 
                        step={1} 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>低</span>
                        <span>高</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">显示标签</Label>
                      <div className="flex flex-col gap-2 pl-1">
                        <div className="flex items-center gap-2">
                          <Switch id="node-labels" defaultChecked />
                          <Label htmlFor="node-labels" className="text-sm">
                            节点标签
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="edge-labels" />
                          <Label htmlFor="edge-labels" className="text-sm">
                            关系标签
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="statistics">
                <AccordionTrigger>图谱统计</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    {graphStats ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">企业节点：</span>
                          <span className="font-medium">{graphStats.nodes?.enterprise || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">关系数量：</span>
                          <span className="font-medium">{graphStats.nodes?.relationship || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">当前显示：</span>
                          <span className="font-medium">{filteredData?.nodes.length || 0}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">加载统计数据中...</div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="analysis">
                <AccordionTrigger>分析工具</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      路径分析
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      集群分析
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      中心性分析
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      风险传导分析
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="layouts">
                <AccordionTrigger>布局选项</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="force"
                        name="layout"
                        defaultChecked
                      />
                      <Label htmlFor="force" className="text-sm">
                        力导向布局
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="radial"
                        name="layout"
                      />
                      <Label htmlFor="radial" className="text-sm">
                        辐射布局
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="hierarchical"
                        name="layout"
                      />
                      <Label htmlFor="hierarchical" className="text-sm">
                        层级布局
                      </Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Main graph area */}
        <div className="flex-1 overflow-hidden">
          {filteredData ? (
            useEnhancedView ? (
              <EnhancedGraphVisualization 
                width={graphSize.width} 
                height={graphSize.height} 
                data={filteredData}
                onNodeClick={setSelectedNode}
                className="w-full h-full"
              />
            ) : (
              <GraphVisualization 
                width={graphSize.width} 
                height={graphSize.height} 
                data={filteredData}
                onNodeClick={setSelectedNode}
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <div className="text-muted-foreground">暂无图谱数据</div>
                <Button variant="outline" onClick={handleRefresh}>
                  重新加载
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - Detail panel */}
        <div className="w-80 border-l border-border bg-card overflow-y-auto">
          <Card className="border-0 shadow-none rounded-none">
            <CardHeader>
              <CardTitle className="text-base">实体详情</CardTitle>
              <CardDescription>
                {selectedNode ? "选中节点的详细信息" : "选择图谱中的节点查看详细信息"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <div className="font-medium text-base">{selectedNode.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedNode.type === 'enterprise' ? '企业' : 
                       selectedNode.type === 'person' ? '人物' : '产品'}
                    </div>
                  </div>
                  
                  {selectedNode.industry && (
                    <div>
                      <div className="text-sm font-medium">行业</div>
                      <div className="text-sm text-muted-foreground">{selectedNode.industry}</div>
                    </div>
                  )}
                  
                  {selectedNode.riskLevel && (
                    <div>
                      <div className="text-sm font-medium">风险等级</div>
                      <div className="text-sm text-muted-foreground">{selectedNode.riskLevel}</div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-sm font-medium">节点权重</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedNode.value ? (selectedNode.value * 100).toFixed(1) + '%' : 'N/A'}
                    </div>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    查看完整信息
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    当前未选择任何节点。点击图谱中的节点以查看详细信息。
                  </p>
                  
                  <div className="border border-border rounded-md p-3 bg-muted/30">
                    <h4 className="font-medium text-sm mb-2">操作提示</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• 点击节点: 查看详细信息</li>
                      <li>• 拖拽节点: 调整位置</li>
                      <li>• 滚轮: 缩放图谱</li>
                      <li>• 双击: 将节点设为焦点</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}