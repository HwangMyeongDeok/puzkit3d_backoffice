// src/hooks/useMasterData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '@/services/masterDataApi';
import { toast } from 'sonner';

export const masterDataKeys = {
  topics: ['master-data', 'topics'] as const,
  materials: ['master-data', 'materials'] as const,
  capabilities: ['master-data', 'capabilities'] as const,
  assemblyMethods: ['master-data', 'assembly-methods'] as const,
};

// ─── QUERIES (Ông đã viết) ───
export const useTopics = () => useQuery({ queryKey: masterDataKeys.topics, queryFn: masterDataApi.getTopics, staleTime: 5 * 60 * 1000 });
export const useMaterials = () => useQuery({ queryKey: masterDataKeys.materials, queryFn: masterDataApi.getMaterials, staleTime: 5 * 60 * 1000 });
export const useCapabilities = () => useQuery({ queryKey: masterDataKeys.capabilities, queryFn: masterDataApi.getCapabilities, staleTime: 5 * 60 * 1000 });
export const useAssemblyMethods = () => useQuery({ queryKey: masterDataKeys.assemblyMethods, queryFn: masterDataApi.getAssemblyMethods, staleTime: 5 * 60 * 1000 });

// ─── MUTATIONS (TOPICS) ───
export const useCreateTopic = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: masterDataApi.createTopic, onSuccess: () => { toast.success('Topic created'); qc.invalidateQueries({ queryKey: masterDataKeys.topics }); }});
};
export const useUpdateTopic = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string, data: any }) => masterDataApi.updateTopic(id, data), onSuccess: () => { toast.success('Topic updated'); qc.invalidateQueries({ queryKey: masterDataKeys.topics }); }});
};
export const useDeleteTopic = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: masterDataApi.deleteTopic, onSuccess: () => { toast.success('Topic deleted'); qc.invalidateQueries({ queryKey: masterDataKeys.topics }); }});
};

// ─── MUTATIONS (MATERIALS) ───
export const useCreateMaterial = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: masterDataApi.createMaterial, onSuccess: () => { toast.success('Material created'); qc.invalidateQueries({ queryKey: masterDataKeys.materials }); }});
};
export const useUpdateMaterial = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string, data: any }) => masterDataApi.updateMaterial(id, data), onSuccess: () => { toast.success('Material updated'); qc.invalidateQueries({ queryKey: masterDataKeys.materials }); }});
};
export const useDeleteMaterial = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: masterDataApi.deleteMaterial, onSuccess: () => { toast.success('Material deleted'); qc.invalidateQueries({ queryKey: masterDataKeys.materials }); }});
};

// ─── MUTATIONS (CAPABILITIES) ───
export const useCreateCapability = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: masterDataApi.createCapability, onSuccess: () => { toast.success('Capability created'); qc.invalidateQueries({ queryKey: masterDataKeys.capabilities }); }});
};
export const useUpdateCapability = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string, data: any }) => masterDataApi.updateCapability(id, data), onSuccess: () => { toast.success('Capability updated'); qc.invalidateQueries({ queryKey: masterDataKeys.capabilities }); }});
};
export const useDeleteCapability = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: masterDataApi.deleteCapability, onSuccess: () => { toast.success('Capability deleted'); qc.invalidateQueries({ queryKey: masterDataKeys.capabilities }); }});
};

// ─── MUTATIONS (ASSEMBLY METHODS) ───
export const useCreateAssemblyMethod = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: masterDataApi.createAssemblyMethod, onSuccess: () => { toast.success('Assembly Method created'); qc.invalidateQueries({ queryKey: masterDataKeys.assemblyMethods }); }});
};
export const useUpdateAssemblyMethod = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string, data: any }) => masterDataApi.updateAssemblyMethod(id, data), onSuccess: () => { toast.success('Assembly Method updated'); qc.invalidateQueries({ queryKey: masterDataKeys.assemblyMethods }); }});
};
export const useDeleteAssemblyMethod = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: masterDataApi.deleteAssemblyMethod, onSuccess: () => { toast.success('Assembly Method deleted'); qc.invalidateQueries({ queryKey: masterDataKeys.assemblyMethods }); }});
};