import { axiosInstance } from "@/lib/axios";

// ==========================================
// 1. BASE TYPES
// ==========================================
export type CatalogResource =
  | "assembly-methods"
  | "capabilities"
  | "materials"
  | "topics"
  | "drives";

export interface CatalogItemBase {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TopicItem extends CatalogItemBase {
  parentId: string | null;
}

// --- Thêm Type cho Material ---
export interface MaterialItem extends CatalogItemBase {
  factorPercentage: number;
  basePrice: number;
}

// Cập nhật lại CatalogItem để bao gồm MaterialItem
export type CatalogItem = CatalogItemBase | TopicItem | MaterialItem;

// --- Thêm Type riêng cho Drive ---
export interface DriveItem {
  id: string;
  name: string;
  description: string;
  minVolume: number;
  quantity: number;
  isActive?: boolean;
}

export interface PagedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CatalogPayload {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

export interface TopicPayload extends CatalogPayload {
  parentId?: string | null;
}

// --- Thêm Payload cho Material ---
export interface MaterialPayload extends CatalogPayload {
  name: string;
  slug: string;
  factorPercentage: number;
  basePrice: number;
  description: string;
  isActive: boolean;
}

// ==========================================
// 2. ASSIGNMENT TYPES (RÀNG BUỘC)
// ==========================================

// --- Payload & Item cho Capability ---
export interface AssignTopicMaterialToCapabilityPayload {
  topicId: string;
  materialId: string;
  isActive: boolean;
}

export interface AssignedTopicMaterialItem {
  id: string;
  topicId: string;
  materialId: string;
  capabilityId: string;
  isActive: boolean;
}

// --- Payload & Item cho Assembly Method ---
export interface AssignCapabilityMaterialToAssemblyPayload {
  capabilityId: string;
  materialId: string;
  isActive: boolean;
}

export interface AssignedCapabilityMaterialItem {
  id: string;
  assemblyMethodId: string;
  capabilityId: string;
  materialId: string;
  isActive: boolean;
}

// --- Payload cho Capability Drive ---
export interface AssignDriveToCapabilityPayload {
  driveId: string;
}

export interface AssignedCapabilityDriveItem {
  id: string;
  capabilityId: string;
  driveId: string;
  drive?: DriveItem; // Chứa thông tin chi tiết của Drive (name, description...)
  isActive?: boolean;
}

export interface GetDrivesByCapabilitiesPayload {
  capabilityIds: string[];
}

export interface CapabilityDriveBriefItem {
  id: string;
  name: string;
}

export interface UpdateTopicMaterialCapabilityPayload {
  isActive: boolean;
}

export interface UpdateCapabilityMaterialAssemblyPayload {
  isActive: boolean;
}

// ==========================================
// 3. CATALOG SERVICES (CRUD BASE)
// ==========================================
// ==========================================
// GENERIC CATALOG API
// ==========================================
export async function getCatalogList<T extends CatalogItem>(
  resource: CatalogResource,
  pageNumber: number,     // Required
  pageSize: number,       // Required
  ascending: boolean,     // Required
  searchTerm?: string,    // Optional
  isActive?: boolean      // Optional
) {
  const response = await axiosInstance.get<PagedResponse<T>>(`/${resource}`, {
    params: { pageNumber, pageSize, ascending, searchTerm, isActive },
  });
  return response.data;
}

export async function createCatalogItem(
  resource: Exclude<CatalogResource, "topics" | "materials">,
  payload: CatalogPayload
) {
  const response = await axiosInstance.post<string>(`/${resource}`, payload);
  return response.data;
}

export async function updateCatalogItem(
  resource: Exclude<CatalogResource, "topics" | "materials">,
  id: string,
  payload: CatalogPayload
) {
  const response = await axiosInstance.put(`/${resource}/${id}`, payload);
  return response.data;
}

export async function deleteCatalogItem(resource: CatalogResource, id: string) {
  const response = await axiosInstance.delete(`/${resource}/${id}`);
  return response.data;
}

// ==========================================
// TOPICS API
// ==========================================
export async function getTopics(
  pageNumber: number,     // Required
  pageSize: number,       // Required
  ascending: boolean,     // Required
  searchTerm?: string,    // Optional
  isActive?: boolean      // Optional
) {
  const response = await axiosInstance.get<PagedResponse<TopicItem>>("/topics", {
    params: { pageNumber, pageSize, ascending, searchTerm, isActive },
  });
  return response.data;
}

export async function getAllTopics(isActive = true) {
  // Dù là getAll, API vẫn bắt buộc truyền các params này nên ta gán cứng cho nó
  const response = await axiosInstance.get<PagedResponse<TopicItem>>("/topics", {
    params: { pageNumber: 1, pageSize: 1000, ascending: true, isActive },
  });
  return response.data;
}

export async function createTopic(payload: TopicPayload) {
  const response = await axiosInstance.post<string>("/topics", payload);
  return response.data;
}

export async function updateTopic(id: string, payload: TopicPayload) {
  const response = await axiosInstance.put(`/topics/${id}`, payload);
  return response.data;
}

export async function deleteTopic(id: string) {
  const response = await axiosInstance.delete(`/topics/${id}`);
  return response.data;
}

// ==========================================
// MATERIALS API (Tương tự Topics)
// ==========================================
export async function getMaterials(
  pageNumber: number,     // Required
  pageSize: number,       // Required
  ascending: boolean,     // Required
  searchTerm?: string,    // Optional
  isActive?: boolean      // Optional
) {
  const response = await axiosInstance.get<PagedResponse<MaterialItem>>("/materials", {
    params: { pageNumber, pageSize, ascending, searchTerm, isActive },
  });
  return response.data;
}

export async function getAllMaterials(isActive = true) {
  const response = await axiosInstance.get<PagedResponse<MaterialItem>>("/materials", {
    params: { pageNumber: 1, pageSize: 1000, ascending: true, isActive },
  });
  return response.data;
}

export async function createMaterial(payload: MaterialPayload) {
  const response = await axiosInstance.post<string>("/materials", payload);
  return response.data;
}

export async function updateMaterial(id: string, payload: MaterialPayload) {
  const response = await axiosInstance.put(`/materials/${id}`, payload);
  return response.data;
}

export async function deleteMaterial(id: string) {
  const response = await axiosInstance.delete(`/materials/${id}`);
  return response.data;
}

// --- Thêm API lấy danh sách Drives ---
export async function getDrives(
  pageNumber = 1,
  pageSize = 8,
  searchTerm = "",
  isActive?: boolean,
  ascending = true
) {
  const response = await axiosInstance.get<PagedResponse<DriveItem>>("/drives", {
    params: { pageNumber, pageSize, searchTerm, isActive, ascending },
  });
  return response.data;
}

// ==========================================
// 4. ASSIGNMENT SERVICES (RÀNG BUỘC)
// ==========================================

export async function getAssignedTopicMaterialsForCapability(capabilityId: string) {
  const response = await axiosInstance.get<AssignedTopicMaterialItem[]>(
    `/capabilities/${capabilityId}/topic-material-capabilities`
  );
  return response.data;
}

export async function assignTopicMaterialToCapability(
  capabilityId: string, 
  payload: AssignTopicMaterialToCapabilityPayload
) {
  const response = await axiosInstance.post<string>(
    `/capabilities/${capabilityId}/topic-material-capabilities`, 
    payload
  );
  return response.data;
}

export async function getAssignedCapabilityMaterialsForAssembly(assemblyMethodId: string) {
  const response = await axiosInstance.get<AssignedCapabilityMaterialItem[]>(
    `/assembly-methods/${assemblyMethodId}/capability-material-assemblies`
  );
  return response.data;
}

export async function assignCapabilityMaterialToAssembly(
  assemblyMethodId: string, 
  payload: AssignCapabilityMaterialToAssemblyPayload
) {
  const response = await axiosInstance.post<string>(
    `/assembly-methods/${assemblyMethodId}/capability-material-assemblies`, 
    payload
  );
  return response.data;
}

// Gắn (Assign) Drive vào 1 Capability
export async function assignDriveToCapability(
  capabilityId: string, 
  payload: AssignDriveToCapabilityPayload
) {
  const response = await axiosInstance.post<string>(
    `/capabilities/${capabilityId}/capability-drives`, 
    payload
  );
  return response.data;
}

// Lấy danh sách Drive đã được gắn cho 1 Capability
export async function getAssignedDrivesForCapability(capabilityId: string) {
  const response = await axiosInstance.get<AssignedCapabilityDriveItem[]>(
    `/capabilities/${capabilityId}/capability-drives`
  );
  return response.data;
}

export async function getActiveDrivesForCapabilities(capabilityIds: string[]) {
  const params = new URLSearchParams();
  capabilityIds.forEach(id => params.append('CapabilityIds', id));

  const response = await axiosInstance.get<DriveItem[]>(
    '/capabilities/drives', 
    { params }
  );
  return response.data;
}

// API Update (PUT) trạng thái Active của Topic-Material Capability
export async function updateTopicMaterialCapabilityStatus(
  capabilityId: string,
  tmcId: string,
  payload: UpdateTopicMaterialCapabilityPayload
) {
  const response = await axiosInstance.put<string>(
    `/capabilities/${capabilityId}/topic-material-capabilities/${tmcId}`,
    payload
  );
  return response.data;
}

// Xóa hẳn một ràng buộc Topic-Material
export async function deleteTopicMaterialCapability(
  capabilityId: string,
  tmcId: string
) {
  const response = await axiosInstance.delete(
    `/capabilities/${capabilityId}/topic-material-capabilities/${tmcId}`
  );
  return response.data;
}

// Xóa hẳn một ràng buộc Drive khỏi Capability
export async function deleteCapabilityDrive(
  capabilityId: string,
  driveId: string
) {
  const response = await axiosInstance.delete(
    `/capabilities/${capabilityId}/capability-drives/${driveId}`
  );
  return response.data;
}

// 1. API Cập nhật (PUT) trạng thái Active
export async function updateCapabilityMaterialAssemblyStatus(
  assemblyId: string,
  cmcId: string,
  payload: UpdateCapabilityMaterialAssemblyPayload
) {
  const response = await axiosInstance.put<string>(
    `/assembly-methods/${assemblyId}/capability-material-assemblies/${cmcId}`,
    payload
  );
  return response.data;
}

// 2. API Xóa hẳn (DELETE) ràng buộc
export async function deleteCapabilityMaterialAssembly(
  assemblyId: string,
  cmcId: string
) {
  const response = await axiosInstance.delete(
    `/assembly-methods/${assemblyId}/capability-material-assemblies/${cmcId}`
  );
  return response.data;
}

export interface FilterBriefItem {
  id: string;
  name: string;
  slug: string;
}

export async function getActiveCapabilitiesForTopicAndMaterial(
  topicId: string,
  materialId: string
) {
  const response = await axiosInstance.get<FilterBriefItem[]>(
    "/filters/filter-capability",
    {
      params: { topicId, materialId },
    }
  );
  return response.data;
}

export async function getActiveAssemblyMethodsForCapabilityAndMaterial(
  materialId: string,
  capabilityIds: string[]
) {
  const params = new URLSearchParams();
  params.append('MaterialId', materialId);
  capabilityIds.forEach(id => params.append('CapabilityIds', id));

  const response = await axiosInstance.get<FilterBriefItem[]>(
    "/filters/filter-assembly-method",
    { params }
  );
  return response.data;
}
