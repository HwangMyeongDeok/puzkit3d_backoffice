import { axiosInstance } from '@/lib/axios';
import type { AssemblyMethod, Capability, Material, Topic } from '@/types/types';

interface ItemsEnvelope<T> {
  items: T[];
}

type ApiResponse<T> = T[] | ItemsEnvelope<T>;

const extractItems = <T,>(response: ApiResponse<T>): T[] => {
  return Array.isArray(response)
    ? response
    : 'items' in response ? response.items : [];
};

export const masterDataApi = {
  // GET /api/topics
  getTopics: async (): Promise<Topic[]> => {
    const response = await axiosInstance.get<ApiResponse<Topic>>('/topics', {
      params: { pageNumber: 1, pageSize: 100 }
    });
    return extractItems(response.data);
  },

  // GET /api/materials
  getMaterials: async (): Promise<Material[]> => {
    const response = await axiosInstance.get<ApiResponse<Material>>('/materials', {
      params: { pageNumber: 1, pageSize: 100 }
    });
    return extractItems(response.data);
  },

  // GET /api/capabilities
  getCapabilities: async (): Promise<Capability[]> => {
    const response = await axiosInstance.get<ApiResponse<Capability>>('/capabilities', {
      params: { pageNumber: 1, pageSize: 100 }
    });
    return extractItems(response.data);
  },

  // GET /api/assembly-methods
  getAssemblyMethods: async (): Promise<AssemblyMethod[]> => {
    const response = await axiosInstance.get<ApiResponse<AssemblyMethod>>('/assembly-methods', {
      params: { pageNumber: 1, pageSize: 100 }
    });
    return extractItems(response.data);
  },
};