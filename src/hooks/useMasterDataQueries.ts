import { useQuery } from '@tanstack/react-query';
import { masterDataApi } from '@/services/masterDataApi';

// ─── Query Keys ───
export const masterDataKeys = {
  topics: ['master-data', 'topics'] as const,
  materials: ['master-data', 'materials'] as const,
  capabilities: ['master-data', 'capabilities'] as const,
  assemblyMethods: ['master-data', 'assembly-methods'] as const,
};

// ─── Hooks ───
export const useTopics = () => {
  return useQuery({
    queryKey: masterDataKeys.topics,
    queryFn: masterDataApi.getTopics,
    staleTime: 5 * 60 * 1000, // 5 minutes — master data changes rarely
  });
};

export const useMaterials = () => {
  return useQuery({
    queryKey: masterDataKeys.materials,
    queryFn: masterDataApi.getMaterials,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCapabilities = () => {
  return useQuery({
    queryKey: masterDataKeys.capabilities,
    queryFn: masterDataApi.getCapabilities,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAssemblyMethods = () => {
  return useQuery({
    queryKey: masterDataKeys.assemblyMethods,
    queryFn: masterDataApi.getAssemblyMethods,
    staleTime: 5 * 60 * 1000,
  });
};
