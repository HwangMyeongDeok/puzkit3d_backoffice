import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as catalogApi from '@/services/catalogApi';
import { toast } from 'sonner';

export const catalogKeys = {
  all: ['catalog'] as const,
  resource: (resource: string) => [...catalogKeys.all, resource] as const,
  list: (resource: string, params: any) => [...catalogKeys.resource(resource), 'list', params] as const,
  // Keys cho phần ràng buộc (Assignments)
  capabilityAssignments: (capabilityId: string) => [...catalogKeys.all, 'capability-assignments', capabilityId] as const,
  assemblyMethodAssignments: (assemblyId: string) => [...catalogKeys.all, 'assembly-method-assignments', assemblyId] as const,
  capabilityDriveAssignments: (capabilityId: string) => [...catalogKeys.all, 'capability-drives', capabilityId] as const,
  activeDrivesByCapabilities: (capabilityIds: string[]) => 
    [...catalogKeys.all, 'active-drives-by-capabilities', [...capabilityIds].sort().join(',')] as const,
  filteredCapabilities: (topicId: string, materialId: string) => 
    [...catalogKeys.all, 'filtered-capabilities', topicId, materialId] as const,
  filteredAssemblyMethods: (capabilityId: string, materialId: string) => 
    [...catalogKeys.all, 'filtered-assembly-methods', capabilityId, materialId] as const,
};

// ─── QUERIES (Lấy danh sách Catalog) ───

// Hook dùng chung cho Materials, Capabilities, Assembly Methods
export const useCatalogList = (
  resource: any,
  pageNumber = 1,
  pageSize = 8,
  searchTerm = '',
  isActive?: boolean,
  ascending = true
) =>
  useQuery({
    queryKey: catalogKeys.list(resource, { pageNumber, pageSize, searchTerm, isActive, ascending }),
    queryFn: () => catalogApi.getCatalogList(resource, pageNumber, pageSize, ascending, searchTerm, isActive),
    staleTime: 5 * 60 * 1000,
  });

// Hook riêng cho Topics
export const useTopics = (
  pageNumber = 1,
  pageSize = 8,
  searchTerm = '',
  isActive?: boolean,
  ascending = true
) =>
  useQuery({
    queryKey: catalogKeys.list('topics', { pageNumber, pageSize, searchTerm, isActive, ascending }),
    queryFn: () => catalogApi.getTopics(pageNumber, pageSize, ascending, searchTerm, isActive),
    staleTime: 5 * 60 * 1000,
  });

// Hook lấy All Topics (thường dùng cho dropdown/select)
export const useAllTopics = (isActive = true) =>
  useQuery({
    queryKey: [...catalogKeys.resource('topics'), 'all', { isActive }],
    queryFn: () => catalogApi.getAllTopics(isActive),
  });

// --- Thêm Hook riêng cho Drives ---
export const useDrives = (
  pageNumber = 1,
  pageSize = 8,
  searchTerm = '',
  isActive?: boolean,
  ascending = true
) =>
  useQuery({
    queryKey: catalogKeys.list('drives', { pageNumber, pageSize, searchTerm, isActive, ascending }),
    queryFn: () => catalogApi.getDrives(pageNumber, pageSize, searchTerm, isActive, ascending),
    staleTime: 5 * 60 * 1000,
  });

// ─── QUERIES (Ràng buộc - Assignments) ───

export const useAssignedTopicMaterials = (capabilityId: string) =>
  useQuery({
    queryKey: catalogKeys.capabilityAssignments(capabilityId),
    queryFn: () => catalogApi.getAssignedTopicMaterialsForCapability(capabilityId),
    enabled: !!capabilityId,
  });

export const useAssignedCapabilityMaterials = (assemblyMethodId: string) =>
  useQuery({
    queryKey: catalogKeys.assemblyMethodAssignments(assemblyMethodId),
    queryFn: () => catalogApi.getAssignedCapabilityMaterialsForAssembly(assemblyMethodId),
    enabled: !!assemblyMethodId,
  });

// ─── MUTATIONS (CRUD Cơ bản) ───

export const useCreateCatalogItem = (resource: any) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => catalogApi.createCatalogItem(resource, payload),
    onSuccess: () => {
      toast.success(`${resource} created successfully`);
      qc.invalidateQueries({ queryKey: catalogKeys.resource(resource) });
    },
  });
};

export const useUpdateCatalogItem = (resource: any) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      catalogApi.updateCatalogItem(resource, id, payload),
    onSuccess: () => {
      toast.success(`${resource} updated successfully`);
      qc.invalidateQueries({ queryKey: catalogKeys.resource(resource) });
    },
  });
};

export const useDeleteCatalogItem = (resource: any) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogApi.deleteCatalogItem(resource, id),
    onSuccess: () => {
      toast.success(`${resource} deleted successfully`);
      qc.invalidateQueries({ queryKey: catalogKeys.resource(resource) });
    },
  });
};

// Mutations riêng cho Topic
export const useCreateTopic = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: catalogApi.createTopic,
    onSuccess: () => {
      toast.success('Topic created');
      qc.invalidateQueries({ queryKey: catalogKeys.resource('topics') });
    },
  });
};

// ─── MUTATIONS (Gắn ràng buộc - Assignments) ───

export const useAssignTopicMaterialToCapability = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ capabilityId, payload }: { capabilityId: string; payload: any }) =>
      catalogApi.assignTopicMaterialToCapability(capabilityId, payload),
    onSuccess: (_, variables) => {
      toast.success('Assigned successfully');
      qc.invalidateQueries({ queryKey: catalogKeys.capabilityAssignments(variables.capabilityId) });
    },
  });
};

