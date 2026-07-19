"use client";

import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/types/models";

const demoTransactions: Transaction[] = [
  {
    id: "txn_1",
    contract_id: "ct_1",
    amount: 5000,
    currency: "USD",
    type: "FUND",
    status: "SUCCEEDED",
    created_at: "2026-06-15T10:30:00Z",
  },
  {
    id: "txn_2",
    contract_id: "ct_1",
    amount: 2500,
    currency: "USD",
    type: "RELEASE",
    status: "SUCCEEDED",
    created_at: "2026-06-20T14:00:00Z",
  },
  {
    id: "txn_3",
    contract_id: "ct_2",
    amount: 10000,
    currency: "USD",
    type: "FUND",
    status: "PENDING",
    created_at: "2026-07-01T09:00:00Z",
  },
];

const typeConfig: Record<string, { variant: "default" | "info" | "warning" | "success"; label: string }> = {
  FUND: { variant: "info", label: "Deposit" },
  RELEASE: { variant: "success", label: "Release" },
  REFUND: { variant: "warning", label: "Refund" },
  FEE: { variant: "default", label: "Fee" },
};

const statusConfig: Record<string, "default" | "success" | "warning" | "destructive"> = {
  PENDING: "warning",
  SUCCEEDED: "success",
  FAILED: "destructive",
};

export default function TransactionsPage() {
  const columns = [
    {
      key: "id",
      label: "ID",
      render: (item: Transaction) => (
        <span className="font-mono text-xs">{item.id}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (item: Transaction) => {
        const config = typeConfig[item.type] || typeConfig.FUND;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (item: Transaction) => (
        <span className="font-mono">
          {formatCurrency(item.amount, item.currency)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (item: Transaction) => (
        <Badge variant={statusConfig[item.status] || "default"}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      render: (item: Transaction) => (
        <span className="text-muted-foreground">
          {formatDate(item.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground mt-1">
          View your payment history
        </p>
      </div>

      <DataTable
        columns={columns}
        data={demoTransactions}
        searchable
        searchKeys={["id", "contract_id"]}
        emptyMessage="No transactions found."
      />
    </div>
  );
}
