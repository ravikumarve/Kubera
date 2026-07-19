export interface Contract {
  id: string;
  buyer_id: string;
  seller_id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  status: ContractStatus;
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
}

export type ContractStatus =
  | "DRAFT"
  | "PENDING_FUNDING"
  | "FUNDED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DISPUTED"
  | "REFUNDED"
  | "CANCELLED";

export interface Milestone {
  id: string;
  contract_id: string;
  description: string;
  percentage: number;
  amount: number;
  due_date?: string;
  status: "PENDING" | "APPROVED" | "RELEASED" | "DISPUTED";
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "seller" | "admin";
}

export interface Transaction {
  id: string;
  contract_id: string;
  amount: number;
  currency: string;
  type: "FUND" | "RELEASE" | "REFUND" | "FEE";
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  created_at: string;
}

export interface Dispute {
  id: string;
  contract_id: string;
  raised_by_id: string;
  reason: string;
  status:
    | "OPEN"
    | "UNDER_REVIEW"
    | "RESOLVED_BUYER"
    | "RESOLVED_SELLER"
    | "RESOLVED_REFUND";
}

export interface Activity {
  id: string;
  contract_id: string;
  type: string;
  description: string;
  created_at: string;
}
