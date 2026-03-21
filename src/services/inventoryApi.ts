import { axiosInstance } from "@/lib/axios";
import type { InstockProductVariantDto } from "@/types/types";

interface InventoryResponse {
  id: string;
  instockProductVariantId: string;
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export const inventoryApi = { 
    getVariantInventoryApi: async (
  productId: string,
  variantId: string
): Promise<InventoryResponse> => {
  const res = await axiosInstance.get<InventoryResponse>(
    `/instock-products/${productId}/variants/${variantId}/inventory`
  );
  return res.data;
  },
  
  createVariantInventory: async (productId: string, variantId: string, quantity: number) => {
    return await axiosInstance.post(
      `/instock-products/${productId}/variants/${variantId}/inventory`,
      { quantity }
    );
  },

  /** PUT: Cập nhật số lượng kho (Tự động tạo nếu chưa có - NÊN DÙNG CÁI NÀY) */
  updateVariantInventory: async (productId: string, variantId: string, quantity: number) => {
    return await axiosInstance.put(
      `/instock-products/${productId}/variants/${variantId}/inventory`,
      { quantity }
    );
  },

  /** DELETE: Đưa số lượng kho về 0 */
  resetVariantInventory: async (productId: string, variantId: string) => {
    return await axiosInstance.delete(
      `/instock-products/${productId}/variants/${variantId}/inventory`
    );
  },

  getAllInstockProductVariantsByProductId: async (
    productId: string
  ): Promise<InstockProductVariantDto[]> => {
    const response = await axiosInstance.get<{ variants: InstockProductVariantDto[] }>(
      `/instock-products/${productId}/variants`
    );
    return response.data.variants;
  },
}