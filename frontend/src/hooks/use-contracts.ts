import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Contract } from "@/types/models";

export function useContracts() {
  return useQuery({
    queryKey: ["contracts"],
    queryFn: () => api.get<Contract[]>("/contracts"),
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: ["contracts", id],
    queryFn: () => api.get<Contract>(`/contracts/${id}`),
    enabled: !!id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Contract>) =>
      api.post<Contract>("/contracts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}

export function useApproveMilestone(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) =>
      api.post(`/contracts/${contractId}/milestones/${milestoneId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", contractId] });
    },
  });
}
