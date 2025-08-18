import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import GraphVisualization from "@/components/graph/GraphVisualization";
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
} from "lucide-react";

// Mock graph data
const mockLargeGraphData = {
  nodes: [
    // Enterprise nodes
    { id: "e1", name: "星达科技有限公司", type: "enterprise" as "enterprise", value: 1.0, industry: "IT" },
    { id: "e2", name: "蓝海科技", type: "enterprise" as "enterprise", value: 0.8, industry: "IT" },
    { id: "e3", name: "金辉集团", type: "enterprise" as "enterprise", value: 0.9, industry: "投资" },
    { id: "e4", name: "云尚数据", type: "enterprise" as "enterprise", value: 0.7, industry: "IT" },
    { id: "e5", name: "宏远投资", type: "enterprise" as "enterprise", value: 0.6, industry: "投资" },
    { id: "e6", name: "工商银行", type: "enterprise" as "enterprise", value: 0.9, industry: "金融" },
    { id: "e7", name: "恒宝科技", type: "enterprise" as "enterprise", value: 0.7, industry: "IT" },
    { id: "e8", name: "长城汽车", type: "enterprise" as "enterprise", value: 0.8, industry: "制造" },
    { id: "e9", name: "华强半导体", type: "enterprise" as "enterprise", value: 0.9, industry: "制造" },
    { id: "e10", name: "远大集团", type: "enterprise" as "enterprise", value: 0.7, industry: "地产" },
    
    // Person nodes
    { id: "p1", name: "王总", type: "person" as "person", value: 0.8 },
    { id: "p2", name: "李董", type: "person" as "person", value: 0.7 },
    { id: "p3", name: "张经理", type: "person" as "person", value: 0.5 },
    { id: "p4", name: "陈博士", type: "person" as "person", value: 0.6 },
    { id: "p5", name: "刘总", type: "person" as "person", value: 0.7 },
    
    // Product nodes
    { id: "pr1", name: "科技贷", type: "product" as "product", value: 0.6 },
    { id: "pr2", name: "综合授信", type: "product" as "product", value: 0.7 },
    { id: "pr3", name: "企业债", type: "product" as "product", value: 0.5 },
    { id: "pr4", name: "物流金融", type: "product" as "product", value: 0.6 },
  ],
  links: [
    // Supply chain relationships
    { source: "e1", target: "e2", type: "supply" as "supply", value: 0.9 },
    { source: "e2", target: "e4", type: "supply" as "supply", value: 0.5 },
    { source: "e7", target: "e9", type: "supply" as "supply", value: 0.7 },
    { source: "e8", target: "e9", type: "supply" as "supply", value: 0.8 },
    { source: "e9", target: "e1", type: "supply" as "supply", value: 0.6 },
    
    // Investment relationships
    { source: "p1", target: "e1", type: "investment" as "investment", value: 0.8 },
    { source: "p2", target: "e2", type: "investment" as "investment", value: 0.7 },
    { source: "e3", target: "e1", type: "investment" as "investment", value: 0.8 },
    { source: "p3", target: "e4", type: "investment" as "investment", value: 0.6 },
    { source: "e5", target: "e7", type: "investment" as "investment", value: 0.7 },
    { source: "p4", target: "e9", type: "investment" as "investment", value: 0.8 },
    { source: "p5", target: "e10", type: "investment" as "investment", value: 0.9 },
    { source: "e10", target: "e8", type: "investment" as "investment", value: 0.6 },
    
    // Guarantee relationships
    { source: "e5", target: "e1", type: "guarantee" as "guarantee", value: 0.7 },
    { source: "e1", target: "e7", type: "guarantee" as "guarantee", value: 0.5 },
    { source: "e10", target: "e3", type: "guarantee" as "guarantee", value: 0.6 },
    
    // Risk relationships
    { source: "e2", target: "e1", type: "risk" as "risk", value: 0.4 },
    { source: "e9", target: "e7", type: "risk" as "risk", value: 0.3 },
    
    // Other relationships
    { source: "e3", target: "p2", type: "other" as "other", value: 0.3 },
    { source: "p1", target: "p5", type: "other" as "other", value: 0.4 },
    
    // Product relationships
    { source: "e1", target: "pr1", type: "other" as "other", value: 0.6 },
    { source: "e6", target: "pr1", type: "other" as "other", value: 0.8 },
    { source: "e6", target: "pr2", type: "other" as "other", value: 0.7 },
    { source: "e6", target: "pr3", type: "other" as "other", value: 0.6 },
    { source: "e6", target: "pr4", type: "other" as "other", value: 0.5 },
    { source: "e3", target: "pr2", type: "other" as "other", value: 0.4 },
    { source: "e5", target: "pr3", type: "other" as "other", value: 0.3 },
    { source: "e8", target: "pr4", type: "other" as "other", value: 0.5 },
  ]
};

