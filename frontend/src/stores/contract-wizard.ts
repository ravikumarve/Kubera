import { create } from "zustand";

interface WizardState {
  step: number;
  contract: {
    title: string;
    description: string;
    sellerEmail: string;
    amount: string;
    currency: string;
    milestones: Array<{
      description: string;
      percentage: string;
      dueDate: string;
    }>;
  };
  setStep: (step: number) => void;
  updateContract: (data: Partial<WizardState["contract"]>) => void;
  reset: () => void;
}

const initialContract = {
  title: "",
  description: "",
  sellerEmail: "",
  amount: "",
  currency: "USD",
  milestones: [] as Array<{
    description: string;
    percentage: string;
    dueDate: string;
  }>,
};

export const useContractWizard = create<WizardState>((set) => ({
  step: 1,
  contract: { ...initialContract },
  setStep: (step) => set({ step }),
  updateContract: (data) =>
    set((state) => ({ contract: { ...state.contract, ...data } })),
  reset: () =>
    set({ step: 1, contract: { ...initialContract } }),
}));
