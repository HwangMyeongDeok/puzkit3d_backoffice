import { axiosInstance } from "@/lib/axios";
import type {
  CreatePartnerQuotationRequest,
  CreatePartnerQuotationResponse,
  PartnerQuotationDto,
} from "@/types/types";

export async function getPartnerQuotationByRequestId(requestId: string) {
  const response = await axiosInstance.get<PartnerQuotationDto>(
    `/partner-quotations/by-request/${requestId}`
  );
  return response.data;
}

export async function getPartnerQuotationById(id: string) {
  const response = await axiosInstance.get<PartnerQuotationDto>(
    `/partner-quotations/${id}`
  );
  return response.data;
}

export async function createPartnerQuotation(payload: CreatePartnerQuotationRequest) {
  const response = await axiosInstance.post<CreatePartnerQuotationResponse>(
    "/partner-quotations",
    payload
  );
  return response.data;
}