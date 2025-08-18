import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export interface RiskFactor {
  id: string;
  name: string;
  level: 'critical' | 'high' | 'medium' | 'low' | 'none';
  score: number;
  description: string;
}

interface RiskAnalysisProps {
  enterpriseName: string;
  riskFactors: RiskFactor[];
  overallRiskScore: number;
  className?: string;
}

export default function RiskAnalysis({ 
  enterpriseName, 
  riskFactors, 
  overallRiskScore,
  className 
}: RiskAnalysisProps) {
  // Calculate risk level based on score
  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'none';
  };

  const overallRiskLevel = getRiskLevel(overallRiskScore);

  // Get color classes based on risk level
  const getRiskColorClasses = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-amber-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      case 'none':
        return 'bg-green-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Get progress bar color based on risk level
  const getProgressColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-destructive';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-blue-500';
      case 'none':
        return 'bg-green-500';
      default:
        return 'bg-muted';
    }
  };

  // Get icon based on risk level
  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'none':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {/* Overall Risk Score */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">综合风险评估</CardTitle>
          <CardDescription>
            {enterpriseName}的综合风险评估结果
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              {getRiskIcon(overallRiskLevel)}
              <span className="font-medium">
                总体风险等级: 
                <Badge 
                  className={`ml-2 ${getRiskColorClasses(overallRiskLevel)}`}
                >
                  {overallRiskLevel === 'critical' ? '严重' : 
                   overallRiskLevel === 'high' ? '高' : 
                   overallRiskLevel === 'medium' ? '中' : 
                   overallRiskLevel === 'low' ? '低' : '无'}
                </Badge>
              </span>
            </div>
            <span className="text-2xl font-bold">{overallRiskScore}</span>
          </div>
          <Progress 
            value={overallRiskScore} 
            max={100} 
            className={`h-2.5 ${getProgressColor(overallRiskLevel)}`}
          />
          <div className="flex justify-between text-xs mt-1">
            <span>0</span>
            <span>100</span>
          </div>
        </CardContent>
      </Card>

      {/* Individual Risk Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">风险因子分析</CardTitle>
          <CardDescription>
            各项风险因子评分及详细说明
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {riskFactors.map((factor) => (
              <div key={factor.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {getRiskIcon(factor.level)}
                    <span className="font-medium">{factor.name}</span>
                  </div>
                  <Badge 
                    className={getRiskColorClasses(factor.level)}
                  >
                    {factor.score}
                  </Badge>
                </div>
                <div className="mb-2">
                  <Progress 
                    value={factor.score} 
                    max={100} 
                    className={`h-1.5 ${getProgressColor(factor.level)}`}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{factor.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}