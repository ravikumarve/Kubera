"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/shared/stats-card";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  FileText,
  DollarSign,
  AlertCircle,
} from "lucide-react";

const demoUsers = [
  { id: "1", name: "Alice Buyer", email: "alice@example.com", role: "buyer", contracts: 12, joined: "2026-01-15" },
  { id: "2", name: "Bob Seller", email: "bob@example.com", role: "seller", contracts: 8, joined: "2026-02-20" },
  { id: "3", name: "Charlie Admin", email: "charlie@example.com", role: "admin", contracts: 0, joined: "2026-01-01" },
];

export default function AdminPage() {
  const { data: session } = useSession();

  if ((session?.user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

  const userColumns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (item: typeof demoUsers[0]) => (
        <span className="font-medium">{item.name}</span>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (item: typeof demoUsers[0]) => (
        <span className="text-muted-foreground">{item.email}</span>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (item: typeof demoUsers[0]) => (
        <Badge variant={item.role === "admin" ? "default" : "secondary"}>
          {item.role}
        </Badge>
      ),
    },
    {
      key: "contracts",
      label: "Contracts",
      sortable: true,
      render: (item: typeof demoUsers[0]) => (
        <span>{item.contracts}</span>
      ),
    },
    {
      key: "joined",
      label: "Joined",
      sortable: true,
      render: (item: typeof demoUsers[0]) => (
        <span className="text-muted-foreground">
          {formatDate(item.joined)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          System overview and user management
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value="3"
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Contracts"
          value="20"
          icon={<FileText className="h-4 w-4" />}
          trend={{ direction: "up", percentage: "15%" }}
        />
        <StatsCard
          title="Total Volume"
          value={formatCurrency(150000, "USD")}
          icon={<DollarSign className="h-4 w-4" />}
          trend={{ direction: "up", percentage: "22%" }}
        />
        <StatsCard
          title="Open Disputes"
          value="2"
          icon={<AlertCircle className="h-4 w-4" />}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Users</h2>
        <DataTable
          columns={userColumns}
          data={demoUsers}
          searchable
          searchKeys={["name", "email"]}
        />
      </div>
    </div>
  );
}
