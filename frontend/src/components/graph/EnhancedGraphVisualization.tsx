import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter,
  Layout,
  Play,
  Pause,
  Settings
} from 'lucide-react';

interface EnhancedGraphVisualizationProps {
  data?: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  className?: string;
}

type LayoutType = 'force' | 'hierarchical' | 'circular' | 'grid';
type ColorScheme = 'type' | 'centrality' | 'cluster' | 'risk';

interface FilterState {
  nodeTypes: Set<string>;
  linkTypes: Set<string>;
  minLinkStrength: number;
  maxLinkStrength: number;
  searchQuery: string;
  showLabels: boolean;
}

interface LayoutSettings {
  type: LayoutType;
  linkDistance: number;
  chargeStrength: number;
  velocityDecay: number;
  alphaDecay: number;
}

const EnhancedGraphVisualization: React.FC<EnhancedGraphVisualizationProps> = ({
  data,
  width = 1000,
  height = 700,
  onNodeClick,
  onNodeHover,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [isLoading, setIsLoading] = useState(!data);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [showControls, setShowControls] = useState(true);

  // 过滤状态
  const [filters, setFilters] = useState<FilterState>({
    nodeTypes: new Set(['enterprise', 'person', 'product']),
    linkTypes: new Set(['investment', 'supply', 'partnership', 'guarantee', 'other']),
    minLinkStrength: 0,
    maxLinkStrength: 1,
    searchQuery: '',
    showLabels: true
  });

  // 布局设置
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>({
    type: 'force',
    linkDistance: 100,
    chargeStrength: -300,
    velocityDecay: 0.4,
    alphaDecay: 0.01
  });

  // 颜色方案
  const [colorScheme, setColorScheme] = useState<ColorScheme>('type');

  // 过滤数据
  const filteredData = useCallback(() => {
    if (!data) return { nodes: [], links: [] };

    const filteredNodes = data.nodes.filter(node => {
      // 类型过滤
      if (!filters.nodeTypes.has(node.type || 'other')) return false;
      
      // 搜索过滤
      if (filters.searchQuery && !node.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = data.links.filter(link => {
      // 节点存在性验证
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
      
      if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) return false;
      
      // 链接类型过滤
      if (!filters.linkTypes.has(link.type || 'other')) return false;
      
      // 链接强度过滤
      const strength = typeof link.value === 'number' ? link.value : 0.5;
      if (strength < filters.minLinkStrength || strength > filters.maxLinkStrength) return false;
      
      return true;
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [data, filters]);

  // 颜色映射
  const getNodeColor = useCallback((node: GraphNode): string => {
    switch (colorScheme) {
      case 'type':
        const typeColors: Record<string, string> = {
          'enterprise': '#3b82f6',
          'person': '#10b981',
          'product': '#f59e0b',
          'other': '#6b7280'
        };
        return typeColors[node.type || 'other'] || '#6b7280';
      
      case 'centrality':
        // 基于度中心性的颜色渐变
        const degree = node.metadata?.degree || 1;
        const maxDegree = Math.max(...(data?.nodes.map(n => n.metadata?.degree || 1) || [1]));
        const intensity = Math.min(degree / maxDegree, 1);
        return d3.interpolateReds(0.3 + intensity * 0.7);
      
      case 'cluster':
        // 基于聚类的颜色
        const clusterId = node.metadata?.cluster || 0;
        return d3.schemeCategory10[clusterId % 10];
      
      case 'risk':
        // 基于风险等级的颜色
        const riskColors: Record<string, string> = {
          'low': '#10b981',
          'medium': '#f59e0b',
          'high': '#ef4444',
          'critical': '#991b1b'
        };
        return riskColors[node.riskLevel || 'low'] || '#10b981';
      
      default:
        return '#3b82f6';
    }
  }, [colorScheme, data]);

  // 获取链接颜色
  const getLinkColor = useCallback((link: GraphLink): string => {
    const typeColors: Record<string, string> = {
      'investment': '#ef4444',
      'supply': '#3b82f6',
      'partnership': '#10b981',
      'guarantee': '#f59e0b',
      'employment': '#8b5cf6',
      'ownership': '#ec4899',
      'other': '#6b7280'
    };
    return typeColors[link.type || 'other'] || '#6b7280';
  }, []);

  // 创建不同布局的力模拟
  const createSimulation = useCallback((filteredNodes: GraphNode[], filteredLinks: GraphLink[]) => {
    const simulation = d3.forceSimulation<GraphNode>(filteredNodes);

    switch (layoutSettings.type) {
      case 'force':
        simulation
          .force("link", d3.forceLink<GraphNode, GraphLink>(filteredLinks)
            .id((d: any) => d.id)
            .distance(layoutSettings.linkDistance)
            .strength(0.1))
          .force("charge", d3.forceManyBody().strength(layoutSettings.chargeStrength))
          .force("center", d3.forceCenter(width / 2, height / 2))
          .force("collision", d3.forceCollide().radius(25));
        break;

      case 'hierarchical':
        // 层级布局
        simulation
          .force("link", d3.forceLink<GraphNode, GraphLink>(filteredLinks)
            .id((d: any) => d.id)
            .distance(layoutSettings.linkDistance))
          .force("charge", d3.forceManyBody().strength(-100))
          .force("y", d3.forceY().strength(0.3))
          .force("x", d3.forceX().strength(0.1));
        break;

      case 'circular':
        // 环形布局
        const radius = Math.min(width, height) / 3;
        filteredNodes.forEach((node, i) => {
          const angle = (2 * Math.PI * i) / filteredNodes.length;
          node.fx = width / 2 + radius * Math.cos(angle);
          node.fy = height / 2 + radius * Math.sin(angle);
        });
        simulation
          .force("link", d3.forceLink<GraphNode, GraphLink>(filteredLinks)
            .id((d: any) => d.id)
            .distance(50)
            .strength(0.1));
        break;

      case 'grid':
        // 网格布局
        const cols = Math.ceil(Math.sqrt(filteredNodes.length));
        const cellWidth = width / cols;
        const cellHeight = height / Math.ceil(filteredNodes.length / cols);
        
        filteredNodes.forEach((node, i) => {
          node.fx = (i % cols) * cellWidth + cellWidth / 2;
          node.fy = Math.floor(i / cols) * cellHeight + cellHeight / 2;
        });
        simulation.force("link", d3.forceLink<GraphNode, GraphLink>(filteredLinks)
          .id((d: any) => d.id)
          .distance(50)
          .strength(0.1));
        break;
    }

    simulation
      .velocityDecay(layoutSettings.velocityDecay)
      .alphaDecay(layoutSettings.alphaDecay);

    return simulation;
  }, [layoutSettings, width, height]);

  // 主要的图谱渲染函数
  useEffect(() => {
    const { nodes: filteredNodes, links: filteredLinks } = filteredData();
    
    if (!filteredNodes.length) {
      setIsLoading(true);
      return;
    }

    setIsLoading(false);
    const svg = d3.select(svgRef.current);
    
    // 清除之前的内容
    svg.selectAll("*").remove();

    // 创建容器组
    const container = svg.append("g").attr("class", "graph-container");

    // 设置缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // 创建箭头标记
    const defs = svg.append("defs");
    defs.selectAll("marker")
      .data(['arrow'])
      .join("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    // 创建连线组
    const linkGroup = container.append("g").attr("class", "links");
    
    // 创建节点组
    const nodeGroup = container.append("g").attr("class", "nodes");

    // 创建标签组
    const labelGroup = container.append("g").attr("class", "labels");

    // 绘制连线
    const link = linkGroup
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("stroke", d => getLinkColor(d))
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt((d.value || 0.5) * 4))
      .attr("marker-end", "url(#arrow)");

    // 绘制节点
    const node = nodeGroup
      .selectAll("circle")
      .data(filteredNodes)
      .join("circle")
      .attr("r", d => {
        const baseSize = 8;
        const degree = d.metadata?.degree || 1;
        return baseSize + Math.sqrt(degree) * 3;
      })
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    // 绘制标签（如果启用）
    const label = labelGroup
      .selectAll("text")
      .data(filters.showLabels ? filteredNodes : [])
      .join("text")
      .text(d => d.name)
      .attr("font-size", "10px")
      .attr("dx", 12)
      .attr("dy", 4)
      .attr("fill", "#333")
      .style("pointer-events", "none");

    // 创建力模拟
    const simulation = createSimulation(filteredNodes, filteredLinks);
    simulationRef.current = simulation;

    // 添加交互事件
    node
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        onNodeClick?.(d);
        
        // 高亮连接的节点和边
        const connectedNodes = new Set<string>();
        filteredLinks.forEach(link => {
          const sourceId = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id;
          const targetId = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id;
          
          if (sourceId === d.id) connectedNodes.add(targetId);
          if (targetId === d.id) connectedNodes.add(sourceId);
        });

        // 更新节点样式
        node
          .attr("opacity", n => n.id === d.id || connectedNodes.has(n.id) ? 1 : 0.3)
          .attr("stroke-width", n => n.id === d.id ? 4 : 2);

        // 更新连线样式
        link
          .attr("opacity", l => {
            const sourceId = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
            const targetId = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
            return sourceId === d.id || targetId === d.id ? 0.8 : 0.1;
          });
      })
      .on("mouseover", (event, d) => {
        setHoveredNode(d);
        onNodeHover?.(d);
        
        // 显示工具提示
        const tooltip = d3.select("body")
          .selectAll(".graph-tooltip")
          .data([d])
          .join("div")
          .attr("class", "graph-tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.8)")
          .style("color", "white")
          .style("padding", "8px 12px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("z-index", "1000");

        tooltip.html(`
          <div><strong>${d.name}</strong></div>
          <div>类型: ${d.type || 'N/A'}</div>
          <div>连接数: ${d.metadata?.degree || 0}</div>
          ${d.riskLevel ? `<div>风险: ${d.riskLevel}</div>` : ''}
        `);

        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
          .style("opacity", 1);
      })
      .on("mousemove", (event) => {
        d3.select(".graph-tooltip")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", () => {
        setHoveredNode(null);
        onNodeHover?.(null);
        d3.select(".graph-tooltip").remove();
      });

    // 添加拖拽行为
    const drag = d3.drag<SVGCircleElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        // 双击释放固定
        if (event.sourceEvent.detail === 2) {
          d.fx = null;
          d.fy = null;
        }
      });

    node.call(drag as any);

    // 模拟更新
    simulation.on("tick", () => {
      setIsSimulationRunning(simulation.alpha() > simulation.alphaMin());

      link
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);

      label
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);
    });

    // 点击空白处清除选择
    svg.on("click", () => {
      setSelectedNode(null);
      node.attr("opacity", 1).attr("stroke-width", 2);
      link.attr("opacity", 0.6);
    });

    // 清理函数
    return () => {
      simulation.stop();
      d3.selectAll(".graph-tooltip").remove();
    };

  }, [filteredData, layoutSettings, colorScheme, filters.showLabels, getNodeColor, getLinkColor, createSimulation, onNodeClick, onNodeHover]);

  // 控制面板操作
  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.5);
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.67);
  };

  const handleResetZoom = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
  };

  const handlePlayPause = () => {
    if (simulationRef.current) {
      if (isSimulationRunning) {
        simulationRef.current.stop();
      } else {
        simulationRef.current.alpha(0.3).restart();
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">加载图谱数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* 主要图谱区域 */}
      <div className="relative border rounded-lg overflow-hidden">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ background: '#fafafa' }}
          className="cursor-grab active:cursor-grabbing"
        />

        {/* 工具栏 */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            className="bg-white/90"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            className="bg-white/90"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetZoom}
            className="bg-white/90"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePlayPause}
            className="bg-white/90"
          >
            {isSimulationRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowControls(!showControls)}
            className="bg-white/90"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* 图例 */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm z-10">
          <h4 className="font-medium text-sm mb-2">节点图例</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>企业</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span>人员</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>产品</span>
            </div>
          </div>
        </div>

        {/* 状态指示器 */}
        {isSimulationRunning && (
          <div className="absolute bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
            模拟运行中...
          </div>
        )}
      </div>

      {/* 控制面板 */}
      {showControls && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              图谱控制面板
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 搜索和过滤 */}
            <div>
              <Label className="text-sm font-medium">搜索和过滤</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索节点..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showLabels"
                    checked={filters.showLabels}
                    onChange={(e) => setFilters({...filters, showLabels: e.target.checked})}
                  />
                  <Label htmlFor="showLabels">显示标签</Label>
                </div>
              </div>
            </div>

            {/* 布局设置 */}
            <div>
              <Label className="text-sm font-medium">布局算法</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Select 
                  value={layoutSettings.type} 
                  onValueChange={(value) => setLayoutSettings({...layoutSettings, type: value as LayoutType})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="force">力导向布局</SelectItem>
                    <SelectItem value="hierarchical">层级布局</SelectItem>
                    <SelectItem value="circular">环形布局</SelectItem>
                    <SelectItem value="grid">网格布局</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={colorScheme} 
                  onValueChange={(value) => setColorScheme(value as ColorScheme)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="type">按类型着色</SelectItem>
                    <SelectItem value="centrality">按中心性着色</SelectItem>
                    <SelectItem value="cluster">按聚类着色</SelectItem>
                    <SelectItem value="risk">按风险着色</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 力导向参数调整 */}
            {layoutSettings.type === 'force' && (
              <div>
                <Label className="text-sm font-medium">力导向参数</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label className="text-xs">连线距离: {layoutSettings.linkDistance}</Label>
                    <Slider
                      value={[layoutSettings.linkDistance]}
                      onValueChange={(value) => setLayoutSettings({...layoutSettings, linkDistance: value[0]})}
                      max={200}
                      min={20}
                      step={10}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">排斥力强度: {Math.abs(layoutSettings.chargeStrength)}</Label>
                    <Slider
                      value={[Math.abs(layoutSettings.chargeStrength)]}
                      onValueChange={(value) => setLayoutSettings({...layoutSettings, chargeStrength: -value[0]})}
                      max={1000}
                      min={50}
                      step={50}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 选中节点信息 */}
            {selectedNode && (
              <div>
                <Label className="text-sm font-medium">选中节点</Label>
                <Card className="mt-2">
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{selectedNode.name}</span>
                        <Badge variant="outline">{selectedNode.type}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        连接数: {selectedNode.metadata?.degree || 0}
                      </div>
                      {selectedNode.riskLevel && (
                        <div className="text-sm">
                          风险等级: <Badge variant={selectedNode.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                            {selectedNode.riskLevel}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedGraphVisualization; 