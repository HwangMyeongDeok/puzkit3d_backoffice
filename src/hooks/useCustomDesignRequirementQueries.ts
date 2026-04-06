import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type UpsertRequirementPayload } from "@/types/types";
import { requirementApi } from "@/services/customDesignRequirementApi";

export const useRequirements = () => {
  const queryClient = useQueryClient();

  // Hook lấy danh sách
  const useGetAllRequirements = () => {
    return useQuery({
      queryKey: ["requirements"],
      queryFn: requirementApi.getAll,
    });
  };

  // Hook tạo mới
  const useCreateRequirement = () => {
    return useMutation({
      mutationFn: (payload: UpsertRequirementPayload) => requirementApi.create(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["requirements"] });
      },
    });
  };

  const useGetRequirementById = (id: string) => {
    return useQuery({
      queryKey: ["requirement", id],
      queryFn: () => requirementApi.getById(id),
    });
  };


  // Hook cập nhật
  const useUpdateRequirement = () => {
    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpsertRequirementPayload }) =>
        requirementApi.update(id, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["requirements"] });
      },
    });
  };

  // Hook xóa
  const useDeleteRequirement = () => {
    return useMutation({
      mutationFn: (id: string) => requirementApi.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["requirements"] });
      },
    });
  };

  return {
    useGetAllRequirements,
    useCreateRequirement,
    useUpdateRequirement,
    useDeleteRequirement,
    useGetRequirementById,
  };
};