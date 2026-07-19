"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "./payment-status-badge";

interface PaymentSectionProps {
  contractId: string;
  amount: number;
  currency: string;
  status: string;
  isBuyer: boolean;
  paymentHistory?: Array<{
    id: string;
    amount: number;
    type: string;
    status: string;
    created_at: string;
  }>;
}

export function PaymentSection({
  contractId,
  amount,
  currency,
  status,
  isBuyer,
  paymentHistory,
}: PaymentSectionProps) {
  const needsFunding = status === "PENDING_FUNDING" || status === "DRAFT";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <PaymentStatusBadge status={status} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Amount</span>
          <span className="font-mono font-medium">
            {formatCurrency(amount, currency)}
          </span>
        </div>

        {needsFunding && isBuyer && (
          <Button className="w-full" asChild>
            <a
              href={`/api/checkout?contract_id=${contractId}`}
            >
              Deposit Funds
            </a>
          </Button>
        )}

        {paymentHistory && paymentHistory.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-medium">Payment History</h4>
            {paymentHistory.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {payment.type === "FUND" ? "Deposit" : payment.type}
                </span>
                <span className="font-mono">
                  {formatCurrency(payment.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
