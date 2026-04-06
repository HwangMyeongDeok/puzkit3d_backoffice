import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/services/inventoryApi";
import { toast } from "sonner";

export const useCreateInventory = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      inventoryApi.createVariantInventory(productId, variantId, quantity),
    onSuccess: () => {
      // Refresh lại danh sách variant và kho sau khi tạo
      queryClient.invalidateQueries({ queryKey: ["variants-inventory", productId] });
      toast.success("Đã khởi tạo kho thành công!");
    },
    onError: (error: any) => {
      // Chỉ toast nếu không phải lỗi 409 (vì 409 mình xử lý fallback ở Dialog rồi)
      if (error.response?.status !== 409) {
        toast.error("Không thể khởi tạo kho.");
      }
    },
  });
};

export const useUpdateInventory = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      inventoryApi.updateVariantInventory(productId, variantId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variants-inventory", productId] });
      toast.success("Đã cập nhật số lượng tồn kho.");
    },
    onError: () => {
      toast.error("Cập nhật kho thất bại.");
    },
  });
};

export const useResetInventory = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId }: { variantId: string }) =>
      inventoryApi.resetVariantInventory(productId, variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variants-inventory", productId] });
      toast.success("Đã reset tồn kho về 0.");
    },
    onError: () => {
      toast.error("Không thể reset tồn kho.");
    },
  });
};