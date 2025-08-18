import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { SimulationNodeDatum } from "d3";
import { cn } from "@/lib/utils";

interface Node extends SimulationNodeDatum {
  id: string;
  name: string;
  type: "enterprise" | "person" | "product";
  value?: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
  type: "investment" | "guarantee" | "supply" | "risk" | "other";
  value?: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface GraphVisualizationProps {
  data: GraphData;
  width?: number;
  height?: number;
  className?: string;
}

// Mock data for development purposes
const mockData: GraphData = {
  nodes: [
    { id: "1", name: "XYZ科技有限公司", type: "enterprise" },
    { id: "2", name: "ABC控股集团", type: "enterprise" },
    { id: "3", name: "张三", type: "person" },
    { id: "4", name: "李四", type: "person" },
    { id: "5", name: "王五", type: "person" },
    { id: "6", name: "123投资公司", type: "enterprise" },
    { id: "7", name: "企业贷款产品", type: "product" },
  ],
  links: [
    { source: "3", target: "1", type: "investment", value: 0.8 },
    { source: "4", target: "2", type: "investment", value: 0.5 },
    { source: "1", target: "2", type: "supply", value: 0.7 },
    { source: "5", target: "4", type: "other", value: 0.3 },
    { source: "6", target: "1", type: "investment", value: 0.9 },
    { source: "2", target: "7", type: "other", value: 0.4 },
    { source: "1", target: "7", type: "guarantee", value: 0.6 },
  ],
};

export default function GraphVisualization({
  data = mockData,
  width = 800,
  height = 600,
  className,
}: GraphVisualizationProps) {
  // For hover state and selected node
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create the simulation
    const simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3
          .forceLink()
          .id((d: any) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1));

    // Prepare the data
    const nodeMap = new Map(data.nodes.map((node) => [node.id, node]));
    const links = data.links.map((link) => ({
      source: link.source,
      target: link.target,
      type: link.type,
      value: link.value,
    }));

    const nodes = data.nodes.map((node) => ({ ...node }));

