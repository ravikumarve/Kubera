"use client";

import Link from "next/link";
import { useContracts } from "@/hooks/use-contracts";
import { ContractTable } from "@/components/contracts/contract-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ContractsPage() {
  const { data: contracts, isLoading } = useContracts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contracts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your escrow contracts
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/contracts/new">
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Link>
        </Button>
      </div>

      <ContractTable contracts={contracts ?? []} isLoading={isLoading} />
    </div>
  );
}
