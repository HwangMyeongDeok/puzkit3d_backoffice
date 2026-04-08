import { axiosInstance } from '@/lib/axios';
import type { CreateDeliveryTrackingDto } from '@/types/types';

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
  expectedDeliveryDate: string | null;
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

const EMPTY_TRACKING_RESPONSE: DeliveryTrackingResponse = {
  totalCount: 0,
  pageNumber: 1,
  pageSize: 100,
  totalPages: 0,
  data: [],
};

export const fetchDeliveryTrackings = async (
  orderId: string,
): Promise<DeliveryTrackingResponse> => {
  try {
    const { data } = await axiosInstance.get(`/delivery-trackings/order/${orderId}`, {
      params: { pageNumber: 1, pageSize: 100 },
    });
    return data;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 404) {
      return EMPTY_TRACKING_RESPONSE;
    }
    throw error;
  }
};

export const getDeliveryTrackingById = async (id: string): Promise<DeliveryTracking> => {
  const { data } = await axiosInstance.get(`/delivery-trackings/${id}`);
  return data;
};

export const createDeliveryTracking = async (
  payload: CreateDeliveryTrackingDto,
): Promise<string> => {
  const { data } = await axiosInstance.post(`/delivery-trackings`, payload);
  if (typeof data === 'string') return data;
  return data?.id || data?.deliveryTrackingId || '';
};

export const updateHandOverImage = async ({
  id,
  imageUrl,
}: {
  id: string;
  imageUrl: string;
}): Promise<DeliveryTracking> => {
  const { data } = await axiosInstance.put(
    `/delivery-trackings/${id}/hand-over-image`,
    { imageUrl },
  );
  return data;
};