    // Create the link lines
    const link = svg
      .append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d) => (d.value ? d.value * 3 + 1 : 2))
      .attr("stroke", (d) => {
        switch (d.type) {
          case "investment":
            return "hsl(var(--rel-investment))";
          case "guarantee":
            return "hsl(var(--rel-guarantee))";
          case "supply":
            return "hsl(var(--rel-supply))";
          case "risk":
            return "hsl(var(--rel-risk))";
          default:
            return "hsl(var(--muted-foreground))";
        }
      })
      .attr("stroke-dasharray", (d) => {
        switch (d.type) {
          case "investment":
            return "";
          case "guarantee":
            return "5,5";
          case "supply":
            return "";
          case "risk":
            return "2,2";
          default:
            return "";
        }
      });

    // Create the node groups
    const node = svg
      .append("g")
      .selectAll(".node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .attr("cursor", "pointer")
      .attr("data-id", d => d.id)
      .call(
        d3
          .drag<SVGGElement, Node>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )
      .on("mouseover", (event, d) => {
        setHoveredNode(d.id);
        // Show tooltip
        setTooltip({
          content: `${d.name} (${d.type})`,
          x: event.pageX,
          y: event.pageY
        });
      })
      .on("mouseout", () => {
        setHoveredNode(null);
        setTooltip(null);
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d.id === selectedNode ? null : d.id);
      });

    // Add the node shapes based on type
    node.each(function (d) {
      const g = d3.select(this);
      const nodeSize = d.value ? 10 + d.value * 5 : 10; // Size based on value if available
      
      if (d.type === "enterprise") {
        g.append("circle")
          .attr("r", nodeSize)
          .attr("fill", "hsl(var(--node-enterprise))")
          .attr("fill-opacity", 0.8)
          .attr("stroke", "white")
          .attr("stroke-width", 1.5)
          .classed("node-shape", true);
      } else if (d.type === "person") {
        const rectSize = nodeSize * 1.6;
        g.append("rect")
          .attr("x", -rectSize/2)
          .attr("y", -rectSize/2)
          .attr("width", rectSize)
          .attr("height", rectSize)
          .attr("fill", "hsl(var(--node-person))")
          .attr("fill-opacity", 0.8)
          .attr("stroke", "white")
          .attr("stroke-width", 1.5)
          .classed("node-shape", true);
      } else if (d.type === "product") {
        const scale = nodeSize / 10;
        g.append("polygon")
          .attr(
            "points",
            `0,${-10 * scale} ${8.66 * scale},${5 * scale} ${-8.66 * scale},${5 * scale}` // Diamond shape scaled
          )
          .attr("fill", "hsl(var(--node-product))")
          .attr("fill-opacity", 0.8)
          .attr("stroke", "white")
          .attr("stroke-width", 1.5)
          .classed("node-shape", true);
      }
      
      // Add a highlight circle that will be visible on hover/selection
      g.append("circle")
        .attr("r", nodeSize + 4)
        .attr("fill", "none")
        .attr("stroke", "hsl(var(--primary))")
        .attr("stroke-width", 2)
        .attr("opacity", 0)
        .classed("node-highlight", true);
    });

    // Add labels to the nodes
    node
      .append("text")
      .attr("dy", d => {
        // Adjust label position based on node type and size
        const nodeSize = d.value ? 10 + d.value * 5 : 10;
        return d.type === "product" ? nodeSize + 12 : nodeSize + 10;
      })
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "hsl(var(--foreground))")
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 0.5)
      .attr("paint-order", "stroke")
      .attr("class", "node-label")
      .text(d => {
        // Truncate long names
        return d.name.length > 15 ? d.name.slice(0, 13) + '...' : d.name;
      });

    // Set up the simulation
    simulation.nodes(nodes).on("tick", ticked);
    simulation.force<d3.ForceLink<Node, Link>>("link")?.links(links);

    // Add zoom capability
    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", zoomed);
    svg.call(zoom);

    // Functions for the simulation
    function ticked() {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    }

    function zoomed(event: any) {
      svg
        .selectAll("g")
        .attr("transform", `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`);
    }

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, width, height]);

  // Update highlight effect when hovered or selected node changes
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Reset all highlights
    d3.select(svgRef.current)
      .selectAll(".node-highlight")
      .attr("opacity", 0);
    
    d3.select(svgRef.current)
      .selectAll(".node")
      .classed("node-selected", false);
    
    // Add highlight to hovered node
    if (hoveredNode) {
      d3.select(svgRef.current)
        .selectAll(`.node[data-id="${hoveredNode}"]`)
        .select(".node-highlight")
        .attr("opacity", 0.5);
    }
    
    // Add highlight to selected node
    if (selectedNode) {
      d3.select(svgRef.current)
        .selectAll(`.node[data-id="${selectedNode}"]`)
        .classed("node-selected", true)
        .select(".node-highlight")
        .attr("opacity", 1);
    }
  }, [hoveredNode, selectedNode]);
  
  // Clear selection when clicking on the background
  useEffect(() => {
    const handleBackgroundClick = () => {
      setSelectedNode(null);
    };
    
    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener('click', handleBackgroundClick);
    }
    
    return () => {
      if (svg) {
        svg.removeEventListener('click', handleBackgroundClick);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "border border-border rounded-md overflow-hidden bg-card relative",
        className
      )}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-full"
      ></svg>
      
      {/* Tooltip */}
      {tooltip && (
        <div 
          className="absolute bg-popover text-popover-foreground text-xs py-1 px-2 rounded shadow-md z-50"
          style={{
            left: `${tooltip.x - 50}px`, 
            top: `${tooltip.y - 40}px`,
            transform: "translate(-50%, -100%)"
          }}
        >
          {tooltip.content}
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-card/80 backdrop-blur-sm p-2 rounded shadow-sm text-xs border border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--node-enterprise))]" />
            <span>企业</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-[hsl(var(--node-person))]" />
            <span>个人</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rotate-45 bg-[hsl(var(--node-product))]" />
            <span>产品</span>
          </div>
        </div>
      </div>
    </div>
  );
}