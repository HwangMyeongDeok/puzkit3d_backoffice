// src/services/masterDataApi.ts
import { axiosInstance } from '@/lib/axios';
import type { AssemblyMethod, Capability, Material, Topic, Drive } from '@/types/types';

interface ItemsEnvelope<T> {
  items: T[];
}

type ApiResponse<T> = T[] | ItemsEnvelope<T>;

const extractItems = <T,>(response: ApiResponse<T>): T[] => {
  return Array.isArray(response) ? response : 'items' in response ? response.items : [];
};

export const masterDataApi = {
  // ─── TOPICS ───
  getTopics: async (): Promise<Topic[]> => {
    const response = await axiosInstance.get<ApiResponse<Topic>>('/topics', { params: { pageNumber: 1, pageSize: 100, ascending: true } });
    return extractItems(response.data);
  },
  createTopic: async (data: Partial<Topic>) => axiosInstance.post('/topics', data),
  updateTopic: async (id: string, data: Partial<Topic>) => axiosInstance.put(`/topics/${id}`, data),
  deleteTopic: async (id: string) => axiosInstance.delete(`/topics/${id}`),

  // ─── MATERIALS ───
  getMaterials: async (): Promise<Material[]> => {
    const response = await axiosInstance.get<ApiResponse<Material>>('/materials', { params: { pageNumber: 1, pageSize: 100, ascending: true } });
    return extractItems(response.data);
  },
  createMaterial: async (data: Partial<Material>) => axiosInstance.post('/materials', data),
  updateMaterial: async (id: string, data: Partial<Material>) => axiosInstance.put(`/materials/${id}`, data),
  deleteMaterial: async (id: string) => axiosInstance.delete(`/materials/${id}`),

  // ─── CAPABILITIES ───
  getCapabilities: async (): Promise<Capability[]> => {
    const response = await axiosInstance.get<ApiResponse<Capability>>('/capabilities', { params: { pageNumber: 1, pageSize: 100, ascending: true } });
    return extractItems(response.data);
  },
  createCapability: async (data: Partial<Capability>) => axiosInstance.post('/capabilities', data),
  updateCapability: async (id: string, data: Partial<Capability>) => axiosInstance.put(`/capabilities/${id}`, data),
  deleteCapability: async (id: string) => axiosInstance.delete(`/capabilities/${id}`),

  // ─── ASSEMBLY METHODS ───
  getAssemblyMethods: async (): Promise<AssemblyMethod[]> => {
    const response = await axiosInstance.get<ApiResponse<AssemblyMethod>>('/assembly-methods', { params: { pageNumber: 1, pageSize: 100, ascending: true } });
    return extractItems(response.data);
  },
  createAssemblyMethod: async (data: Partial<AssemblyMethod>) => axiosInstance.post('/assembly-methods', data),
  updateAssemblyMethod: async (id: string, data: Partial<AssemblyMethod>) => axiosInstance.put(`/assembly-methods/${id}`, data),
  deleteAssemblyMethod: async (id: string) => axiosInstance.delete(`/assembly-methods/${id}`),

  // ─── DRIVES ───
  getDrives: async (): Promise<Drive[]> => {
    const response = await axiosInstance.get<ApiResponse<Drive>>('/drives', { params: { pageNumber: 1, pageSize: 100, ascending: true } });
    return extractItems(response.data);
  },
  createDrive: async (data: Partial<Drive>) => axiosInstance.post('/drives', data),
  updateDrive: async (id: string, data: Partial<Drive>) => axiosInstance.put(`/drives/${id}`, data),
  deleteDrive: async (id: string) => axiosInstance.delete(`/drives/${id}`),
};