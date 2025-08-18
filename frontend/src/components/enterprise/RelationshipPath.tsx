import { cn } from "@/lib/utils";
import { ArrowRight, Building, User, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PathNode {
  id: string;
  name: string;
  type: "enterprise" | "person" | "product";
}

interface PathEdge {
  type: string;
  description: string;
}

interface RelationshipPathProps {
  title: string;
  path: {
    nodes: PathNode[];
    edges: PathEdge[];
  };
  confidence: number;
  className?: string;
}

export default function RelationshipPath({
  title,
  path,
  confidence,
  className,
}: RelationshipPathProps) {
  // Function to get the confidence level label and color
  const getConfidenceLevel = (value: number) => {
    if (value >= 80) {
      return {
        label: "高",
        color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
      };
    }
    if (value >= 50) {
      return {
        label: "中",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      };
    }
    return {
      label: "低",
      color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    };
  };

  // Get confidence level information
  const confidenceInfo = getConfidenceLevel(confidence);

  // Function to render the appropriate icon for each node type
  const getNodeIcon = (type: string) => {
    switch (type) {
      case "enterprise":
        return <Building className="h-4 w-4" />;
      case "person":
        return <User className="h-4 w-4" />;
      case "product":
        return <Package className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <Badge variant="outline" className={confidenceInfo.color}>
            可信度: {confidenceInfo.label} ({confidence}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          {path.nodes.map((node, index) => (
            <div key={node.id} className="flex items-center">
              {index > 0 && (
                <div className="flex flex-col items-center mx-1">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {path.edges[index - 1].type}
                  </span>
                </div>
              )}
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm",
                  {
                    "bg-primary/10 text-primary":
                      node.type === "enterprise",
                    "bg-secondary/10 text-secondary":
                      node.type === "person",
                    "bg-accent/10 text-accent":
                      node.type === "product",
                  }
                )}
              >
                {getNodeIcon(node.type)}
                <span className="max-w-[100px] truncate">{node.name}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">路径描述:</h4>
          <p className="text-sm text-muted-foreground">
            {path.edges.map((edge, i) => (
              <span key={i}>
                {i > 0 && " → "}
                {path.nodes[i].name}
                <span className="text-primary"> {edge.description} </span>
                {path.nodes[i + 1].name}
              </span>
            ))}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}