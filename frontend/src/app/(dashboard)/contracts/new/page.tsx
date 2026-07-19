"use client";

import { useRouter } from "next/navigation";
import { ContractWizard } from "@/components/contracts/contract-wizard";

export default function NewContractPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Contract</h1>
        <p className="text-muted-foreground mt-1">
          Set up a new escrow contract with milestones
        </p>
      </div>

      <ContractWizard onSuccess={() => router.push("/dashboard/contracts")} />
    </div>
  );
}
