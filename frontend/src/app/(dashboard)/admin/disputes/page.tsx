"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { DisputeBadge } from "@/components/disputes/dispute-badge";
import { formatDate } from "@/lib/utils";
import { Check, X } from "lucide-react";

const demoDisputes = [
  {
    id: "d_1",
    contract_id: "ct_1",
    raised_by: "Alice Buyer",
    reason: "Deliverable does not match the agreed specifications. The code quality is significantly below what was promised.",
    status: "OPEN" as const,
    created_at: "2026-07-10T14:30:00Z",
  },
  {
    id: "d_2",
    contract_id: "ct_2",
    raised_by: "Bob Seller",
    reason: "Client has not provided the required assets for two weeks, delaying the project.",
    status: "UNDER_REVIEW" as const,
    created_at: "2026-07-08T09:00:00Z",
  },
];

export default function AdminDisputesPage() {
  const { data: session } = useSession();

  if ((session?.user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (item: typeof demoDisputes[0]) => (
        <span className="font-mono text-xs">{item.id}</span>
      ),
    },
    {
      key: "raised_by",
      label: "Raised By",
      sortable: true,
      render: (item: typeof demoDisputes[0]) => (
        <span className="font-medium">{item.raised_by}</span>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      render: (item: typeof demoDisputes[0]) => (
        <span className="text-sm text-muted-foreground max-w-xs truncate block">
          {item.reason}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (item: typeof demoDisputes[0]) => (
        <DisputeBadge status={item.status} />
      ),
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (item: typeof demoDisputes[0]) => (
        <span className="text-muted-foreground">
          {formatDate(item.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: typeof demoDisputes[0]) => (
        <div className="flex items-center gap-2">
          {item.status === "OPEN" || item.status === "UNDER_REVIEW" ? (
            <>
              <Button size="sm" variant="outline">
                <Check className="h-3 w-3 mr-1" />
                Resolve
              </Button>
              <Button size="sm" variant="ghost">
                <X className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Resolved</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dispute Management</h1>
        <p className="text-muted-foreground mt-1">
          Review and resolve contract disputes
        </p>
      </div>

      <DataTable
        columns={columns}
        data={demoDisputes}
        searchable
        searchKeys={["id", "raised_by", "reason"]}
        emptyMessage="No disputes found."
      />
    </div>
  );
}
