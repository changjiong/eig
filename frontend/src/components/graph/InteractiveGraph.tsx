import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Filter, 
  Eye,
  EyeOff,
  Search,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 图数据接口
export interface GraphNode {
  id: string;
  name: string;
  type: 'enterprise' | 'person' | 'product';
  category?: string;
  value?: number;
  risk_level?: 'low' | 'medium' | 'high';
  properties?: Record<string, any>;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  strength: number;
  properties?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface InteractiveGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
  className?: string;
  onNodeClick?: (node: GraphNode) => void;
  onLinkClick?: (link: GraphLink) => void;
  onSelectionChange?: (selectedNodes: GraphNode[], selectedLinks: GraphLink[]) => void;
  enableFiltering?: boolean;
  enableClustering?: boolean;
  showLegend?: boolean;
}

// 图形配置
const GRAPH_CONFIG = {
  simulation: {
    force: 300,
    distance: 100,
    charge: -1000,
    alpha: 0.3,
    alphaDecay: 0.02
  },
  node: {
    radius: {
      min: 5,
      max: 25,
      default: 10
    },
    colors: {
      enterprise: '#3B82F6',
      person: '#EF4444',
      product: '#10B981'
    },
    stroke: {
      width: 2,
      selected: '#FFD700',
      hover: '#FF6B6B'
    }
  },
  link: {
    width: {
      min: 1,
      max: 8,
      default: 2
    },
    colors: {
      investment: '#3B82F6',
      guarantee: '#EF4444',
      supply: '#10B981',
      risk: '#F59E0B',
      employment: '#8B5CF6',
      partnership: '#06B6D4',
      ownership: '#84CC16',
      other: '#6B7280'
    },
    opacity: {
      default: 0.6,
      hover: 1.0,
      selected: 1.0
    }
  }
};

