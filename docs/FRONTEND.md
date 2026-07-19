# KUBERA — Frontend Architecture Guide

> **Boilerplate Status:** This document describes the frontend architecture of the KUBERA boilerplate — a production-patterned Next.js starter kit for B2B trade finance escrow.  
> **Stack:** Next.js 16 (App Router) + Tailwind CSS v4 + shadcn/ui + TypeScript strict + NextAuth.js + TanStack Query v5 + Zustand + Zod

---

## Table of Contents

1. [Tech Stack Deep Dive](#1-tech-stack-deep-dive)
2. [Project Structure](#2-project-structure)
3. [Page Architecture](#3-page-architecture)
4. [Key Components](#4-key-components)
5. [State Management](#5-state-management)
6. [API Client](#6-api-client)
7. [Forms & Validation](#7-forms--validation)
8. [Dark Mode](#8-dark-mode)
9. [Responsive Design](#9-responsive-design)
10. [Performance](#10-performance)

---

## 1. Tech Stack Deep Dive

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | RSC for marketing pages (zero JS shipped), client components for interactive dashboard. File-based routing keeps navigation declarative. |
| **Styling** | Tailwind CSS v4 + shadcn/ui | v4's CSS-first config (no `tailwind.config.js`) reduces overhead. shadcn/ui gives accessible, unstyled primitives that are copy-pasted and fully owned — no dependency lock-in. |
| **Language** | TypeScript strict | `strict: true` catches null hazards, unsound type narrowing, and implicit `any` at compile time. Critical for a payments-adjacent product. |
| **Auth** | NextAuth.js v5 (Auth.js) | Framework-native session management with JWT strategy, Google OAuth, and credentials provider. Middleware-based route protection. |
| **Server State** | TanStack Query v5 | Automatic caching, background refetching, optimistic updates for contract/milestone mutations. Pairs with Next.js Server Components via `prefetchQuery`. |
| **Client State** | Zustand | Minimal boilerplate for multi-step wizard state, sidebar toggles, and UI flags. No providers needed — stores are consumed directly. |
| **Validation** | Zod | Runtime schema validation for API responses and form inputs. Shared types with backend via OpenAPI-to-Zod codegen. |

### Why Not...

- **Redux**: Overkill. KUBERA's client state is limited to form wizards and UI toggles — Zustand's 1 KB footprint is sufficient.
- **Context API**: Fine for theme, but causes unnecessary re-renders for rapidly updating wizard state. Zustand's selector-based subscriptions avoid this.
- **SWR**: TanStack Query's richer devtools, mutation deduplication, and garbage collection make it the better choice for a data-heavy dashboard.

---

## 2. Project Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── (marketing)/              # Landing, pricing, about — all RSC
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── pricing/page.tsx
│   │   │   └── about/page.tsx
│   │   ├── (dashboard)/              # Dashboard layout with sidebar
│   │   │   ├── layout.tsx            # Sidebar + header wrapper
│   │   │   ├── page.tsx              # Dashboard home (stats, activity)
│   │   │   ├── contracts/
│   │   │   │   ├── page.tsx          # Contract list table
│   │   │   │   ├── new/page.tsx      # Multi-step wizard
│   │   │   │   └── [id]/page.tsx     # Contract detail view
│   │   │   ├── transactions/
│   │   │   │   └── page.tsx          # Transaction history
│   │   │   ├── settings/
│   │   │   │   └── page.tsx          # Profile, API keys, billing
│   │   │   └── admin/
│   │   │       ├── page.tsx          # Admin dashboard
│   │   │       └── disputes/page.tsx # Dispute management
│   │   ├── api/                      # Next.js API routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/route.ts
│   │   │   └── webhooks/
│   │   │       └── stripe/route.ts
│   │   ├── layout.tsx                # Root layout (providers, fonts)
│   │   └── globals.css               # Tailwind v4 entry point
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ...                   # ~20 more primitives
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── dashboard-layout.tsx
│   │   ├── contracts/
│   │   │   ├── contract-timeline.tsx
│   │   │   ├── milestone-card.tsx
│   │   │   ├── contract-table.tsx
│   │   │   └── contract-wizard.tsx
│   │   ├── payments/
│   │   │   ├── payment-section.tsx
│   │   │   ├── stripe-checkout.tsx
│   │   │   └── payment-status-badge.tsx
│   │   ├── disputes/
│   │   │   ├── dispute-form.tsx
│   │   │   └── dispute-badge.tsx
│   │   └── shared/
│   │       ├── stats-card.tsx
│   │       ├── data-table.tsx
│   │       └── theme-toggle.tsx
│   ├── lib/
│   │   ├── api-client.ts             # Type-safe fetch with auth + retry
│   │   ├── auth.ts                   # NextAuth config
│   │   ├── stripe.ts                 # Stripe Elements init
│   │   ├── utils.ts                  # cn(), formatCurrency, formatDate
│   │   └── validation.ts            # Shared Zod schemas
│   ├── hooks/
│   │   ├── use-contracts.ts          # TanStack Query: contract CRUD
│   │   ├── use-payments.ts           # Payment flow hooks
│   │   ├── use-disputes.ts           # Dispute hooks
│   │   └── use-media-query.ts        # Responsive breakpoint hook
│   ├── stores/
│   │   ├── contract-wizard.ts        # Zustand: multi-step form state
│   │   └── ui-store.ts               # Sidebar state, theme preference
│   ├── types/
│   │   ├── api.ts                    # API response wrappers
│   │   └── models.ts                 # Contract, Milestone, User, etc.
│   └── middleware.ts                 # NextAuth route protection
├── public/
│   ├── logo.svg
│   └── og-image.png
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── package.json
```

### Conventions

- **Colocation**: Components live next to their consuming routes under `components/<domain>/`. Only truly shared primitives go in `components/ui/`.
- **Barrel exports**: Each domain directory has an `index.ts` re-exporting public components. Internal helpers remain private.
- **Server Components by default**: Mark interactive leaves with `"use client"`. The dashboard layout shell is a Server Component — only the sidebar toggle button and theme switcher are client islands.

---

## 3. Page Architecture

### Marketing Routes `(marketing)`

| Route | Type | Description |
|---|---|---|
| `/` | RSC | Hero section, features grid, pricing tiers, FAQ accordion. Fetch pricing data at build time via ISR. |
| `/pricing` | RSC | Static pricing table. Comparison rows for Starter / Business / Enterprise. CTA links to `/register`. |
| `/about` | RSC | Static content. No data fetching. |

Marketing pages ship zero JavaScript to the browser. All interactive elements (FAQ accordion, mobile nav) use `"use client"` islands extracted to leaf components.

### Auth Routes

| Route | Type | Description |
|---|---|---|
| `/login` | Client | Email/password form + "Continue with Google" button. After login, redirect to `callbackUrl` or `/dashboard`. |
| `/register` | Client | Registration form with company name, email, password. Zod validation on all fields. |

Auth pages use NextAuth.js's `signIn` and `signOut` directly. The `callbackUrl` is passed through the URL to preserve the intended destination after login.

### Dashboard Routes `(dashboard)`

| Route | Type | Description |
|---|---|---|
| `/dashboard` | Client | Stats cards (active contracts, pending funding, total volume), recent contracts list, activity feed. |
| `/dashboard/contracts` | Client | Sortable/filterable table. Filters: status (draft/pending/active/completed/disputed), role (buyer/seller), date range. |
| `/dashboard/contracts/new` | Client | Multi-step wizard: Step 1 (details) → Step 2 (milestones) → Step 3 (review & submit). Zustand store persists across steps. |
| `/dashboard/contracts/[id]` | Client | Contract header with parties, amount, status badge. Below: timeline, milestone list, payment section (if buyer), dispute button. |
| `/dashboard/transactions` | Client | Table of all transactions tied to the user's contracts. Search by contract ID or amount. |
| `/dashboard/settings` | Client | Tabbed form: Profile (name, email, avatar), API Keys (generate/revoke), Billing (connected Stripe account status). |
| `/admin` | Client | Protected by `admin` role check in layout. User management table, all contracts view, dispute resolution panel. |

### Data Fetching Pattern

Each dashboard page follows this pattern:

```tsx
// app/(dashboard)/contracts/page.tsx
"use client";

import { useContracts } from "@/hooks/use-contracts";
import { ContractTable } from "@/components/contracts/contract-table";
import { ContractFilters } from "@/components/contracts/contract-filters";

export default function ContractsPage() {
  const { data, isLoading, error } = useContracts();

  if (isLoading) return <ContractTableSkeleton />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="space-y-6">
      <ContractFilters />
      <ContractTable contracts={data} />
    </div>
  );
}
```

---

## 4. Key Components

### ContractTimeline

Visual progress indicator showing each milestone with status, date, and amount. Used on the contract detail page.

```tsx
// components/contracts/contract-timeline.tsx
"use client";

import { cn } from "@/lib/utils";
import type { Milestone } from "@/types/models";
import { MilestoneCard } from "./milestone-card";

interface ContractTimelineProps {
  milestones: Milestone[];
  contractId: string;
  isBuyer: boolean;
}

const statusIcon = {
  pending: "○",
  funded: "◐",
  completed: "●",
  disputed: "⊗",
} as const;

export function ContractTimeline({
  milestones,
  contractId,
  isBuyer,
}: ContractTimelineProps) {
  return (
    <ol className="relative border-l-2 border-border ml-3 space-y-6">
      {milestones.map((milestone, index) => (
        <li key={milestone.id} className="ml-6">
          <span
            className={cn(
              "absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background text-sm",
              milestone.status === "completed"
                ? "border-emerald-500 text-emerald-500"
                : milestone.status === "disputed"
                  ? "border-red-500 text-red-500"
                  : "border-muted-foreground text-muted-foreground"
            )}
          >
            {statusIcon[milestone.status]}
          </span>
          <MilestoneCard
            milestone={milestone}
            contractId={contractId}
            isBuyer={isBuyer}
          />
        </li>
      ))}
    </ol>
  );
}
```

### MilestoneCard

Renders individual milestone details with action buttons. The buyer can mark a milestone as completed; the seller can only view.

```tsx
// components/contracts/milestone-card.tsx
"use client";

import { useCompleteMilestone } from "@/hooks/use-contracts";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Milestone } from "@/types/models";

interface MilestoneCardProps {
  milestone: Milestone;
  contractId: string;
  isBuyer: boolean;
}

export function MilestoneCard({
  milestone,
  contractId,
  isBuyer,
}: MilestoneCardProps) {
  const completeMutation = useCompleteMilestone(contractId);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{milestone.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {milestone.description}
          </p>
        </div>
        <span className="text-sm font-mono font-medium">
          {formatCurrency(milestone.amount, milestone.currency)}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-muted-foreground">
          Due {formatDate(milestone.dueDate)}
        </span>

        <div className="flex gap-2">
          {milestone.status === "funded" && isBuyer && (
            <Button
              size="sm"
              disabled={completeMutation.isPending}
              onClick={() => completeMutation.mutate(milestone.id)}
            >
              {completeMutation.isPending ? "Confirming..." : "Complete"}
            </Button>
          )}

          {milestone.status === "funded" && !isBuyer && (
            <span className="text-xs text-muted-foreground italic">
              Awaiting buyer confirmation
            </span>
          )}

          {milestone.status === "completed" && (
            <span className="text-xs text-emerald-500 font-medium">
              Paid on {formatDate(milestone.completedAt!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

### PaymentSection

Handles Stripe Elements integration for funding a contract. Displayed only for the buyer on the contract detail page.

```tsx
// components/payments/payment-section.tsx
"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { useCreatePaymentIntent } from "@/hooks/use-payments";
import { formatCurrency } from "@/lib/utils";

interface PaymentSectionProps {
  contractId: string;
  amount: number;
  currency: string;
  status: string;
}

function PaymentForm({ contractId, amount }: { contractId: string; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/contracts/${contractId}`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? "Processing..." : `Pay ${formatCurrency(amount, "USD")}`}
      </Button>
    </form>
  );
}

export function PaymentSection({ contractId, amount, currency, status }: PaymentSectionProps) {
  const { data: clientSecret } = useCreatePaymentIntent(contractId, amount, currency);

  if (status === "funded") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950 p-4">
        <p className="text-emerald-700 dark:text-emerald-300 font-medium">
          Contract is fully funded
        </p>
      </div>
    );
  }

  if (!clientSecret) {
    return <PaymentSectionSkeleton />;
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h3 className="font-semibold">Fund Contract</h3>
      <Elements
        stripe={getStripe()}
        options={{ clientSecret, appearance: { theme: "stripe" } }}
      >
        <PaymentForm contractId={contractId} amount={amount} />
      </Elements>
    </div>
  );
}
```

### ContractWizard

Multi-step form for creating a new contract. State persists across steps via Zustand.

```tsx
// components/contracts/contract-wizard.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormContext } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useContractWizard } from "@/stores/contract-wizard";
import { useCreateContract } from "@/hooks/use-contracts";
import { contractSchema } from "@/lib/validation";

type ContractFormData = z.infer<typeof contractSchema>;

const steps = ["Details", "Milestones", "Review"] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Contract creation progress" className="flex gap-2 mb-8">
      {steps.map((label, i) => (
        <div
          key={label}
          className={`flex items-center gap-2 text-sm ${
            i <= current ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
              i < current
                ? "bg-primary text-primary-foreground"
                : i === current
                  ? "border-2 border-primary"
                  : "border-2 border-muted"
            }`}
          >
            {i + 1}
          </span>
          {label}
          {i < steps.length - 1 && (
            <span className="w-8 h-px bg-border ml-2" />
          )}
        </div>
      ))}
    </nav>
  );
}

function DetailsStep() {
  const { register, formState: { errors } } = useFormContext<ContractFormData>();
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Counterparty Email</label>
        <input {...register("counterpartyEmail")} className="..." />
        {errors.counterpartyEmail && (
          <p className="text-sm text-red-500">{errors.counterpartyEmail.message}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Title</label>
        <input {...register("title")} className="..." />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea {...register("description")} className="..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Amount</label>
          <input type="number" {...register("amount", { valueAsNumber: true })} className="..." />
        </div>
        <div>
          <label className="text-sm font-medium">Currency</label>
          <select {...register("currency")} className="...">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function MilestonesStep() {
  const { fields, append, remove } = useFieldArray({ name: "milestones" });
  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border p-4 space-y-3">
          <input {...register(`milestones.${index}.title`)} placeholder="Milestone title" />
          <input {...register(`milestones.${index}.amount`, { valueAsNumber: true })} type="number" placeholder="Amount" />
          <Button variant="destructive" size="sm" onClick={() => remove(index)}>Remove</Button>
        </div>
      ))}
      <Button variant="outline" onClick={() => append({ title: "", amount: 0, dueDate: "" })}>
        Add Milestone
      </Button>
    </div>
  );
}

function ReviewStep() {
  const { getValues } = useFormContext<ContractFormData>();
  const data = getValues();
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">{data.title}</h3>
      <p className="text-sm text-muted-foreground">{data.description}</p>
      <div className="space-y-2">
        {data.milestones?.map((m, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{m.title}</span>
            <span className="font-mono">${m.amount}</span>
          </div>
        ))}
      </div>
      <div className="border-t pt-2 flex justify-between font-medium">
        <span>Total</span>
        <span className="font-mono">
          ${data.milestones?.reduce((sum, m) => sum + (m.amount ?? 0), 0) ?? 0}
        </span>
      </div>
    </div>
  );
}

export function ContractWizard() {
  const [step, setStep] = useState(0);
  const store = useContractWizard();
  const createContract = useCreateContract();

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: store.formData,
  });

  function next() {
    if (step < steps.length - 1) setStep((s) => s + 1);
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function onSubmit(data: ContractFormData) {
    store.setFormData(data);
    await createContract.mutateAsync(data);
    // redirect to /dashboard/contracts
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
        <StepIndicator current={step} />
        {step === 0 && <DetailsStep />}
        {step === 1 && <MilestonesStep />}
        {step === 2 && <ReviewStep />}
        <div className="flex justify-between mt-8">
          <Button type="button" variant="outline" onClick={back} disabled={step === 0}>
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" onClick={next}>Next</Button>
          ) : (
            <Button type="submit" disabled={createContract.isPending}>
              {createContract.isPending ? "Creating..." : "Create Contract"}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
```

### StatsCard

Dashboard stat display with icon, value, label, and optional trend indicator.

```tsx
// components/shared/stats-card.tsx
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: { direction: "up" | "down"; percentage: string };
}

export function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend.direction === "up" ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={cn(
              "text-sm",
              trend.direction === "up" ? "text-emerald-500" : "text-red-500"
            )}
          >
            {trend.percentage} from last month
          </span>
        </div>
      )}
    </div>
  );
}
```

### DataTable

Generic sortable, filterable table component built on shadcn/ui's Table primitives.

```tsx
// components/shared/data-table.tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  pageSize?: number;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = false,
  searchKeys,
  pageSize = 10,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = searchable && searchKeys
    ? data.filter((item) =>
        searchKeys.some((key) =>
          String(item[key]).toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filtered;

  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={col.sortable ? "cursor-pointer select-none" : ""}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key ? (
                    sortDir === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  ) : col.sortable ? (
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                  ) : null}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((item, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell key={col.key}>{col.render(item)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 5. State Management

### TanStack Query Setup

```tsx
// lib/providers.tsx (consumed by root layout)
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,        // 30s before refetch
        gcTime: 5 * 60 * 1000,       // 5min garbage collection
        retry: 2,                     // retry twice on failure
        refetchOnWindowFocus: false,  // disable for dashboard UX
      },
      mutations: {
        retry: 0,                     // don't retry mutations
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}
```

### Hook Pattern

Every domain has a dedicated hooks file that wraps TanStack Query calls with typed parameters and cache invalidation:

```tsx
// hooks/use-contracts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Contract, ContractListItem } from "@/types/models";

const contractsKeys = {
  all: ["contracts"] as const,
  list: (filters?: Record<string, string>) => ["contracts", "list", filters] as const,
  detail: (id: string) => ["contracts", id] as const,
};

export function useContracts(filters?: Record<string, string>) {
  return useQuery({
    queryKey: contractsKeys.list(filters),
    queryFn: () => api.get<ContractListItem[]>("/contracts", { params: filters }),
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: contractsKeys.detail(id),
    queryFn: () => api.get<Contract>(`/contracts/${id}`),
    enabled: !!id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContractInput) => api.post<Contract>("/contracts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractsKeys.all });
    },
  });
}

export function useCompleteMilestone(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) =>
      api.post(`/contracts/${contractId}/milestones/${milestoneId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractsKeys.detail(contractId) });
    },
  });
}
```

### Zustand Stores

```tsx
// stores/ui-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: "kubera-ui" }
  )
);
```

```tsx
// stores/contract-wizard.ts
import { create } from "zustand";

interface WizardState {
  step: number;
  formData: Partial<ContractFormData>;
  setStep: (step: number) => void;
  setFormData: (data: Partial<ContractFormData>) => void;
  reset: () => void;
}

const initialState = { step: 0, formData: {} };

export const useContractWizard = create<WizardState>()((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setFormData: (formData) => set((s) => ({ formData: { ...s.formData, ...formData } })),
  reset: () => set(initialState),
}));
```

### State Flow Diagram

```
User Action
    │
    ▼
React Component
    │
    ├──► Zustand store (UI toggle, wizard state)
    │       └── synchronous, no network
    │
    └──► TanStack Query hook
            │
            ├── cache hit  ──► render
            └── cache miss ──► api-client.ts
                                │
                                ├── attach JWT from NextAuth
                                ├── fetch from FastAPI backend
                                ├── parse Zod-validated response
                                └── return typed data
                                    │
                                    ▼
                              TanStack Query cache update
                                    │
                                    ▼
                              React re-render
```

---

## 6. API Client

The API client wraps `fetch` with auth token injection, automatic 401 retry, and consistent error parsing. It is the single entry point for all backend communication.

```tsx
// lib/api-client.ts
import { getSession, signOut } from "next-auth/react";

interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

class ApiClientError extends Error {
  constructor(public error: ApiError) {
    super(error.message);
    this.name = "ApiClientError";
  }
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  }

  private async request<T>(
    method: string,
    path: string,
    options?: { body?: unknown; params?: Record<string, string>; headers?: HeadersInit }
  ): Promise<T> {
    const session = await getSession();
    const url = new URL(`${this.baseUrl}${path}`);

    if (options?.params) {
      Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...options?.headers,
    };

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Session expired — NextAuth will try to refresh the token
        await signOut({ redirect: true, callbackUrl: "/login" });
        throw new ApiClientError({
          status: 401,
          code: "UNAUTHORIZED",
          message: "Session expired. Please sign in again.",
        });
      }

      const body = await res.json().catch(() => ({}));
      throw new ApiClientError({
        status: res.status,
        code: body.code ?? "UNKNOWN",
        message: body.message ?? `Request failed with status ${res.status}`,
        details: body.details,
      });
    }

    return res.json() as Promise<T>;
  }

  get<T>(path: string, options?: Parameters<ApiClient["request"]>[2]) {
    return this.request<T>("GET", path, options);
  }

  post<T>(path: string, body?: unknown, options?: Parameters<ApiClient["request"]>[2]) {
    return this.request<T>("POST", path, { ...options, body });
  }

  patch<T>(path: string, body?: unknown, options?: Parameters<ApiClient["request"]>[2]) {
    return this.request<T>("PATCH", path, { ...options, body });
  }

  delete<T>(path: string, options?: Parameters<ApiClient["request"]>[2]) {
    return this.request<T>("DELETE", path, options);
  }
}

export const api = new ApiClient();
```

### SSR Data Fetching

For Server Components that need initial data, use TanStack Query's `prefetchQuery` on the server:

```tsx
// app/(dashboard)/contracts/page.tsx (Server Component wrapper)
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { ContractsContent } from "./contracts-content";

export default async function ContractsPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["contracts", "list"],
    queryFn: () => api.get("/contracts"),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ContractsContent />
    </HydrationBoundary>
  );
}
```

The `ContractsContent` client component then uses `useContracts()` as usual — the data is already hydrated from the server prefetch.

---

## 7. Forms & Validation

Every form in KUBERA follows the same pattern: `react-hook-form` + `@hookform/resolvers/zod` + `zod` schema. This ensures consistent validation behavior, error display, and type safety across all forms.

### Shared Schemas

```tsx
// lib/validation.ts
import { z } from "zod";

export const contractSchema = z.object({
  counterpartyEmail: z.string().email("Invalid email address"),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10).max(5000),
  amount: z.number().positive("Amount must be positive"),
  currency: z.enum(["USD", "EUR", "GBP"]),
  milestones: z
    .array(
      z.object({
        title: z.string().min(1, "Milestone title is required"),
        amount: z.number().positive("Milestone amount must be positive"),
        dueDate: z.string().min(1, "Due date is required"),
      })
    )
    .min(1, "At least one milestone is required"),
});

export const profileSchema = z.object({
  name: z.string().min(2),
  companyName: z.string().optional(),
  email: z.string().email(),
});

export const disputeSchema = z.object({
  reason: z.string().min(20, "Please provide a detailed reason (min 20 characters)"),
  evidenceUrls: z.array(z.string().url()).optional(),
});
```

### Reusable Form Components

All shadcn/ui form components are pre-wired with react-hook-form. Example form field:

```tsx
// components/ui/form.tsx (shadcn/ui's Form)
"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form";

const Form = FormProvider;

function FormField<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({
  ...props
}: ControllerProps<TFieldValues, TName>) {
  return <Controller {...props} />;
}

function FormMessage({ name }: { name: string }) {
  const { formState: { errors } } = useFormContext();
  const error = errors[name];
  if (!error) return null;
  return (
    <p className="text-sm text-destructive mt-1">
      {error.message as string}
    </p>
  );
}

export { Form, FormField, FormMessage };
```

Usage in a settings form:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { profileSchema } from "@/lib/validation";
import type { z } from "zod";

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm({ defaultValues }: { defaultValues: ProfileFormData }) {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => console.log(data))} className="space-y-4">
        <FormField
          name="name"
          render={({ field }) => (
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input {...field} />
              <FormMessage name="name" />
            </div>
          )}
        />
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
}
```

---

## 8. Dark Mode

KUBERA uses `next-themes` for dark mode with Tailwind's `dark:` variant. The setup follows the `next-themes` recommended pattern:

```tsx
// app/layout.tsx (root layout is a Server Component wrapping a client provider)
import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

The theme toggle component:

```tsx
// components/shared/theme-toggle.tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

shadcn/ui components are designed with `dark:` variants out of the box. Custom components use Tailwind's `dark:` modifier:

```tsx
<div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
```

Tailwind v4's `@variant` directive is used in `globals.css` for any CSS-level dark overrides:

```css
/* globals.css */
@layer base {
  :root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
  }

  .dark {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
  }
}
```

---

## 9. Responsive Design

KUBERA is mobile-first. The dashboard layout collapses from a sidebar to a bottom nav on small screens.

### Dashboard Layout

```tsx
// components/layout/dashboard-layout.tsx
"use client";

import { useUIStore } from "@/stores/ui-store";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — hidden on mobile, togglable on desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => useUIStore.getState().toggleSidebar()}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Responsive Patterns

| Element | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|---|---|---|---|
| **Sidebar** | Hidden (overlay) | Collapsible | Always visible |
| **Stats cards** | 1 column | 2 columns | 4 columns |
| **Contract table** | Horizontal scroll | Full width | Full width + sticky |
| **Wizard** | Full screen | Centered card | Centered card |
| **Data table** | Horizontal scroll | Full width with pagination | Full width with pagination |

The `useMediaQuery` hook enables programmatic responsive behavior:

```tsx
// hooks/use-media-query.ts
"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Usage: const isDesktop = useMediaQuery("(min-width: 1024px)");
```

---

## 10. Performance

### Server Components (RSC)

Marketing pages are pure Server Components — zero JavaScript is shipped to the client for rendering. Only interactive islands (FAQ accordion, mobile hamburger menu) are marked with `"use client"`.

```tsx
// app/(marketing)/page.tsx — Server Component (no "use client")
import { HeroSection } from "./hero-section";       // also RSC
import { FeaturesGrid } from "./features-grid";      // also RSC
import { PricingSection } from "./pricing-section";   // also RSC
import { FaqAccordion } from "./faq-accordion";       // "use client" island

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesGrid />
      <PricingSection />
      <FaqAccordion />
    </>
  );
}
```

### Dynamic Imports

Heavy client components (Stripe Elements, data tables with large datasets) are dynamically imported so they don't block the initial bundle:

```tsx
// app/(dashboard)/contracts/[id]/page.tsx
import dynamic from "next/dynamic";

const PaymentSection = dynamic(
  () => import("@/components/payments/payment-section"),
  {
    loading: () => <PaymentSectionSkeleton />,
    ssr: false, // Stripe Elements requires browser APIs
  }
);

const DisputeForm = dynamic(
  () => import("@/components/disputes/dispute-form"),
  { loading: () => <DisputeFormSkeleton /> }
);
```

### Image Optimization

All images use `next/image` with explicit `width`, `height`, and `priority` for above-the-fold assets:

```tsx
import Image from "next/image";

export function HeroSection() {
  return (
    <section>
      <Image
        src="/hero-illustration.webp"
        alt="Escrow dashboard preview"
        width={1200}
        height={800}
        priority
        className="rounded-xl"
      />
    </section>
  );
}
```

### Bundle Analysis

| Page | JS Size (client) | Notes |
|---|---|---|
| Landing `/` | ~5 KB | Pure RSC, only FAQ island |
| Login `/login` | ~45 KB | react-hook-form, next-auth |
| Dashboard `/dashboard` | ~120 KB | TanStack Query, chart library |
| Contract Detail `/[id]` | ~160 KB | Stripe Elements adds ~80 KB |
| Settings `/settings` | ~55 KB | Form-heavy, no heavy deps |

### Additional Optimizations

- **Route prefetching**: Next.js automatically prefetches visible links in the viewport. Dashboard links prefetch on hover.
- **Font loading**: Inter and JetBrains Mono loaded via `next/font` with `display: swap` and subsetting.
- **CSS**: Tailwind v4 generates only the CSS utilities used in the source — zero unused styles in production.
- **Edge runtime**: API routes use the Edge Runtime for auth callbacks (fast cold start, global distribution).

---

> **Next:** After customizing the frontend, refer to [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel deployment configuration and environment variable setup.
