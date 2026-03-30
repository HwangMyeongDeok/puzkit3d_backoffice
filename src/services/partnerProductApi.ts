import { axiosInstance } from "@/lib/axios";
import type {
  GetPartnerProductsResponse,
  UpsertPartnerProductRequest,
  PartnerProductDto,
} from "@/types/types";

export async function getPartnerProducts(
  pageNumber = 1,
  pageSize = 8,
  searchTerm = "",
  partnerId = ""
) {
  const response = await axiosInstance.get<GetPartnerProductsResponse>(
    "/partner-products",
    {
      params: {
        pageNumber,
        pageSize,
        ...(searchTerm ? { searchTerm } : {}),
        ...(partnerId ? { partnerId } : {}),
      },
    }
  );

  return response.data;
}

export async function getPartnerProductById(id: string) {
  const response = await axiosInstance.get<PartnerProductDto>(`/partner-products/${id}`);
  return response.data;
}

export async function createPartnerProduct(payload: UpsertPartnerProductRequest) {
  const response = await axiosInstance.post("/partner-products", payload);
  return response.data;
}

export async function updatePartnerProduct(
  id: string,
  payload: UpsertPartnerProductRequest
) {
  const response = await axiosInstance.put(`/partner-products/${id}`, payload);
  return response.data;
}

export async function disablePartnerProduct(id: string) {
  const response = await axiosInstance.delete(`/partner-products/${id}`);
  return response.data;
}

export async function enablePartnerProduct(id: string) {
  const response = await axiosInstance.patch(`/partner-products/${id}/activate`);
  return response.data;
}