// File: src/hooks/useInventoryMutations.ts (hoặc file chứa code này của bạn)
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/services/inventoryApi";
import { toast } from "sonner";
import { handleErrorToast } from "@/lib/error-handler"; // Đảm bảo đường dẫn này đúng với file chứa extractErrorMessage của bạn

export const useCreateInventory = () => {
  const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ productId, variantId, quantity }: { productId: string; variantId: string; quantity: number }) =>
        inventoryApi.createVariantInventory(productId, variantId, quantity),

      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["variants-inventory", variables.productId] });
        toast.success("Inventory initialized successfully!");
      },
      onError: (error: any) => {
        // Bỏ qua lỗi 409 (Conflict) nếu đã xử lý riêng, còn lại in lỗi từ BE ra
        if (error.response?.status !== 409) {
          handleErrorToast(error, "Failed to initialize inventory.");
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
      toast.success("Inventory quantity updated successfully.");
    },
    onError: (error: any) => {
      handleErrorToast(error, "Failed to update inventory.");
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
      toast.success("Inventory reset to 0 successfully.");
    },
    onError: (error: any) => {
      handleErrorToast(error, "Failed to reset inventory.");
    },
  });
};