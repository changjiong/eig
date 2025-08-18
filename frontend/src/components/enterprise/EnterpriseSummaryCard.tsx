import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, Map, PhoneCall, Users } from "lucide-react";

interface EnterpriseSummaryCardProps {
  name: string;
  creditCode: string;
  registrationAddress: string;
  establishmentDate: string;
  registeredCapital: number;
  industry: string;
  employeeCount: number;
  contactPhone?: string;
  isClient: boolean;
  isProspect: boolean;
  onViewDetails?: () => void;
}

export default function EnterpriseSummaryCard({
  name,
  creditCode,
  registrationAddress,
  establishmentDate,
  registeredCapital,
  industry,
  employeeCount,
  contactPhone,
  isClient,
  isProspect,
  onViewDetails,
}: EnterpriseSummaryCardProps) {
  // Function to format capital in Chinese style (unit: 10,000 yuan)
  const formatCapital = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(2)} 亿元`;
    }
    return `${(value / 10000).toFixed(2)} 万元`;
  };

  // Function to format date (from ISO to YYYY-MM-DD)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription>{creditCode}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {isClient && (
              <Badge variant="outline" className="bg-primary/10 text-primary">
                现有客户
              </Badge>
            )}
            {isProspect && (
              <Badge
                variant="outline"
                className="bg-secondary/10 text-secondary"
              >
                潜在客户
              </Badge>
            )}
            <Badge variant="outline">{industry}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Map className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">{registrationAddress}</div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">成立日期: {formatDate(establishmentDate)}</div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">注册资本: {formatCapital(registeredCapital)}</div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">员工人数: {employeeCount}人</div>
            </div>
            {contactPhone && (
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">{contactPhone}</div>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={onViewDetails}
          >
            查看详细资料
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}