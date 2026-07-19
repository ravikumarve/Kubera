"use client";

import { useParams } from "next/navigation";
import { useContract } from "@/hooks/use-contracts";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContractTimeline } from "@/components/contracts/contract-timeline";
import { PaymentSection } from "@/components/payments/payment-section";
import { DisputeForm } from "@/components/disputes/dispute-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const statusVariant: Record<
  string,
  "default" | "success" | "warning" | "destructive" | "info" | "secondary"
> = {
  DRAFT: "secondary",
  PENDING_FUNDING: "warning",
  FUNDED: "info",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  DISPUTED: "destructive",
  REFUNDED: "default",
  CANCELLED: "secondary",
};

export default function ContractDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: contract, isLoading } = useContract(id);
  const { data: session } = useSession();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-96 rounded bg-muted" />
        <div className="h-64 rounded bg-muted" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold">Contract not found</h2>
        <p className="text-muted-foreground mt-2">
          The contract you are looking for does not exist.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/contracts">Back to Contracts</Link>
        </Button>
      </div>
    );
  }

  const isBuyer = session?.user?.id === contract.buyer_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/contracts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{contract.title}</h1>
            <Badge variant={statusVariant[contract.status] || "default"}>
              {contract.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Created {formatDate(contract.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract.description && (
                <p className="text-sm text-muted-foreground">
                  {contract.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="font-mono font-medium">
                  {formatCurrency(contract.amount, contract.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Buyer</span>
                <span className="text-sm font-medium">{contract.buyer_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Seller</span>
                <span className="text-sm font-medium">{contract.seller_id}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <ContractTimeline
                milestones={contract.milestones}
                contractId={contract.id}
                isBuyer={isBuyer}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <PaymentSection
            contractId={contract.id}
            amount={contract.amount}
            currency={contract.currency}
            status={contract.status}
            isBuyer={isBuyer}
          />

          {contract.status !== "DISPUTED" && contract.status !== "COMPLETED" && (
            <Card>
              <CardHeader>
                <CardTitle>Raise Dispute</CardTitle>
              </CardHeader>
              <CardContent>
                <DisputeForm contractId={contract.id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
