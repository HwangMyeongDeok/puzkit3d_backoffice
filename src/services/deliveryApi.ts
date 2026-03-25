import { axiosInstance } from "@/lib/axios";
import type { CreateDeliveryTrackingDto } from "@/types/types";

// --- TYPES ---
export interface DeliveryTrackingDetail {
  id: string;
  type: string;
  itemId: string;
  quantity: number;
}

export interface DeliveryTracking {
  id: string;
  orderId: string;
  supportTicketId: string | null;
  deliveryOrderCode: string;
  status: string;
  type: string;
  note: string | null;
  handOverImageUrl: string | null;
  expectedDeliveryDate: string;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  details: DeliveryTrackingDetail[];
}

export interface DeliveryTrackingResponse {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  data: DeliveryTracking[];
}

// --- API CALL ---
export const fetchDeliveryTrackings = async (orderId: string): Promise<DeliveryTrackingResponse> => {
  const { data } = await axiosInstance.get(
    `/delivery-trackings/order/${orderId}`,{
    params: { pageNumber: 1, pageSize: 100 }
}
  );
  return data;
};

export const getDeliveryTrackingById = async (id: string): Promise<DeliveryTracking> => {
  const { data } = await axiosInstance.get(
    `/delivery-trackings/${id}`
  );
  return data;
};

export const createDeliveryTracking = async (payload: CreateDeliveryTrackingDto): Promise<DeliveryTracking> => {
  const { data } = await axiosInstance.post(
    `/delivery-trackings`,
    payload
  );
  return data;
};

export const updateHandOverImage = async ({ id, imageUrl }: { id: string; imageUrl: string }): Promise<DeliveryTracking> => {
  const { data } = await axiosInstance.put(
    `/delivery-trackings/${id}/hand-over-image`,
    { imageUrl }
  );
  return data;
};