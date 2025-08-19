import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Search, 
  MapPin, 
  Calendar,
  TrendingUp,
  Users
} from "lucide-react";
import { useEnterprises } from "@/hooks/useData";
import { Enterprise } from "@/types/database";

interface EnterpriseSelectionListProps {
  className?: string;
}

export default function EnterpriseSelectionList({ className }: EnterpriseSelectionListProps) {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: enterprises, isLoading, pagination } = useEnterprises({
    page: currentPage,
    pageSize: 20,
    keyword: searchKeyword
  });

  // 处理企业选择
  const handleEnterpriseSelect = (enterpriseId: string) => {
    navigate(`/enterprise/${enterpriseId}`);
  };

  // 格式化日期
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "未知";
    return new Date(date).toLocaleDateString('zh-CN');
  };

  // 获取风险等级显示
  const getRiskLevelDisplay = (level: string) => {
    const riskConfig = {
      low: { text: "低风险", color: "bg-green-100 text-green-800" },
      medium: { text: "中风险", color: "bg-yellow-100 text-yellow-800" },
      high: { text: "高风险", color: "bg-red-100 text-red-800" }
    };
    return riskConfig[level as keyof typeof riskConfig] || { text: "未知", color: "bg-gray-100 text-gray-800" };
  };

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    const statusConfig = {
      active: { text: "正常经营", color: "bg-blue-100 text-blue-800" },
      inactive: { text: "停业", color: "bg-gray-100 text-gray-800" },
      dissolved: { text: "注销", color: "bg-red-100 text-red-800" }
    };
    return statusConfig[status as keyof typeof statusConfig] || { text: "未知", color: "bg-gray-100 text-gray-800" };
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            选择企业
          </CardTitle>
          
          {/* 搜索栏 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜索企业名称、统一社会信用代码..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            // 加载骨架屏
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : enterprises.length === 0 ? (
            // 空状态
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchKeyword ? "未找到匹配的企业" : "暂无企业数据"}
              </p>
            </div>
          ) : (
            // 企业列表
            <div className="space-y-4">
              {enterprises.map((enterprise) => {
                const riskDisplay = getRiskLevelDisplay(enterprise.riskLevel);
                const statusDisplay = getStatusDisplay(enterprise.status);
                
                return (
                  <Card 
                    key={enterprise.id} 
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleEnterpriseSelect(enterprise.id)}
                  >
                    <div className="space-y-3">
                      {/* 企业基本信息 */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{enterprise.name}</h3>
                            {enterprise.isClient && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                客户
                              </Badge>
                            )}
                            {enterprise.isProspect && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                潜在客户
                              </Badge>
                            )}
                          </div>
                          
                          {enterprise.legalName && enterprise.legalName !== enterprise.name && (
                            <p className="text-sm text-gray-600 mb-1">法定名称: {enterprise.legalName}</p>
                          )}
                          
                          {enterprise.creditCode && (
                            <p className="text-sm text-gray-500 mb-1">统一社会信用代码: {enterprise.creditCode}</p>
                          )}
                        </div>
                        
                        {/* 评分信息 */}
                        {enterprise.svs && (
                          <div className="text-right">
                            <div className="text-sm text-gray-500 mb-1">SVS评分</div>
                            <div className="text-lg font-semibold text-blue-600">
                              {enterprise.svs.toFixed(1)}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* 企业详细信息 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        {enterprise.industry && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{enterprise.industry}</span>
                          </div>
                        )}
                        
                        {enterprise.establishDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">成立: {formatDate(enterprise.establishDate)}</span>
                          </div>
                        )}
                        
                        {enterprise.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 truncate" title={enterprise.address}>
                              {enterprise.address}
                            </span>
                          </div>
                        )}
                        
                        {(enterprise.supplierCount || enterprise.customerCount || enterprise.partnerCount) && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              关系: {(enterprise.supplierCount || 0) + (enterprise.customerCount || 0) + (enterprise.partnerCount || 0)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* 状态标签 */}
                      <div className="flex gap-2">
                        <Badge className={statusDisplay.color}>
                          {statusDisplay.text}
                        </Badge>
                        <Badge className={riskDisplay.color}>
                          {riskDisplay.text}
                        </Badge>
                        
                        {enterprise.clientLevel && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {enterprise.clientLevel}级客户
                          </Badge>
                        )}
                      </div>
                      
                      {/* 法定代表人 */}
                      {enterprise.legalRepresentative && (
                        <div className="text-sm text-gray-600">
                          法定代表人: {enterprise.legalRepresentative}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          
          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                共 {pagination.total} 家企业，第 {pagination.page} / {pagination.totalPages} 页
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage >= pagination.totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}