export const useAssignCapabilityMaterialToAssembly = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assemblyMethodId, payload }: { assemblyMethodId: string; payload: any }) =>
      catalogApi.assignCapabilityMaterialToAssembly(assemblyMethodId, payload),
    onSuccess: (_, variables) => {
      toast.success('Assigned successfully');
      qc.invalidateQueries({ queryKey: catalogKeys.assemblyMethodAssignments(variables.assemblyMethodId) });
    },
  });
};


// Hook gán Drive vào Capability
export const useAssignDriveToCapability = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ capabilityId, payload }: { capabilityId: string; payload: any }) =>
      catalogApi.assignDriveToCapability(capabilityId, payload),
    onSuccess: (_, variables) => {
      toast.success('Drive assigned successfully');
      // Invalidate cache để tự động fetch lại danh sách (nếu có GET list)
      qc.invalidateQueries({ queryKey: catalogKeys.capabilityDriveAssignments(variables.capabilityId) });
    },
  });
};


// Hook lấy danh sách Drive của một Capability
export const useAssignedCapabilityDrives = (capabilityId: string) =>
  useQuery({
    queryKey: catalogKeys.capabilityDriveAssignments(capabilityId),
    queryFn: () => catalogApi.getAssignedDrivesForCapability(capabilityId),
    enabled: !!capabilityId, // Chỉ chạy khi có ID
  });

  // Hook lấy danh sách Drives ngắn gọn dựa trên nhiều Capability IDs (Dùng cho dropdown filter)
export const useActiveDrivesByCapabilities = (capabilityIds: string[]) => {
  return useQuery({
    queryKey: catalogKeys.activeDrivesByCapabilities(capabilityIds),
    queryFn: () => catalogApi.getActiveDrivesForCapabilities({ capabilityIds }),
    enabled: capabilityIds.length > 0, // Chỉ chạy API nếu có truyền id vào mảng
    staleTime: 5 * 60 * 1000,
  });
};


// Hook cập nhật trạng thái ràng buộc Topic - Material
export const useUpdateTopicMaterialCapabilityStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ capabilityId, tmcId, payload }: { capabilityId: string; tmcId: string; payload: any }) =>
      catalogApi.updateTopicMaterialCapabilityStatus(capabilityId, tmcId, payload),
    onSuccess: (_, variables) => {
      // Invalidate cache để UI tự động cập nhật
      qc.invalidateQueries({ queryKey: catalogKeys.capabilityAssignments(variables.capabilityId) });
    },
  });
};

// Hook dùng để xóa ràng buộc Topic - Material
export const useDeleteTopicMaterialFromCapability = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ capabilityId, tmcId }: { capabilityId: string; tmcId: string }) =>
      catalogApi.deleteTopicMaterialCapability(capabilityId, tmcId),
    onSuccess: (_, variables) => {
      // Refresh lại danh sách ngay lập tức sau khi xóa thành công
      qc.invalidateQueries({ queryKey: catalogKeys.capabilityAssignments(variables.capabilityId) });
    },
  });
};


// Hook dùng để xóa ràng buộc Drive
export const useDeleteDriveFromCapability = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ capabilityId, driveId }: { capabilityId: string; driveId: string }) =>
      catalogApi.deleteCapabilityDrive(capabilityId, driveId),
    onSuccess: (_, variables) => {
      // Refresh lại danh sách Drive ngay lập tức
      qc.invalidateQueries({ queryKey: catalogKeys.capabilityDriveAssignments(variables.capabilityId) });
    },
  });
};

// Hook cập nhật trạng thái ràng buộc Capability - Material
export const useUpdateCapabilityMaterialAssemblyStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assemblyId, cmcId, payload }: { assemblyId: string; cmcId: string; payload: any }) =>
      catalogApi.updateCapabilityMaterialAssemblyStatus(assemblyId, cmcId, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: catalogKeys.assemblyMethodAssignments(variables.assemblyId) });
    },
  });
};

// Hook xóa hẳn ràng buộc Capability - Material
export const useDeleteCapabilityMaterialFromAssembly = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assemblyId, cmcId }: { assemblyId: string; cmcId: string }) =>
      catalogApi.deleteCapabilityMaterialAssembly(assemblyId, cmcId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: catalogKeys.assemblyMethodAssignments(variables.assemblyId) });
    },
  });
};

// Hook lấy danh sách active capabilities dựa trên topic và material
export const useFilteredCapabilities = (topicId: string, materialId: string) => {
  return useQuery({
    queryKey: catalogKeys.filteredCapabilities(topicId, materialId),
    queryFn: () => catalogApi.getActiveCapabilitiesForTopicAndMaterial(topicId, materialId),
    // Chỉ gọi API khi đã có đầy đủ topicId và materialId
    enabled: !!topicId && !!materialId, 
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });
};

// Hook lấy danh sách active assembly methods dựa trên capability và material
export const useFilteredAssemblyMethods = (capabilityId: string, materialId: string) => {
  return useQuery({
    queryKey: catalogKeys.filteredAssemblyMethods(capabilityId, materialId),
    queryFn: () => catalogApi.getActiveAssemblyMethodsForCapabilityAndMaterial(capabilityId, materialId),
    // Chỉ gọi API khi đã có đầy đủ capabilityId và materialId
    enabled: !!capabilityId && !!materialId, 
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });
};