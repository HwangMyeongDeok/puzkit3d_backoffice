import { axiosInstance } from "@/lib/axios";

// ==========================================
// 1. BASE TYPES
// ==========================================
export type CatalogResource =
  | "assembly-methods"
  | "capabilities"
  | "materials"
  | "topics"
  | "drives"; // <-- Đã thêm drives

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

export type CatalogItem = CatalogItemBase | TopicItem;

// --- Thêm Type riêng cho Drive ---
export interface DriveItem {
  id: string;
  name: string;
  description: string;
  minVolume: number;
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

// ==========================================
// 3. CATALOG SERVICES (CRUD BASE)
// ==========================================
export async function getCatalogList<T extends CatalogItem>(
  resource: CatalogResource,
  pageNumber = 1,
  pageSize = 8,
  searchTerm = "",
  isActive?: boolean,
  ascending = true
) {
  const response = await axiosInstance.get<PagedResponse<T>>(`/${resource}`, {
    params: { pageNumber, pageSize, searchTerm, isActive, ascending },
  });
  return response.data;
}

export async function createCatalogItem(
  resource: Exclude<CatalogResource, "topics">,
  payload: CatalogPayload
) {
  const response = await axiosInstance.post<string>(`/${resource}`, payload);
  return response.data;
}

export async function updateCatalogItem(
  resource: Exclude<CatalogResource, "topics">,
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

export async function getTopics(
  pageNumber = 1, 
  pageSize = 8, 
  searchTerm = "", 
  isActive?: boolean, 
  ascending = true
) {
  const response = await axiosInstance.get<PagedResponse<TopicItem>>("/topics", {
    params: { pageNumber, pageSize, searchTerm, isActive, ascending },
  });
  return response.data;
}

export async function getAllTopics(isActive = true) {
  const response = await axiosInstance.get<PagedResponse<TopicItem>>("/topics", {
    params: { pageNumber: 1, pageSize: 1000, isActive },
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

export async function getActiveDrivesForCapabilities(payload: GetDrivesByCapabilitiesPayload) {
  const response = await axiosInstance.post<CapabilityDriveBriefItem[]>(
    '/capabilities/drives', 
    payload
  );
  return response.data;
}

export interface UpdateTopicMaterialCapabilityPayload {
  isActive: boolean;
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

// Payload cho API PUT cập nhật trạng thái
export interface UpdateCapabilityMaterialAssemblyPayload {
  isActive: boolean;
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