import { useQuery } from "@tanstack/react-query";
import type { InstockProductVariantDto } from "@/types/types"; 
import { inventoryApi } from "@/services/inventoryApi";

export interface VariantWithInventory extends InstockProductVariantDto {
  stockQuantity: number | undefined; // Cho phép undefined để biết là chưa có bản ghi
  hasNoInventory: boolean;
}

export const useVariantsWithInventory = (
  productId: string,
  isExpanded: boolean
) => {
  return useQuery<VariantWithInventory[]>({
    queryKey: ["variants-inventory", productId],
    enabled: !!productId && isExpanded,
    queryFn: async () => {
      let variants: InstockProductVariantDto[] = [];
      
      // Wrap variants fetch in try-catch to handle API errors gracefully
      try {
        variants = await inventoryApi.getAllInstockProductVariantsByProductId(
          productId
        );
      } catch (error: any) {
        // If variants fetch fails, return empty array instead of failing entire query
        console.error("Failed to fetch variants:", error);
        return [];
      }

      const variantsWithStockPromises = (variants || []).map(
        async (variant): Promise<VariantWithInventory> => {
          try {
            const inventoryData = await inventoryApi.getVariantInventoryApi(
              productId,
              variant.id
            );
            return { 
              ...variant, 
              stockQuantity: inventoryData.totalQuantity, 
              hasNoInventory: false 
            };
          } catch (error: any) {
            // Nếu lỗi 404 là do chưa tạo bản ghi kho bao giờ
            if (error.response?.status === 404) {
              return { 
                ...variant, 
                stockQuantity: undefined, 
                hasNoInventory: true 
              };
            }
            // Các lỗi khác (500, mạng...) thì coi như bằng 0
            return { 
              ...variant, 
              stockQuantity: 0, 
              hasNoInventory: false 
            };
          }
        }
      );

      return Promise.all(variantsWithStockPromises);
    },
    staleTime: 60 * 1000,
  });
};