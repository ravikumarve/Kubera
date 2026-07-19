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
  reason: z
    .string()
    .min(20, "Please provide a detailed reason (min 20 characters)"),
  evidenceUrls: z.array(z.string().url()).optional(),
});
