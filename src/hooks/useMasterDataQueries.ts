// src/hooks/useMasterData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataApi } from '@/services/masterDataApi';
import { toast } from 'sonner';
import type { AssemblyMethod, Capability, Drive, Material, Topic } from '@/types/types';

export const masterDataKeys = {
  topics: ['master-data', 'topics'] as const,
  materials: ['master-data', 'materials'] as const,
  capabilities: ['master-data', 'capabilities'] as const,
  assemblyMethods: ['master-data', 'assembly-methods'] as const,
  drives: ['master-data', 'drives'] as const,
};

// ─── QUERIES ───
export const useTopics = () => useQuery({ queryKey: masterDataKeys.topics, queryFn: masterDataApi.getTopics, staleTime: 5 * 60 * 1000 });
export const useMaterials = () => useQuery({ queryKey: masterDataKeys.materials, queryFn: masterDataApi.getMaterials, staleTime: 5 * 60 * 1000 });
export const useCapabilities = () => useQuery({ queryKey: masterDataKeys.capabilities, queryFn: masterDataApi.getCapabilities, staleTime: 5 * 60 * 1000 });
export const useAssemblyMethods = () => useQuery({ queryKey: masterDataKeys.assemblyMethods, queryFn: masterDataApi.getAssemblyMethods, staleTime: 5 * 60 * 1000 });
export const useDrives = () => useQuery({ queryKey: masterDataKeys.drives, queryFn: masterDataApi.getDrives, staleTime: 5 * 60 * 1000 });

// ─── MUTATIONS (TOPICS) ───
export const useCreateTopic = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: masterDataApi.createTopic, onSuccess: () => { toast.success('Topic created'); qc.invalidateQueries({ queryKey: masterDataKeys.topics }); }});
};
export const useUpdateTopic = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string, data: Partial<Topic> }) => masterDataApi.updateTopic(id, data), onSuccess: () => { toast.success('Topic updated'); qc.invalidateQueries({ queryKey: masterDataKeys.topics }); }});
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
  return useMutation({ mutationFn: ({ id, data }: { id: string, data: Partial<Material> }) => masterDataApi.updateMaterial(id, data), onSuccess: () => { toast.success('Material updated'); qc.invalidateQueries({ queryKey: masterDataKeys.materials }); }});
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
  return useMutation({ mutationFn: ({ id, data }: { id: string, data: Partial<Capability> }) => masterDataApi.updateCapability(id, data), onSuccess: () => { toast.success('Capability updated'); qc.invalidateQueries({ queryKey: masterDataKeys.capabilities }); }});
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
  return useMutation({ mutationFn: ({ id, data }: { id: string, data: Partial<AssemblyMethod> }) => masterDataApi.updateAssemblyMethod(id, data), onSuccess: () => { toast.success('Assembly Method updated'); qc.invalidateQueries({ queryKey: masterDataKeys.assemblyMethods }); }});
};
export const useDeleteAssemblyMethod = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: masterDataApi.deleteAssemblyMethod, onSuccess: () => { toast.success('Assembly Method deleted'); qc.invalidateQueries({ queryKey: masterDataKeys.assemblyMethods }); }});
};

// ─── MUTATIONS (DRIVES) ───
export const useCreateDrive = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: masterDataApi.createDrive, onSuccess: () => { toast.success('Drive created'); qc.invalidateQueries({ queryKey: masterDataKeys.drives }); }});
};
export const useUpdateDrive = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string, data: Partial<Drive> }) => masterDataApi.updateDrive(id, data), onSuccess: () => { toast.success('Drive updated'); qc.invalidateQueries({ queryKey: masterDataKeys.drives }); }});
};
export const useDeleteDrive = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: masterDataApi.deleteDrive, onSuccess: () => { toast.success('Drive deleted'); qc.invalidateQueries({ queryKey: masterDataKeys.drives }); }});
};