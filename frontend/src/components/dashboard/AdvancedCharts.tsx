import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ScatterPlot,
  Scatter,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  TreeMap,
  Sankey,
  Funnel,
  FunnelChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Activity,
  Target,
  Download
} from 'lucide-react';

// 图表数据接口
interface ChartDataPoint {
  name: string;
  value: number;
  category?: string;
  date?: string;
  [key: string]: any;
}

interface TimeSeriesData {
  date: string;
  [metric: string]: number | string;
}

interface RiskDistributionData {
  risk_level: 'low' | 'medium' | 'high';
  count: number;
  percentage: number;
}

interface IndustryData {
  industry: string;
  enterprise_count: number;
  avg_score: number;
  risk_count: number;
}

interface AdvancedChartsProps {
  timeSeriesData?: TimeSeriesData[];
  riskDistribution?: RiskDistributionData[];
  industryData?: IndustryData[];
  scoreDistribution?: ChartDataPoint[];
  className?: string;
}

// 颜色主题
const COLORS = {
  primary: ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'],
  risk: {
    low: '#10B981',
    medium: '#F59E0B', 
    high: '#EF4444'
  },
  gradient: [
    { offset: '0%', stopColor: '#3B82F6', stopOpacity: 0.8 },
    { offset: '100%', stopColor: '#3B82F6', stopOpacity: 0.1 }
  ]
};

// 自定义工具提示
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? 
              entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 趋势指标组件
