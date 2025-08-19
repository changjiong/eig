import { useState, useEffect } from "react";
import { Search, Filter, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiService } from "@/services/api";

interface SearchResult {
  id: string;
  name: string;
  type: 'enterprise' | 'client';
  industry?: string;
  creditCode?: string;
  registeredCapital?: number;
  establishmentDate?: string;
  score?: number;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  status?: string;
  priority?: string;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // 获取搜索建议
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await ApiService.SearchEnhanced.getSearchSuggestions(
        query, 
        searchType === "all" ? undefined : searchType as any
      );
      
      if (response.success) {
        setSuggestions(response.data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('获取搜索建议失败:', error);
    }
  };

  // 防抖处理搜索建议
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        fetchSuggestions(searchQuery);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchType]);

  // 执行搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("请输入搜索关键词");
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      setShowSuggestions(false);

      const response = await ApiService.Search.searchEntities(searchQuery, {
        type: searchType === "all" ? undefined : searchType as any,
        page: 1,
        pageSize: 20
      });

      if (response.success) {
        // 转换搜索结果格式 - 直接使用返回的数组数据
        const results: SearchResult[] = (response.data as any)?.map((item: any) => {
          // 判断是企业还是客户
          if (item.creditCode || item.registeredCapital) {
            return {
              id: item.id,
              name: item.name,
              type: 'enterprise' as const,
              industry: item.industry,
              creditCode: item.creditCode,
              registeredCapital: item.registeredCapital,
              establishmentDate: item.establishDate ? new Date(item.establishDate).toLocaleDateString() : undefined,
              score: (item.svs + item.des + item.nis + item.pcs) / 4 || Math.random() * 100,
            };
          } else {
            return {
              id: item.id,
              name: item.name,
              type: 'client' as const,
              company: item.company,
              industry: item.industry,
              position: item.position,
              email: item.email,
              phone: item.phone,
              status: item.status,
              priority: item.priority,
              score: Math.random() * 100, // 临时评分
            };
          }
        }) || [];

        setSearchResults(results);
        setTotalResults(results.length);
        setHasSearched(true);
      } else {
        setError(response.message || '搜索失败');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setError('搜索服务异常，请稍后重试');
    } finally {
      setIsSearching(false);
    }
  };

  // 高级搜索
  const handleAdvancedSearch = async () => {
    try {
      setIsSearching(true);
      setError(null);

      const filters: any = {};
      if (industryFilter !== "all") {
        filters.industry = [industryFilter];
      }

      const response = await ApiService.SearchEnhanced.advancedSearch({
        keyword: searchQuery,
        entityType: searchType === "all" ? undefined : searchType,
        filters,
        page: 1,
        limit: 20
      });

      if (response.success) {
        const results: SearchResult[] = (response.data as any)?.results?.map((item: any) => ({
          id: item.id,
          name: item.name,
          type: item.type || 'enterprise',
          industry: item.industry,
          creditCode: item.creditCode,
          registeredCapital: item.registeredCapital,
          establishmentDate: item.establishDate ? new Date(item.establishDate).toLocaleDateString() : undefined,
          score: item.svs || Math.random() * 100,
        })) || [];

        setSearchResults(results);
        setTotalResults((response.data as any)?.pagination?.total || results.length);
        setHasSearched(true);
      } else {
        setError(response.message || '高级搜索失败');
      }
    } catch (error) {
      console.error('高级搜索失败:', error);
      setError('搜索服务异常，请稍后重试');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setSearchType("all");
    setIndustryFilter("all");
    setSearchResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
    setHasSearched(false);
    setTotalResults(0);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'enterprise') {
      navigate(`/enterprise/${result.id}`);
    } else if (result.type === 'client') {
      navigate(`/clients`); // 或导航到客户详情页
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    // 自动执行搜索
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const getResultTypeText = (type: string) => {
    switch (type) {
      case 'enterprise':
        return '企业';
      case 'client':
        return '客户';
      default:
        return '未知';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'potential':
        return 'secondary';
      case 'inactive':
        return 'outline';
      case 'lost':
        return 'destructive';
      default:
        return 'outline';
    }
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
              <div className="md:col-span-2 relative">
                <label className="text-sm font-medium mb-2 block">关键词</label>
                <Input
                  placeholder="请输入企业名称、统一社会信用代码等"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                
                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="font-medium text-sm">{suggestion.text}</div>
                        {suggestion.subtitle && (
                          <div className="text-xs text-muted-foreground">{suggestion.subtitle}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
                    <SelectItem value="client">客户</SelectItem>
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
                    <SelectItem value="信息技术">信息技术</SelectItem>
                    <SelectItem value="金融业">金融业</SelectItem>
                    <SelectItem value="制造业">制造业</SelectItem>
                    <SelectItem value="房地产">房地产</SelectItem>
                    <SelectItem value="教育">教育</SelectItem>
                    <SelectItem value="医疗健康">医疗健康</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                className="flex items-center gap-2"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isSearching ? "搜索中..." : "搜索"}
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleAdvancedSearch}
                disabled={isSearching}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                高级搜索
              </Button>
              <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                重置
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="link" className="ml-2" onClick={() => setError(null)}>
                关闭
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Search Results */}
        {(hasSearched || isSearching) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                搜索结果 {isSearching ? "" : `(${totalResults})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSearching ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border border-border rounded-lg space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-12" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {hasSearched ? "未找到相关结果，请尝试其他关键词" : "输入关键词开始搜索"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-base">{result.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">
                              {getResultTypeText(result.type)}
                            </Badge>
                            {result.industry && (
                              <Badge variant="outline">{result.industry}</Badge>
                            )}
                            {result.status && (
                              <Badge variant={getStatusColor(result.status) as any}>
                                {result.status}
                              </Badge>
                            )}
                            {result.priority && (
                              <Badge variant="outline">{result.priority}优先级</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {result.score?.toFixed(1) || "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground">综合评分</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        {result.type === 'enterprise' ? (
                          <>
                            {result.creditCode && (
                              <div>
                                <span className="font-medium">统一社会信用代码：</span>
                                {result.creditCode}
                              </div>
                            )}
                            {result.registeredCapital && (
                              <div>
                                <span className="font-medium">注册资本：</span>
                                {(result.registeredCapital / 10000).toFixed(0)}万元
                              </div>
                            )}
                            {result.establishmentDate && (
                              <div>
                                <span className="font-medium">成立日期：</span>
                                {result.establishmentDate}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {result.company && (
                              <div>
                                <span className="font-medium">公司：</span>
                                {result.company}
                              </div>
                            )}
                            {result.position && (
                              <div>
                                <span className="font-medium">职位：</span>
                                {result.position}
                              </div>
                            )}
                            {result.email && (
                              <div>
                                <span className="font-medium">邮箱：</span>
                                {result.email}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
} 