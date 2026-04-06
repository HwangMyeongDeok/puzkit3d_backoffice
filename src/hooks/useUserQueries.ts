import { userApi } from "@/services/userApi";
import { useQuery } from "@tanstack/react-query";

export const useGetUserById = (id?: string) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => userApi.getUserById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, 
  });
};