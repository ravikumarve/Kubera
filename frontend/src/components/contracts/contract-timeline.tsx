"use client";

import { cn } from "@/lib/utils";
import type { Milestone } from "@/types/models";
import { MilestoneCard } from "./milestone-card";

interface ContractTimelineProps {
  milestones: Milestone[];
  contractId: string;
  isBuyer: boolean;
}

const statusIcon = {
  PENDING: "○",
  APPROVED: "◐",
  RELEASED: "●",
  DISPUTED: "⊗",
} as const;

export function ContractTimeline({
  milestones,
  contractId,
  isBuyer,
}: ContractTimelineProps) {
  return (
    <ol className="relative border-l-2 border-border ml-3 space-y-6">
      {milestones.map((milestone) => (
        <li key={milestone.id} className="ml-6">
          <span
            className={cn(
              "absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background text-sm",
              milestone.status === "RELEASED"
                ? "border-emerald-500 text-emerald-500"
                : milestone.status === "DISPUTED"
                  ? "border-red-500 text-red-500"
                  : "border-muted-foreground text-muted-foreground"
            )}
          >
            {statusIcon[milestone.status] || "○"}
          </span>
          <MilestoneCard
            milestone={milestone}
            contractId={contractId}
            isBuyer={isBuyer}
          />
        </li>
      ))}
    </ol>
  );
}
