import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: { direction: "up" | "down"; percentage: string };
}

export function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{title}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.direction === "up" ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span
              className={cn(
                "text-sm",
                trend.direction === "up"
                  ? "text-emerald-500"
                  : "text-red-500"
              )}
            >
              {trend.percentage} from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
