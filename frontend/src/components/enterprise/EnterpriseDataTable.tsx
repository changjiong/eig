import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search, SlidersHorizontal } from "lucide-react";

interface FinancialData {
  year: string;
  revenue: number;
  profit: number;
  assets: number;
  liabilities: number;
  cashflow: number;
}

interface EnterpriseDataTableProps {
  enterpriseName: string;
  financialData: FinancialData[];
  className?: string;
}

export default function EnterpriseDataTable({
  enterpriseName,
  financialData,
  className
}: EnterpriseDataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Format number to currency with specified decimal places
  const formatCurrency = (value: number, decimals: number = 2) => {
    // Convert to 10,000 Yuan format (万元)
    const inWan = value / 10000;
    return inWan.toLocaleString('zh-CN', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    });
  };

  // Filter data based on search query
  const filteredData = financialData.filter(item => {
    if (searchQuery === "") return true;
    
    // Convert search query and all searchable fields to lowercase
    const query = searchQuery.toLowerCase();
    return item.year.toLowerCase().includes(query);
  });

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-medium">{enterpriseName}财务数据</CardTitle>
            <CardDescription>历年财务指标（单位：万元）</CardDescription>
          </div>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-6 py-3 border-y flex justify-between items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="搜索年份..."
              className="pl-8"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            过滤
          </Button>
        </div>
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">年份</TableHead>
                <TableHead>营收</TableHead>
                <TableHead>利润</TableHead>
                <TableHead>资产</TableHead>
                <TableHead>负债</TableHead>
                <TableHead className="text-right">现金流</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow key={row.year}>
                  <TableCell className="font-medium">{row.year}</TableCell>
                  <TableCell>{formatCurrency(row.revenue)}</TableCell>
                  <TableCell>{formatCurrency(row.profit)}</TableCell>
                  <TableCell>{formatCurrency(row.assets)}</TableCell>
                  <TableCell>{formatCurrency(row.liabilities)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.cashflow)}</TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    未找到匹配的记录
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between py-3">
        <div className="text-sm text-muted-foreground">
          显示 {filteredData.length} 条财务记录
        </div>
      </CardFooter>
    </Card>
  );
}