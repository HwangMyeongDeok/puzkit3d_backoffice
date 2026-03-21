import { axiosInstance } from '@/lib/axios';
import type {
  InstockPriceDetailDto,
  CreateInstockPriceDetailRequestDto,
  UpdateInstockPriceDetailRequestDto,
  PagedResult,
} from '@/types/types';

export const priceDetailApi = {
  // GET /api/instock-price-details/variant/{variantId}
  getPriceDetailsByVariantId: async (
    variantId: string,
  ): Promise<InstockPriceDetailDto[]> => {
    const response = await axiosInstance.get<InstockPriceDetailDto[]>(
      `/instock-price-details/variant/${variantId}`,
    );
    return response.data;
  },

  // GET /api/instock-price-details/price/{priceId}
  getPriceDetailsByPriceId: async (
    priceId: string,
    pageNumber: number = 1,
    pageSize: number = 10,
  ): Promise<PagedResult<InstockPriceDetailDto>> => {
    const response = await axiosInstance.get<PagedResult<InstockPriceDetailDto>>(
      `/instock-price-details/price/${priceId}`,
      { params: { pageNumber, pageSize } },
    );
    return response.data;
  },

  // POST /api/instock-price-details
  createPriceDetail: async (
    data: CreateInstockPriceDetailRequestDto,
  ): Promise<string> => {
    const response = await axiosInstance.post<string>(
      '/instock-price-details',
      data,
    );
    return response.data;
  },

  // PUT /api/instock-price-details/{id}
  updatePriceDetail: async (
    id: string,
    data: UpdateInstockPriceDetailRequestDto,
  ): Promise<void> => {
    const response = await axiosInstance.put(
      `/instock-price-details/${id}`,
      data,
    );
    return response.data;
  },

  // DELETE /api/instock-price-details/{id}
  deletePriceDetail: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/instock-price-details/${id}`);
  },
};
