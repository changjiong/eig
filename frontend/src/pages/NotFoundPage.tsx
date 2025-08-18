import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4">
      <div className="text-6xl font-bold text-primary">404</div>
      <h1 className="text-2xl font-bold mt-4">页面未找到</h1>
      <p className="text-muted-foreground mt-2 text-center">
        您尝试访问的页面不存在或已被移除
      </p>
      <Button
        className="mt-8"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回首页
      </Button>
    </div>
  );
}