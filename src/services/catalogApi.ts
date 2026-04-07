import { axiosInstance } from "@/lib/axios";

export type CatalogResource =
  | "assembly-methods"
  | "capabilities"
  | "materials"
  | "topics";

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

export async function getCatalogList<T extends CatalogItem>(
  resource: CatalogResource,
  pageNumber = 1,
  pageSize = 8,
  isActive = true
) {
  const response = await axiosInstance.get<PagedResponse<T>>(`/${resource}`, {
    params: {
      pageNumber,
      pageSize,
      isActive,
    },
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

export async function deleteCatalogItem(
  resource: CatalogResource,
  id: string
) {
  const response = await axiosInstance.delete(`/${resource}/${id}`);
  return response.data;
}

export async function getTopics(
  pageNumber = 1,
  pageSize = 8,
  isActive = true
) {
  const response = await axiosInstance.get<PagedResponse<TopicItem>>("/topics", {
    params: {
      pageNumber,
      pageSize,
      isActive,
    },
  });

  return response.data;
}

export async function getAllTopics(isActive = true) {
  const response = await axiosInstance.get<PagedResponse<TopicItem>>("/topics", {
    params: {
      pageNumber: 1,
      pageSize: 1000,
      isActive,
    },
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