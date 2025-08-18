import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar, CheckCircle2, Clock, AlertCircle, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskItemProps {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  dueDate: string;
  priority: number;
  status: "pending" | "in_progress" | "completed" | "rejected";
  type: "entity_review" | "relationship_review" | "event_verification";
  onAction: (id: string, action: "start" | "complete" | "reject") => void;
}

export default function TaskItem({
  id,
  title,
  description,
  createdAt,
  dueDate,
  priority,
  status,
  type,
  onAction,
}: TaskItemProps) {
  // Format relative time using date-fns
  const getRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhCN,
    });
  };

  // Get the status badge color and text
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
          text: "待处理",
        };
      case "in_progress":
        return {
          color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          text: "进行中",
        };
      case "completed":
        return {
          color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
          text: "已完成",
        };
      case "rejected":
        return {
          color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
          text: "已拒绝",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
          text: "未知",
        };
    }
  };

  // Get priority level text and color
  const getPriorityLevel = (level: number) => {
    switch (level) {
      case 1:
        return { text: "低", color: "text-muted-foreground" };
      case 2:
        return { text: "中", color: "text-secondary" };
      case 3:
        return { text: "高", color: "text-primary" };
      case 4:
        return { text: "紧急", color: "text-orange-500" };
      case 5:
        return { text: "最高", color: "text-destructive" };
      default:
        return { text: "未知", color: "text-muted-foreground" };
    }
  };

  // Get task type icon
  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case "entity_review":
        return <FileSearch className="h-4 w-4" />;
      case "relationship_review":
        return <CheckCircle2 className="h-4 w-4" />;
      case "event_verification":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileSearch className="h-4 w-4" />;
    }
  };

  const statusBadge = getStatusBadge(status);
  const priorityLevel = getPriorityLevel(priority);
  const typeIcon = getTaskTypeIcon(type);
  const isDueDate = new Date(dueDate) < new Date();

  return (
    <div className="p-4 border border-border rounded-md bg-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                statusBadge.color
              )}
            >
              {statusBadge.text}
            </div>
            <div
              className={cn(
                "text-xs font-medium flex items-center gap-1",
                priorityLevel.color
              )}
            >
              <span>优先级:</span>
              <span>{priorityLevel.text}</span>
            </div>
          </div>

          <h3 className="font-medium truncate">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {description}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              {typeIcon}
              <span>
                {type === "entity_review"
                  ? "实体审核"
                  : type === "relationship_review"
                  ? "关系审核"
                  : "事件验证"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{getRelativeTime(createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className={cn(isDueDate && "text-destructive")}>
                截止: {getRelativeTime(dueDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(id, "start")}
              className="w-20"
            >
              开始处理
            </Button>
          )}
          {status === "in_progress" && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => onAction(id, "complete")}
                className="w-20"
              >
                完成
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(id, "reject")}
                className="w-20"
              >
                拒绝
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}