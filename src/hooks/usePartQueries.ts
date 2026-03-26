import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partApi } from '@/services/partApi';
import { type PartRequest } from '@/types/types';
import { toast } from 'sonner';

// KEY dùng để quản lý cache
export const partKeys = {
  all: ['parts'] as const,
  lists: (productId: string) => [...partKeys.all, productId] as const,
};

export const useParts = (productId: string) => {
  return useQuery({
    queryKey: partKeys.lists(productId),
    queryFn: () => partApi.getPartsByProductId(productId),
    enabled: !!productId, // Chỉ gọi API khi đã có productId
  });
};

export const useCreatePart = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PartRequest) => partApi.createPart(productId, payload),
    onSuccess: () => {
      toast.success('Part created successfully');
      // Bắn tín hiệu kêu list cập nhật lại data đi
      queryClient.invalidateQueries({ queryKey: partKeys.lists(productId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to create part');
    },
  });
};

export const useUpdatePart = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ partId, payload }: { partId: string; payload: PartRequest }) =>
      partApi.updatePart(productId, partId, payload),
    onSuccess: () => {
      toast.success('Part updated successfully');
      queryClient.invalidateQueries({ queryKey: partKeys.lists(productId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update part');
    },
  });
};

export const useDeletePart = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (partId: string) => partApi.deletePart(productId, partId),
    onSuccess: () => {
      toast.success('Part deleted successfully');
      queryClient.invalidateQueries({ queryKey: partKeys.lists(productId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to delete part');
    },
  });
};