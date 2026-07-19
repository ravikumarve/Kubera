import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Dispute } from "@/types/models";

export function useDisputes(contractId: string) {
  return useQuery({
    queryKey: ["disputes", contractId],
    queryFn: () =>
      api.get<Dispute[]>(`/contracts/${contractId}/disputes`),
    enabled: !!contractId,
  });
}

export function useCreateDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { contract_id: string; reason: string }) =>
      api.post(`/contracts/${data.contract_id}/disputes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}