export const InteractiveGraph: React.FC<InteractiveGraphProps> = ({
  data,
  width = 800,
  height = 600,
  className,
  onNodeClick,
  onLinkClick,
  onSelectionChange,
  enableFiltering = true,
  enableClustering = true,
  showLegend = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNodes, setSelectedNodes] = useState<GraphNode[]>([]);
  const [selectedLinks, setSelectedLinks] = useState<GraphLink[]>([]);
  const [filteredNodeTypes, setFilteredNodeTypes] = useState<string[]>([]);
  const [filteredLinkTypes, setFilteredLinkTypes] = useState<string[]>([]);
  const [forceStrength, setForceStrength] = useState([GRAPH_CONFIG.simulation.force]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // D3 simulation ref
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  // 初始化和更新图
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // 创建缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // 主图形组
    const g = svg.append('g');

    // 创建箭头标记
    const defs = svg.append('defs');
    Object.keys(GRAPH_CONFIG.link.colors).forEach(type => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', GRAPH_CONFIG.link.colors[type as keyof typeof GRAPH_CONFIG.link.colors]);
    });

    // 过滤数据
    const filteredNodes = data.nodes.filter(node => 
      !filteredNodeTypes.includes(node.type) &&
      (searchTerm === '' || node.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const filteredLinks = data.links.filter(link => 
      !filteredLinkTypes.includes(link.type) &&
      filteredNodes.some(n => n.id === link.source) &&
      filteredNodes.some(n => n.id === link.target)
    );

    // 创建力模拟
    const simulation = d3.forceSimulation<GraphNode>(filteredNodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(filteredLinks)
        .id(d => d.id)
        .distance(GRAPH_CONFIG.simulation.distance)
        .strength(link => link.strength))
      .force('charge', d3.forceManyBody().strength(forceStrength[0]))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 2));

    simulationRef.current = simulation;

    // 创建链接
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredLinks)
      .enter().append('line')
      .attr('stroke', d => GRAPH_CONFIG.link.colors[d.type as keyof typeof GRAPH_CONFIG.link.colors] || GRAPH_CONFIG.link.colors.other)
      .attr('stroke-width', d => Math.max(GRAPH_CONFIG.link.width.min, 
        Math.min(GRAPH_CONFIG.link.width.max, d.strength * GRAPH_CONFIG.link.width.default)))
      .attr('stroke-opacity', GRAPH_CONFIG.link.opacity.default)
      .attr('marker-end', d => `url(#arrow-${d.type})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onLinkClick?.(d);
        handleLinkSelection(d);
      })
      .on('mouseover', function() {
        d3.select(this).attr('stroke-opacity', GRAPH_CONFIG.link.opacity.hover);
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke-opacity', GRAPH_CONFIG.link.opacity.default);
      });

    // 创建节点
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(filteredNodes)
      .enter().append('circle')
      .attr('r', getNodeRadius)
      .attr('fill', d => GRAPH_CONFIG.node.colors[d.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', GRAPH_CONFIG.node.stroke.width)
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d);
        handleNodeSelection(d);
      })
      .on('mouseover', function(event, d) {
        d3.select(this).attr('stroke', GRAPH_CONFIG.node.stroke.hover);
        showTooltip(event, d);
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke', '#fff');
        hideTooltip();
      });

    // 创建节点标签
    const label = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(filteredNodes)
      .enter().append('text')
      .text(d => d.name)
      .attr('font-size', '12px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('pointer-events', 'none')
      .style('user-select', 'none');

    // 更新位置
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      label
        .attr('x', d => d.x!)
        .attr('y', d => d.y! + getNodeRadius(d) + 15);
    });

    // 拖拽处理函数
    function dragstarted(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // 清空选择
    svg.on('click', () => {
      setSelectedNodes([]);
      setSelectedLinks([]);
    });

    return () => {
      simulation.stop();
    };
  }, [data, filteredNodeTypes, filteredLinkTypes, forceStrength, searchTerm, width, height]);

  // 获取节点半径
  const getNodeRadius = useCallback((node: GraphNode) => {
    const baseRadius = GRAPH_CONFIG.node.radius.default;
    const valueMultiplier = node.value ? Math.sqrt(node.value / 100) : 1;
    return Math.max(
      GRAPH_CONFIG.node.radius.min,
      Math.min(GRAPH_CONFIG.node.radius.max, baseRadius * valueMultiplier)
    );
  }, []);

  // 处理节点选择
  const handleNodeSelection = (node: GraphNode) => {
    const newSelection = selectedNodes.includes(node)
      ? selectedNodes.filter(n => n.id !== node.id)
      : [...selectedNodes, node];
    
    setSelectedNodes(newSelection);
    onSelectionChange?.(newSelection, selectedLinks);
  };

  // 处理链接选择
  const handleLinkSelection = (link: GraphLink) => {
    const newSelection = selectedLinks.includes(link)
      ? selectedLinks.filter(l => l !== link)
      : [...selectedLinks, link];
    
    setSelectedLinks(newSelection);
    onSelectionChange?.(selectedNodes, newSelection);
  };

  // 工具提示
  const showTooltip = (event: MouseEvent, node: GraphNode) => {
    // 实现工具提示显示逻辑
  };

  const hideTooltip = () => {
    // 实现工具提示隐藏逻辑
  };

  // 重置视图
  const resetView = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition()
        .duration(750)
        .call(
          d3.zoom<SVGSVGElement, unknown>().transform,
          d3.zoomIdentity
        );
    }
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
    }
  };

  // 缩放控制
  const zoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        1.5
      );
    }
  };

  const zoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        1 / 1.5
      );
    }
  };

  // 导出图像
  const exportSVG = () => {
    if (svgRef.current) {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = 'graph.svg';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    }
  };

  // 获取唯一的节点类型和链接类型
  const nodeTypes = Array.from(new Set(data.nodes.map(n => n.type)));
  const linkTypes = Array.from(new Set(data.links.map(l => l.type)));

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>关系图谱</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportSVG}>
              <Download className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {enableFiltering && (
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="搜索节点..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              />
            </div>

            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="节点类型" />
              </SelectTrigger>
              <SelectContent>
                {nodeTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: GRAPH_CONFIG.node.colors[type as keyof typeof GRAPH_CONFIG.node.colors] }}
                      />
                      <span>{type}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">力度:</span>
              <Slider
                value={forceStrength}
                onValueChange={setForceStrength}
                max={1000}
                min={100}
                step={50}
                className="w-24"
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex">
          <div className="flex-1">
            <svg
              ref={svgRef}
              width={width}
              height={height}
              className="border rounded-md bg-white"
              style={{ 
                width: isFullscreen ? '100vw' : width,
                height: isFullscreen ? '100vh' : height,
                position: isFullscreen ? 'fixed' : 'relative',
                top: isFullscreen ? 0 : 'auto',
                left: isFullscreen ? 0 : 'auto',
                zIndex: isFullscreen ? 50 : 'auto'
              }}
            />
          </div>

          {showLegend && (
            <div className="ml-4 w-48 space-y-4">
              <div>
                <h4 className="font-medium mb-2">节点类型</h4>
                {nodeTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: GRAPH_CONFIG.node.colors[type as keyof typeof GRAPH_CONFIG.node.colors] }}
                    />
                    <span className="text-sm">{type}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto p-0 h-auto"
                      onClick={() => {
                        setFilteredNodeTypes(prev => 
                          prev.includes(type) 
                            ? prev.filter(t => t !== type)
                            : [...prev, type]
                        );
                      }}
                    >
                      {filteredNodeTypes.includes(type) ? 
                        <EyeOff className="w-3 h-3" /> : 
                        <Eye className="w-3 h-3" />
                      }
                    </Button>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-medium mb-2">关系类型</h4>
                {linkTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2 mb-1">
                    <div 
                      className="w-4 h-0.5" 
                      style={{ backgroundColor: GRAPH_CONFIG.link.colors[type as keyof typeof GRAPH_CONFIG.link.colors] || GRAPH_CONFIG.link.colors.other }}
                    />
                    <span className="text-sm">{type}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto p-0 h-auto"
                      onClick={() => {
                        setFilteredLinkTypes(prev => 
                          prev.includes(type) 
                            ? prev.filter(t => t !== type)
                            : [...prev, type]
                        );
                      }}
                    >
                      {filteredLinkTypes.includes(type) ? 
                        <EyeOff className="w-3 h-3" /> : 
                        <Eye className="w-3 h-3" />
                      }
                    </Button>
                  </div>
                ))}
              </div>

              {selectedNodes.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">选中节点</h4>
                  {selectedNodes.map(node => (
                    <Badge key={node.id} variant="secondary" className="mr-1 mb-1">
                      {node.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveGraph;