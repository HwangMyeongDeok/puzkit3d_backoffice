import axiosInstance from "@/lib/axios";
import type { CustomDesignRequirement, UpsertRequirementPayload } from "@/types/types";

export const requirementApi = {
  // Lấy tất cả (Staff/Manager)
  getAll: async (): Promise<CustomDesignRequirement[]> => {
    const { data } = await axiosInstance.get<CustomDesignRequirement[]>("/custom-design-requirements");
    return data;
  },

  // Lấy chi tiết theo ID
  getById: async (id: string): Promise<CustomDesignRequirement> => {
    const { data } = await axiosInstance.get<CustomDesignRequirement>(`/custom-design-requirements/${id}`);
    return data;
  },

  // Tạo mới
  create: async (payload: UpsertRequirementPayload): Promise<string> => {
    const { data } = await axiosInstance.post<string>("/custom-design-requirements", payload);
    return data;
  },

  // Cập nhật
  update: async (id: string, payload: UpsertRequirementPayload): Promise<void> => {
    await axiosInstance.put(`/custom-design-requirements/${id}`, payload);
  },

  // Xóa
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/custom-design-requirements/${id}`);
  }
};