const TrendIndicator = ({ 
  value, 
  change, 
  label 
}: { 
  value: number; 
  change?: number; 
  label: string;
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900">
          {value.toLocaleString()}
        </p>
      </div>
      {change !== undefined && (
        <div className={cn(
          'flex items-center px-2 py-1 rounded-full text-sm font-medium',
          isPositive && 'bg-green-100 text-green-800',
          isNegative && 'bg-red-100 text-red-800',
          change === 0 && 'bg-gray-100 text-gray-800'
        )}>
          {isPositive && <TrendingUp className="w-4 h-4 mr-1" />}
          {isNegative && <TrendingDown className="w-4 h-4 mr-1" />}
          {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
  );
};

// 雷达图配置
const RadarChartComponent = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <RadarChart data={data}>
      <PolarGrid />
      <PolarAngleAxis dataKey="metric" />
      <PolarRadiusAxis angle={90} domain={[0, 100]} />
      <Radar
        name="评分"
        dataKey="value"
        stroke="#3B82F6"
        fill="#3B82F6"
        fillOpacity={0.3}
        strokeWidth={2}
      />
      <Tooltip content={<CustomTooltip />} />
    </RadarChart>
  </ResponsiveContainer>
);

// 热力图组件
const HeatMap = ({ data }: { data: any[] }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="grid grid-cols-7 gap-1">
      {data.map((item, index) => (
        <div
          key={index}
          className="aspect-square rounded flex items-center justify-center text-xs font-medium text-white"
          style={{
            backgroundColor: `rgba(59, 130, 246, ${item.value / maxValue})`
          }}
          title={`${item.name}: ${item.value}`}
        >
          {item.value}
        </div>
      ))}
    </div>
  );
};

// 桑基图组件
const SankeyDiagram = ({ data }: { data: any }) => (
  <ResponsiveContainer width="100%" height={400}>
    <Sankey
      data={data}
      nodeWidth={20}
      nodePadding={50}
      linkCurvature={0.61}
      iterations={32}
    />
  </ResponsiveContainer>
);

export const AdvancedCharts: React.FC<AdvancedChartsProps> = ({
  timeSeriesData = [],
  riskDistribution = [],
  industryData = [],
  scoreDistribution = [],
  className
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('enterprise_count');

  // 处理时间序列数据
  const processedTimeSeriesData = useMemo(() => {
    const now = new Date();
    const daysBack = selectedTimeRange === '7d' ? 7 : 
                    selectedTimeRange === '30d' ? 30 : 90;
    
    return timeSeriesData.slice(-daysBack);
  }, [timeSeriesData, selectedTimeRange]);

  // 风险分布饼图数据
  const riskPieData = riskDistribution.map(item => ({
    name: item.risk_level,
    value: item.count,
    percentage: item.percentage
  }));

  // 行业分析数据
  const industryBarData = industryData.slice(0, 10).map(item => ({
    name: item.industry,
    企业数量: item.enterprise_count,
    平均评分: item.avg_score,
    风险企业: item.risk_count
  }));

  // 评分分布直方图数据
  const scoreHistogramData = useMemo(() => {
    const bins = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${(i + 1) * 10}`,
      count: 0
    }));

    scoreDistribution.forEach(item => {
      const binIndex = Math.min(Math.floor(item.value / 10), 9);
      bins[binIndex].count++;
    });

    return bins;
  }, [scoreDistribution]);

  // 雷达图数据（企业综合评估）
  const radarData = [
    { metric: 'SVS', value: 75 },
    { metric: 'DES', value: 82 },
    { metric: 'NIS', value: 68 },
    { metric: 'PCS', value: 90 },
    { metric: '财务健康', value: 73 },
    { metric: '合规性', value: 88 }
  ];

  // 漏斗图数据
  const funnelData = [
    { name: '潜在客户', value: 1000, fill: '#3B82F6' },
    { name: '意向客户', value: 600, fill: '#8B5CF6' },
    { name: '商机客户', value: 300, fill: '#06B6D4' },
    { name: '成交客户', value: 150, fill: '#10B981' }
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* 概览指标 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TrendIndicator value={1234} change={12.5} label="总企业数" />
        <TrendIndicator value={89} change={-2.3} label="高风险企业" />
        <TrendIndicator value={567} change={8.7} label="活跃客户" />
        <TrendIndicator value={78.5} change={5.2} label="平均评分" />
      </div>

      {/* 主要图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 时间序列图 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                趋势分析
              </CardTitle>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7天</SelectItem>
                  <SelectItem value="30d">30天</SelectItem>
                  <SelectItem value="90d">90天</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={processedTimeSeriesData}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    {COLORS.gradient.map((color, index) => (
                      <stop key={index} {...color} />
                    ))}
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 风险分布饼图 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              风险分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS.risk[entry.name as keyof typeof COLORS.risk]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 详细分析标签页 */}
      <Card>
        <CardHeader>
          <CardTitle>详细分析</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="industry" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="industry">行业分析</TabsTrigger>
              <TabsTrigger value="score">评分分布</TabsTrigger>
              <TabsTrigger value="radar">综合评估</TabsTrigger>
              <TabsTrigger value="funnel">转化漏斗</TabsTrigger>
            </TabsList>

            <TabsContent value="industry" className="mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={industryBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="企业数量" fill="#3B82F6" />
                  <Bar yAxisId="left" dataKey="风险企业" fill="#EF4444" />
                  <Line yAxisId="right" dataKey="平均评分" stroke="#10B981" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="score" className="mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={scoreHistogramData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="radar" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium mb-4">企业综合评估雷达图</h4>
                  <RadarChartComponent data={radarData} />
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-4">评估指标说明</h4>
                  <div className="space-y-3">
                    {radarData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{item.metric}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="funnel" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={400}>
                    <FunnelChart>
                      <Tooltip content={<CustomTooltip />} />
                      <Funnel
                        dataKey="value"
                        data={funnelData}
                        isAnimationActive
                      />
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-4">转化率分析</h4>
                  <div className="space-y-3">
                    {funnelData.map((item, index) => {
                      const nextItem = funnelData[index + 1];
                      const conversionRate = nextItem ? 
                        ((nextItem.value / item.value) * 100).toFixed(1) : null;
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded" 
                              style={{ backgroundColor: item.fill }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{item.value.toLocaleString()}</div>
                            {conversionRate && (
                              <div className="text-sm text-gray-600">
                                转化率: {conversionRate}%
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 导出按钮 */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          导出报表
        </Button>
      </div>
    </div>
  );
};

export default AdvancedCharts;