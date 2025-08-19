import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink } from '@/types/database';

interface GraphVisualizationProps {
  data?: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  className?: string;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isLoading, setIsLoading] = useState(!data);

  useEffect(() => {
    if (!data || !data.nodes || !data.links) {
      setIsLoading(true);
      return;
    }

    setIsLoading(false);
    const svg = d3.select(svgRef.current);
    
    // 清除之前的内容
    svg.selectAll("*").remove();

    // 创建容器组
    const container = svg.append("g");

    // 设置缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // 数据验证：过滤掉无效的链接（source或target节点不存在）
    const nodeIds = new Set(data.nodes.map(node => node.id));
    const validLinks = data.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
      const isValid = nodeIds.has(sourceId) && nodeIds.has(targetId);
      if (!isValid) {
        console.warn(`Filtering out link with missing nodes: ${sourceId} -> ${targetId}`);
      }
      return isValid;
    });

    // 创建力模拟
    const simulation = d3.forceSimulation<GraphNode>(data.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(validLinks)
        .id((d: any) => d.id)
        .distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // 创建连线
    const link = container.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(validLinks)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: GraphLink) => Math.sqrt(d.value || 1) * 2);

    // 创建节点组
    const nodeGroup = container.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(data.nodes)
      .enter().append("g")
      .attr("class", "node");

         // 添加节点圆圈
     nodeGroup.append("circle")
       .attr("r", (d: GraphNode) => {
         const baseSize = 8;
         const sizeMultiplier = d.value ? Math.sqrt(d.value) * 10 : baseSize;
         return Math.max(baseSize, Math.min(25, sizeMultiplier));
       })
       .attr("fill", (d: GraphNode) => {
         switch (d.type) {
           case 'enterprise': return '#3b82f6';
           case 'person': return '#10b981';
           case 'product': return '#f59e0b';
           default: return '#6b7280';
         }
       })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    // 添加节点标签
    nodeGroup.append("text")
      .attr("dy", ".35em")
      .attr("x", (d: GraphNode) => {
        const radius = d.value ? Math.sqrt(d.value) * 10 + 8 : 16;
        return Math.max(16, Math.min(33, radius));
      })
      .style("font-size", "12px")
      .style("fill", "#333")
      .style("font-family", "Arial, sans-serif")
      .text((d: GraphNode) => d.name || d.id);

    // 添加拖拽行为
    const drag = d3.drag<SVGGElement, GraphNode>()
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
        d.fx = null;
        d.fy = null;
      });

    nodeGroup.call(drag);

    // 添加点击事件
    if (onNodeClick) {
      nodeGroup.on("click", (event, d) => {
        event.stopPropagation();
        onNodeClick(d);
      });
    }

    // 添加悬停效果
    nodeGroup
      .on("mouseover", function(event, d) {
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", (d: GraphNode) => {
            const baseSize = 8;
            const sizeMultiplier = d.value ? Math.sqrt(d.value) * 10 : baseSize;
            return Math.max(baseSize, Math.min(25, sizeMultiplier)) * 1.2;
          });
          
        // 显示tooltip
        d3.select("body").append("div")
          .attr("class", "graph-tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("padding", "8px 12px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
          .html(`
            <div><strong>${d.name || d.id}</strong></div>
            <div>类型: ${d.type}</div>
            ${d.industry ? `<div>行业: ${d.industry}</div>` : ''}
            ${d.value ? `<div>权重: ${d.value.toFixed(2)}</div>` : ''}
          `);
      })
      .on("mouseout", function(event, d) {
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", (d: GraphNode) => {
            const baseSize = 8;
            const sizeMultiplier = d.value ? Math.sqrt(d.value) * 10 : baseSize;
            return Math.max(baseSize, Math.min(25, sizeMultiplier));
          });
          
        // 移除tooltip
        d3.selectAll(".graph-tooltip").remove();
      });

    // 更新位置
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup
        .attr("transform", (d: GraphNode) => `translate(${d.x},${d.y})`);
    });

    // 清理函数
    return () => {
      simulation.stop();
      d3.selectAll(".graph-tooltip").remove();
    };
  }, [data, width, height, onNodeClick]);

  if (isLoading || !data) {
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
    <div className={`relative border rounded-lg overflow-hidden ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ background: '#f8fafc' }}
      />
      
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
      
      {/* 控制面板 */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm z-10">
        <div className="flex gap-2">
          <button 
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              const svg = d3.select(svgRef.current);
              svg.transition().duration(750).call(
                d3.zoom<SVGSVGElement, unknown>().transform,
                d3.zoomIdentity
              );
            }}
          >
            重置视图
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualization;