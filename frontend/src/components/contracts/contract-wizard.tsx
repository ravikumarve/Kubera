"use client";

import { useState } from "react";
import { FormProvider, useForm, useFormContext, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      <div className="space-y-2">
        <Label htmlFor="counterpartyEmail">Counterparty Email</Label>
        <Input id="counterpartyEmail" {...register("counterpartyEmail")} />
        {errors.counterpartyEmail && (
          <p className="text-sm text-destructive">{errors.counterpartyEmail.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...register("description")}
          className="flex h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" {...register("amount", { valueAsNumber: true })} />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            {...register("currency")}
            className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
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
  const { register, control, formState: { errors } } = useFormContext<ContractFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: "milestones" });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border p-4 space-y-3">
          <div className="space-y-2">
            <Label>Milestone Title</Label>
            <Input {...register(`milestones.${index}.title`)} placeholder="e.g., Design phase" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                {...register(`milestones.${index}.amount`, { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" {...register(`milestones.${index}.dueDate`)} />
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => remove(index)}
          >
            Remove
          </Button>
        </div>
      ))}
      {errors.milestones && (
        <p className="text-sm text-destructive">{errors.milestones.message || errors.milestones.root?.message}</p>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ title: "", amount: 0, dueDate: "" })}
      >
        Add Milestone
      </Button>
    </div>
  );
}

function ReviewStep() {
  const { getValues } = useFormContext<ContractFormData>();
  const data = getValues();
  const totalAmount = data.milestones?.reduce((sum, m) => sum + (m.amount ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{data.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Counterparty:</span>
          <p>{data.counterpartyEmail}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Currency:</span>
          <p>{data.currency}</p>
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="font-medium">Milestones</h4>
        {data.milestones?.map((m, i) => (
          <div key={i} className="flex justify-between text-sm py-2 border-b last:border-0">
            <span>{m.title}</span>
            <span className="font-mono">${m.amount}</span>
          </div>
        ))}
        <div className="flex justify-between font-medium pt-2">
          <span>Total</span>
          <span className="font-mono">${totalAmount}</span>
        </div>
      </div>
    </div>
  );
}

interface ContractWizardProps {
  onSuccess?: () => void;
}

export function ContractWizard({ onSuccess }: ContractWizardProps) {
  const [step, setStep] = useState(0);
  const store = useContractWizard();
  const createContract = useCreateContract();

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      counterpartyEmail: "",
      title: "",
      description: "",
      amount: 0,
      currency: "USD",
      milestones: [],
    },
  });

  function next() {
    if (step < steps.length - 1) setStep((s) => s + 1);
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function onSubmit(data: ContractFormData) {
    store.updateContract(data as any);
    await createContract.mutateAsync(data);
    store.reset();
    onSuccess?.();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
        <StepIndicator current={step} />
        {step === 0 && <DetailsStep />}
        {step === 1 && <MilestonesStep />}
        {step === 2 && <ReviewStep />}
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={back}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" onClick={next}>
              Next
            </Button>
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

