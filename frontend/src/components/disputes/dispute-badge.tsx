import { Badge } from "@/components/ui/badge";

interface DisputeBadgeProps {
  status: string;
}

const statusMap: Record<string, { variant: "default" | "warning" | "success" | "destructive" | "info"; label: string }> = {
  OPEN: { variant: "destructive", label: "Open" },
  UNDER_REVIEW: { variant: "warning", label: "Under Review" },
  RESOLVED_BUYER: { variant: "success", label: "Resolved (Buyer)" },
  RESOLVED_SELLER: { variant: "success", label: "Resolved (Seller)" },
  RESOLVED_REFUND: { variant: "info", label: "Resolved (Refund)" },
};

export function DisputeBadge({ status }: DisputeBadgeProps) {
  const config = statusMap[status] || { variant: "default" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
