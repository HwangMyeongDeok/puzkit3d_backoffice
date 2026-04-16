import { axiosInstance } from "@/lib/axios";
import type {
  GetPartnerProductRequestsResponse,
  PartnerProductRequestDetailDto,
  UpdatePartnerProductRequestStatusRequest,
} from "@/types/types";

export async function getPartnerProductRequests(
  pageNumber = 1,
  pageSize = 8,
  searchTerm = "",
  status?: number,
  ascending = true
) {
  const response = await axiosInstance.get<GetPartnerProductRequestsResponse>(
    "/partner-product-requests",
    {
      params: {
        pageNumber,
        pageSize,
        ascending,
        ...(searchTerm ? { searchTerm } : {}),
        ...(typeof status === "number" ? { status } : {}),
      },
    }
  );

  return response.data;
}

export async function getPartnerProductRequestDetail(id: string) {
  const response = await axiosInstance.get<PartnerProductRequestDetailDto>(
    `/partner-product-requests/${id}/detail`
  );
  return response.data;
}

export async function updatePartnerProductRequestStatus(
  id: string,
  payload: UpdatePartnerProductRequestStatusRequest
) {
  const response = await axiosInstance.put(
    `/partner-product-requests/${id}/status`,
    payload
  );
  return response.data;
}