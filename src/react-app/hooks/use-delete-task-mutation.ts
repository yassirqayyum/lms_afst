import { APIEndpoints } from "@/constants/api-endpoints";
import { QueryKeys } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${APIEndpoints.Tasks}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.Tasks] });
    },
  });
};
