import axiosInstance from "@/lib/axios";
import type { CustomDesignRequest, GetRequestsParams, PagedResult, UpdateCustomDesignRequestPayload } from "@/types/types";

export const customDesignRequestApi = {
  // Lấy danh sách
  getRequests: async (params: GetRequestsParams) => {
const { data } = await axiosInstance.get<PagedResult<CustomDesignRequest>>(
      "/custom-design-requests", 
      { params }
    );    return data;
  },

  // Lấy chi tiết
  getRequestById: async (id: string) => {
const { data } = await axiosInstance.get<CustomDesignRequest>(`/custom-design-requests/${id}`);    
return data;
  },

  // Cập nhật (PUT)
  updateRequest: async (id: string, payload: UpdateCustomDesignRequestPayload) => {
    const { data } = await axiosInstance.put<CustomDesignRequest>(`/custom-design-requests/${id}`, payload);
    return data;
  },
};