export default function GraphPage() {
  const [graphSize, setGraphSize] = useState<{ width: number; height: number }>({
    width: 1100,
    height: 600,
  });
  
  // Data state
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter state
  const [filteredData, setFilteredData] = useState(mockLargeGraphData);
  const [searchTerm, setSearchTerm] = useState("");
  const [relationshipType, setRelationshipType] = useState("all");
  const [pathDepth, setPathDepth] = useState("3");
  const [showEnterpriseNodes, setShowEnterpriseNodes] = useState(true);
  const [showPersonNodes, setShowPersonNodes] = useState(true);
  const [showProductNodes, setShowProductNodes] = useState(true);
  const [minimumRelationshipStrength, setMinimumRelationshipStrength] = useState(30);
  
  // Apply filters when any filter value changes
  useEffect(() => {
    // Start with the original data
    let nodes = [...mockLargeGraphData.nodes];
    
    // Apply node type filters
    const allowedTypes: ("enterprise" | "person" | "product")[] = [];
    if (showEnterpriseNodes) allowedTypes.push("enterprise" as "enterprise");
    if (showPersonNodes) allowedTypes.push("person" as "person");
    if (showProductNodes) allowedTypes.push("product" as "product");
    
    nodes = nodes.filter(node => allowedTypes.includes(node.type));
    
    // Apply search term filter if any
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      nodes = nodes.filter(node => node.name.toLowerCase().includes(term));
    }
    
    // Get the node IDs that passed the filters
    const nodeIds = new Set(nodes.map(node => node.id));
    
    // Filter links based on node presence and relationship type
    let links = mockLargeGraphData.links.filter(link => 
      nodeIds.has(link.source as string) && 
      nodeIds.has(link.target as string) &&
      (relationshipType === "all" || link.type === relationshipType) &&
      (link.value !== undefined ? link.value * 100 >= minimumRelationshipStrength : true)
    );
    
    // Set the filtered data
    setFilteredData({ nodes, links });
    
  }, [searchTerm, relationshipType, pathDepth, showEnterpriseNodes, showPersonNodes, showProductNodes, minimumRelationshipStrength]);

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
            />
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

            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
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
              <div className="flex items-center gap-2">
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
                            defaultChecked 
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
                            defaultChecked 
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
                            defaultChecked 
                          />
                          <Label htmlFor="product" className="text-sm">
                            产品节点
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">关系强度</Label>
                      <Slider 
                        defaultValue={[30]} 
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
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <div className="text-muted-foreground">正在加载图谱数据...</div>
              </div>
            </div>
          ) : (
            <GraphVisualization width={graphSize.width} height={graphSize.height} data={filteredData} />
          )}
        </div>

        {/* Right sidebar - Detail panel */}
        <div className="w-80 border-l border-border bg-card overflow-y-auto">
          <Card className="border-0 shadow-none rounded-none">
            <CardHeader>
              <CardTitle className="text-base">实体详情</CardTitle>
              <CardDescription>
                选择图谱中的节点查看详细信息
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}