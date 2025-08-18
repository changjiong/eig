import { Building2, ChevronRight, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ScoreCircle from "./ScoreCircle";

interface ProspectCardProps {
  id: string;
  name: string;
  industry: string;
  registeredCapital: number;
  employeeCount: number;
  pcsScore: number;
  svsScore: number;
  desScore: number;
  nisScore: number;
  discoveryPath: string;
  onSelect: (id: string) => void;
}

export default function ProspectCard({
  id,
  name,
  industry,
  registeredCapital,
  employeeCount,
  pcsScore,
  svsScore,
  desScore,
  nisScore,
  discoveryPath,
  onSelect,
}: ProspectCardProps) {
  // Function to format capital in Chinese style (unit: 10,000 yuan)
  const formatCapital = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(2)} 亿元`;
    }
    return `${(value / 10000).toFixed(2)} 万元`;
  };

  // Function to get score text based on range
  const getScoreText = (score: number) => {
    if (score >= 90) return "极高";
    if (score >= 80) return "很高";
    if (score >= 70) return "高";
    if (score >= 60) return "中等偏上";
    if (score >= 50) return "中等";
    if (score >= 40) return "中等偏下";
    if (score >= 30) return "较低";
    return "低";
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-base">{name}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Badge variant="outline">{industry}</Badge>
              <div className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                <span>{formatCapital(registeredCapital)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{employeeCount}人</span>
              </div>
            </div>
          </div>

          <ScoreCircle score={pcsScore} size={50} />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">静态价值</div>
            <div className="font-medium mt-1">{svsScore}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">动态互动</div>
            <div className="font-medium mt-1">{desScore}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">网络影响力</div>
            <div className="font-medium mt-1">{nisScore}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-sm">
              <span className="text-muted-foreground">开发潜力: </span>
              <span className="font-medium">{getScoreText(pcsScore)}</span>
            </div>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">发现路径: </span>
            <span className="text-primary">{discoveryPath}</span>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => onSelect(id)}
          >
            <span>查看详情</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}