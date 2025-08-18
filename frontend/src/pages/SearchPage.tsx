import { useState } from "react";
import { Search, Filter, RefreshCw } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");

  // Mock search results
  const searchResults = [
    {
      id: "1",
      name: "星达科技有限公司",
      type: "enterprise",
      industry: "信息技术",
      creditCode: "91330106MA2GL1RQ5X",
      registeredCapital: "8000万",
      establishmentDate: "2018-03-15",
      score: 87.5,
    },
    {
      id: "2", 
      name: "蓝海科技集团",
      type: "enterprise",
      industry: "制造业",
      creditCode: "91110000123456789A",
      registeredCapital: "5000万",
      establishmentDate: "2015-06-20",
      score: 82.3,
    },
  ];

  const handleSearch = () => {
    // 实现搜索逻辑
    console.log("搜索:", { searchQuery, searchType, industryFilter });
  };

  const handleReset = () => {
    setSearchQuery("");
    setSearchType("all");
    setIndustryFilter("all");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">高级搜索</h1>
        </div>

        {/* Search Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              搜索条件
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">关键词</label>
                <Input
                  placeholder="请输入企业名称、统一社会信用代码等"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">搜索类型</label>
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="enterprise">企业</SelectItem>
                    <SelectItem value="person">个人</SelectItem>
                    <SelectItem value="product">产品</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">行业</label>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部行业</SelectItem>
                    <SelectItem value="tech">信息技术</SelectItem>
                    <SelectItem value="finance">金融业</SelectItem>
                    <SelectItem value="manufacturing">制造业</SelectItem>
                    <SelectItem value="real-estate">房地产</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                搜索
              </Button>
              <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                重置
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">搜索结果 ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-base">{result.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{result.type === 'enterprise' ? '企业' : '个人'}</Badge>
                        <Badge variant="outline">{result.industry}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{result.score}</div>
                      <div className="text-xs text-muted-foreground">综合评分</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">统一社会信用代码：</span>
                      {result.creditCode}
                    </div>
                    <div>
                      <span className="font-medium">注册资本：</span>
                      {result.registeredCapital}
                    </div>
                    <div>
                      <span className="font-medium">成立日期：</span>
                      {result.establishmentDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 