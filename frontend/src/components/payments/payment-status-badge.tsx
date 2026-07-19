import { Badge } from "@/components/ui/badge";

interface PaymentStatusBadgeProps {
  status: string;
}

const statusMap: Record<string, { variant: "default" | "success" | "warning" | "destructive" | "info"; label: string }> = {
  PENDING_FUNDING: { variant: "warning", label: "Pending" },
  FUNDED: { variant: "success", label: "Funded" },
  REFUNDED: { variant: "default", label: "Refunded" },
  CANCELLED: { variant: "destructive", label: "Cancelled" },
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = statusMap[status] || { variant: "default" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
