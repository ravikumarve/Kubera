"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Contract, ContractStatus } from "@/types/models";

const statusConfig: Record<
  ContractStatus,
  { variant: "default" | "success" | "warning" | "destructive" | "info" | "secondary"; label: string }
> = {
  DRAFT: { variant: "secondary", label: "Draft" },
  PENDING_FUNDING: { variant: "warning", label: "Pending Funding" },
  FUNDED: { variant: "info", label: "Funded" },
  IN_PROGRESS: { variant: "info", label: "In Progress" },
  COMPLETED: { variant: "success", label: "Completed" },
  DISPUTED: { variant: "destructive", label: "Disputed" },
  REFUNDED: { variant: "default", label: "Refunded" },
  CANCELLED: { variant: "secondary", label: "Cancelled" },
};

interface ContractTableProps {
  contracts: Contract[];
  isLoading?: boolean;
}

export function ContractTable({ contracts, isLoading }: ContractTableProps) {
  const router = useRouter();

  const columns = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (item: Contract) => (
        <span className="font-medium">{item.title}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (item: Contract) => (
        <span className="font-mono">
          {formatCurrency(item.amount, item.currency)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (item: Contract) => {
        const config = statusConfig[item.status] || statusConfig.DRAFT;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (item: Contract) => (
        <span className="text-muted-foreground">
          {formatDate(item.created_at)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={contracts}
      searchable
      searchKeys={["title"]}
      isLoading={isLoading}
      emptyMessage="No contracts found. Create your first contract to get started."
      pageSize={10}
    />
  );
}
