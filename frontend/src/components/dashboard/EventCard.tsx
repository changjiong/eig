import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Award, AlertCircle, Briefcase, Coins } from "lucide-react";

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  enterpriseId: string;
  enterpriseName: string;
  eventType: "financing" | "investment" | "litigation" | "award" | "other";
  date: string;
  importance: number;
  source: string;
  onAction: (id: string, action: "view" | "ignore") => void;
}

export default function EventCard({
  id,
  title,
  description,
  enterpriseId,
  enterpriseName,
  eventType,
  date,
  importance,
  source,
  onAction,
}: EventCardProps) {
  // Format relative time using date-fns
  const getRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhCN,
    });
  };

  // Get event type icon and color
  const getEventTypeInfo = (type: string) => {
    switch (type) {
      case "financing":
        return {
          icon: <Coins className="h-4 w-4" />,
          color: "bg-primary/10 text-primary",
          text: "融资事件",
        };
      case "investment":
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
          text: "投资事件",
        };
      case "litigation":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
          text: "诉讼事件",
        };
      case "award":
        return {
          icon: <Award className="h-4 w-4" />,
          color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
          text: "荣誉奖项",
        };
      default:
        return {
          icon: <Briefcase className="h-4 w-4" />,
          color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          text: "其他事件",
        };
    }
  };

  // Get importance level
  const getImportanceLevel = (value: number) => {
    if (value >= 80) return "极高";
    if (value >= 60) return "高";
    if (value >= 40) return "中";
    return "低";
  };

  const eventTypeInfo = getEventTypeInfo(eventType);

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-medium line-clamp-1">
            {title}
          </CardTitle>
          <Badge variant="outline" className={eventTypeInfo.color}>
            <span className="flex items-center gap-1">
              {eventTypeInfo.icon}
              {eventTypeInfo.text}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {description}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">企业:</span>
            <span className="font-medium">{enterpriseName}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">时间:</span>
            <span>{getRelativeTime(date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">重要性:</span>
            <span>{getImportanceLevel(importance)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">来源:</span>
            <span>{source}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction(id, "ignore")}
        >
          忽略
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => onAction(id, "view")}
        >
          查看详情
        </Button>
      </CardFooter>
    </Card>
  );
}