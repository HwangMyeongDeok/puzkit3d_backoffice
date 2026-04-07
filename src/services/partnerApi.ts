import { axiosInstance } from "@/lib/axios";
import type {
  GetPartnersResponse,
  UpsertPartnerRequest,
} from "@/types/types";

export async function getPartners(
  pageNumber = 1,
  pageSize = 8,
  ascending = true
) {
  const response = await axiosInstance.get<GetPartnersResponse>("/partners", {
    params: {
      pageNumber,
      pageSize,
      ascending,
    },
  });

  return response.data;
}

export async function createPartner(payload: UpsertPartnerRequest) {
  const response = await axiosInstance.post("/partners", payload);
  return response.data;
}

export async function updatePartner(id: string, payload: UpsertPartnerRequest) {
  const response = await axiosInstance.put(`/partners/${id}`, payload);
  return response.data;
}

export async function disablePartner(id: string) {
  const response = await axiosInstance.delete(`/partners/${id}`);
  return response.data;
}

export async function enablePartner(id: string) {
  const response = await axiosInstance.patch(`/partners/${id}/activate`);
  return response.data;
}