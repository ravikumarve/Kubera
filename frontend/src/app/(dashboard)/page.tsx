"use client";

import { useContracts } from "@/hooks/use-contracts";
import { StatsCard } from "@/components/shared/stats-card";
import { ContractTable } from "@/components/contracts/contract-table";
import {
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Contract } from "@/types/models";

export default function DashboardPage() {
  const { data: contracts, isLoading } = useContracts();

  const activeContracts =
    contracts?.filter(
      (c) =>
        c.status !== "COMPLETED" &&
        c.status !== "CANCELLED" &&
        c.status !== "REFUNDED"
    ) ?? [];

  const pendingFunding =
    contracts?.filter((c) => c.status === "PENDING_FUNDING") ?? [];

  const totalVolume =
    contracts?.reduce((sum, c) => sum + c.amount, 0) ?? 0;

  const disputedContracts =
    contracts?.filter((c) => c.status === "DISPUTED") ?? [];

  const recentContracts = contracts?.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your escrow activity
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Contracts"
          value={activeContracts.length.toString()}
          icon={<FileText className="h-4 w-4" />}
          trend={{ direction: "up", percentage: "12%" }}
        />
        <StatsCard
          title="Pending Funding"
          value={pendingFunding.length.toString()}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Volume"
          value={formatCurrency(totalVolume, "USD")}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{ direction: "up", percentage: "8%" }}
        />
        <StatsCard
          title="Disputes"
          value={disputedContracts.length.toString()}
          icon={<AlertCircle className="h-4 w-4" />}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Contracts</h2>
        <ContractTable
          contracts={recentContracts}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
