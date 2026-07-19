import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useCreateDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { contract_id: string; amount: number }) =>
      api.post("/payments/create-deposit", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function usePaymentStatus(contractId: string) {
  return useQuery({
    queryKey: ["payments", contractId],
    queryFn: () => api.get(`/payments/status/${contractId}`),
    enabled: !!contractId,
  });
}
