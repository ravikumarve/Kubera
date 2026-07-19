"use client";

import { useApproveMilestone } from "@/hooks/use-contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Milestone } from "@/types/models";

interface MilestoneCardProps {
  milestone: Milestone;
  contractId: string;
  isBuyer: boolean;
}

const statusVariant: Record<string, "default" | "warning" | "success" | "destructive"> = {
  PENDING: "default",
  APPROVED: "success",
  RELEASED: "success",
  DISPUTED: "destructive",
};

export function MilestoneCard({
  milestone,
  contractId,
  isBuyer,
}: MilestoneCardProps) {
  const approveMutation = useApproveMilestone(contractId);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="font-medium">{milestone.description}</h4>
          {milestone.due_date && (
            <p className="text-sm text-muted-foreground">
              Due {formatDate(milestone.due_date)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-medium">
            {formatCurrency(milestone.amount, "USD")}
          </span>
          <Badge variant={statusVariant[milestone.status] || "default"}>
            {milestone.status}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-muted-foreground">
          {milestone.percentage}% of contract
        </span>

        <div className="flex gap-2">
          {milestone.status === "APPROVED" && isBuyer && (
            <Button
              size="sm"
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate(milestone.id)}
            >
              {approveMutation.isPending ? "Confirming..." : "Approve"}
            </Button>
          )}

          {milestone.status === "APPROVED" && !isBuyer && (
            <span className="text-xs text-muted-foreground italic">
              Awaiting buyer approval
            </span>
          )}

          {milestone.status === "RELEASED" && (
            <span className="text-xs text-emerald-500 font-medium">
              Completed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
