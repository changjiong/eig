import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ScoreCardProps {
  title: string;
  score: number;
  description: string;
  details?: { label: string; value: number }[];
  className?: string;
}

export default function ScoreCard({
  title,
  score,
  description,
  details,
  className,
}: ScoreCardProps) {
  // Function to determine color based on score
  const getScoreColor = (value: number) => {
    if (value >= 90) return "var(--score-excellent)";
    if (value >= 75) return "var(--score-good)";
    if (value >= 60) return "var(--score-average)";
    if (value >= 40) return "var(--score-warning)";
    return "var(--score-poor)";
  };

  // Function to format score with one decimal place
  const formatScore = (value: number) => {
    return value.toFixed(1);
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center gap-1">
            {title}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <div
            className="text-2xl font-bold"
            style={{ color: getScoreColor(score) }}
          >
            {formatScore(score)}
          </div>
        </div>
      </CardHeader>
      {details && (
        <CardContent>
          <div className="space-y-1">
            {details.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span style={{ color: getScoreColor(item.value) }}>
                  {formatScore(item.value)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}