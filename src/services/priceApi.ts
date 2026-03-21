import { axiosInstance } from '@/lib/axios';
import type {
  InstockPriceDto,
  PagedResult,
  CreateInstockPriceRequestDto,
  UpdateInstockPriceRequestDto,
  InstockPriceQueryConfig,
} from '@/types/types';

export const priceApi = {
  // GET /api/instock-prices
  getAllInstockPrices: async (
    params: InstockPriceQueryConfig,
  ): Promise<PagedResult<InstockPriceDto>> => {
    const response = await axiosInstance.get<PagedResult<InstockPriceDto>>(
      '/instock-prices',
      { params },
    );
    return response.data;
  },

  // GET /api/instock-prices/{id}
  getInstockPriceById: async (id: string): Promise<InstockPriceDto> => {
    const response = await axiosInstance.get<InstockPriceDto>(
      `/instock-prices/${id}`,
    );
    return response.data;
  },

  // POST /api/instock-prices
  createInstockPrice: async (
    data: CreateInstockPriceRequestDto,
  ): Promise<string> => {
    const response = await axiosInstance.post<string>('/instock-prices', data);
    return response.data;
  },

  // PUT /api/instock-prices/{id}
  updateInstockPrice: async (
    id: string,
    data: UpdateInstockPriceRequestDto,
  ): Promise<void> => {
    const response = await axiosInstance.put(`/instock-prices/${id}`, data);
    return response.data;
  },

  // PATCH /api/instock-prices/{id}/activate
  activateInstockPrice: async (id: string): Promise<void> => {
    const response = await axiosInstance.patch(`/instock-prices/${id}/activate`);
    return response.data;
  },

  // DELETE /api/instock-prices/{id} (Often used as soft delete / deactivate in this system)
  deactivateInstockPrice: async (id: string): Promise<void> => {
    const response = await axiosInstance.delete(`/instock-prices/${id}`);
    return response.data;
  },
};