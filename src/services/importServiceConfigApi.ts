import { axiosInstance } from "@/lib/axios";
import type {
  GetImportServiceConfigsResponse,
  UpsertImportServiceConfigRequest,
} from "@/types/types";

export async function getImportServiceConfigs(
  pageNumber = 1,
  pageSize = 8,
  searchTerm = "",
  ascending = true
) {
  const response = await axiosInstance.get<GetImportServiceConfigsResponse>(
    "/import-service-configs",
    {
      params: {
        pageNumber,
        pageSize,
        ascending,
        ...(searchTerm ? { searchTerm } : {}),
      },
    }
  );

  return response.data;
}

export async function createImportServiceConfig(
  payload: UpsertImportServiceConfigRequest
) {
  const response = await axiosInstance.post("/import-service-configs", payload);
  return response.data;
}

export async function updateImportServiceConfig(
  id: string,
  payload: UpsertImportServiceConfigRequest
) {
  const response = await axiosInstance.put(
    `/import-service-configs/${id}`,
    payload
  );
  return response.data;
}

export async function disableImportServiceConfig(id: string) {
  const response = await axiosInstance.delete(`/import-service-configs/${id}`);
  return response.data;
}

export async function enableImportServiceConfig(id: string) {
  const response = await axiosInstance.patch(
    `/import-service-configs/${id}/activate`
  );
  return response.data;
}