import axiosClient from '@/lib/axios';
import { type Part, type PartRequest } from '@/types/types';

export const partApi = {
  // 1. Lấy danh sách parts của 1 product
  getPartsByProductId: async (productId: string): Promise<Part[]> => {
    const { data } = await axiosClient.get(`/instock-products/${productId}/parts`);
    return data;
  },

  // 2. Lấy chi tiết 1 part (Ít xài trên UI vì list đã trả đủ data, nhưng cứ để sẵn)
  getPartById: async (productId: string, partId: string): Promise<Part> => {
    const { data } = await axiosClient.get(`/instock-products/${productId}/parts/${partId}`);
    return data;
  },

  // 3. Tạo mới part
  createPart: async (productId: string, payload: PartRequest): Promise<string> => {
    const { data } = await axiosClient.post(`/instock-products/${productId}/parts`, payload);
    return data; // Trả về ID của part mới
  },

  // 4. Cập nhật part
  updatePart: async (
    productId: string,
    partId: string,
    payload: PartRequest
  ): Promise<void> => {
    await axiosClient.put(`/instock-products/${productId}/parts/${partId}`, payload);
  },

  // 5. Xóa part
  deletePart: async (productId: string, partId: string): Promise<void> => {
    await axiosClient.delete(`/instock-products/${productId}/parts/${partId}`);
  },
};