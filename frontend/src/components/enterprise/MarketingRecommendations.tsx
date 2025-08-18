import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CheckCircle, Copy, ExternalLink, Flag, Gift, Star } from 'lucide-react';

export interface ProductRecommendation {
  id: string;
  name: string;
  description: string;
  matchScore: number;
  features: string[];
  benefits: string[];
}

export interface MarketingStrategy {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expectedOutcome: string;
  steps: string[];
}

interface MarketingRecommendationsProps {
  enterpriseName: string;
  productRecommendations: ProductRecommendation[];
  strategies: MarketingStrategy[];
  valueProposition: string;
  className?: string;
}

export default function MarketingRecommendations({
  enterpriseName,
  productRecommendations,
  strategies,
  valueProposition,
  className
}: MarketingRecommendationsProps) {
  // Priority colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-orange-500';
      case 'low':
        return 'text-blue-500';
      default:
        return '';
    }
  };

  // Match score background
  const getMatchScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-green-500 text-white';
    if (score >= 80) return 'bg-emerald-500 text-white';
    if (score >= 70) return 'bg-blue-500 text-white';
    return 'bg-muted text-foreground';
  };

  return (
    <div className={className}>
      {/* Value Proposition */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            价值主张
          </CardTitle>
          <CardDescription>
            基于企业需求分析生成的个性化价值主张
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="text-sm bg-card p-4 rounded-md border border-border">
              <p className="italic">{valueProposition}</p>
            </div>
            <Button size="sm" variant="ghost" className="absolute top-2 right-2">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Recommendations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">产品推荐</CardTitle>
          <CardDescription>
            最适合{enterpriseName}的金融产品推荐
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {productRecommendations.map((product) => (
              <div key={product.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">{product.name}</h3>
                  <Badge className={getMatchScoreBackground(product.matchScore)}>
                    匹配度 {product.matchScore}%
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">产品特点</h4>
                    <ul className="space-y-1">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">客户收益</h4>
                    <ul className="space-y-1">
                      {product.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Gift className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm">
                    产品详情
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </Button>
                  <Button size="sm">
                    推荐给客户
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Marketing Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">营销策略建议</CardTitle>
          <CardDescription>
            针对{enterpriseName}的定制营销方案
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Flag className={`h-5 w-5 ${getPriorityColor(strategy.priority)}`} />
                    <h3 className="font-medium">{strategy.title}</h3>
                  </div>
                  <Badge variant="outline">
                    {strategy.priority === 'high' ? '高优先级' : 
                     strategy.priority === 'medium' ? '中优先级' : '低优先级'}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>
                
                <div className="bg-muted/30 p-3 rounded-md mb-3">
                  <h4 className="text-sm font-medium mb-1">预期效果</h4>
                  <p className="text-sm">{strategy.expectedOutcome}</p>
                </div>
                
                <div className="space-y-1 mb-3">
                  <h4 className="text-sm font-medium">执行步骤</h4>
                  <ol className="list-decimal pl-5 text-sm space-y-1">
                    {strategy.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
                
                <div className="flex justify-end">
                  <Button size="sm">
                    制定营销计划
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}