"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreateDispute } from "@/hooks/use-disputes";

interface DisputeFormProps {
  contractId: string;
  onSuccess?: () => void;
}

export function DisputeForm({ contractId, onSuccess }: DisputeFormProps) {
  const [reason, setReason] = useState("");
  const createDispute = useCreateDispute();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    await createDispute.mutateAsync({ contract_id: contractId, reason });
    setReason("");
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="reason" className="text-sm font-medium">
          Reason for Dispute
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe the issue in detail..."
          className="flex min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          required
        />
      </div>
      <Button
        type="submit"
        variant="destructive"
        disabled={createDispute.isPending || !reason.trim()}
      >
        {createDispute.isPending ? "Submitting..." : "Raise Dispute"}
      </Button>
    </form>
  );
}
