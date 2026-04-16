import axiosInstance from '@/lib/axios';

export const PARTNER_ORDER_STATUSES = [
  'Pending',
  'Paid',
  'WatingForReorder',
  'OrderedFromPartner',
  'ReceivedAtWarehouse',
  'CheckingFailed',
  'Processing',
  'HandedOverToDelivery',
  'Completed',
  'Expired',
  'CancelledByCustomer',
  'CancelledByStaff',
  'Returned',
] as const;

export type PartnerOrderStatus = (typeof PARTNER_ORDER_STATUSES)[number];
export type PartnerOrderDisplayStatus = PartnerOrderStatus | 'Delivering' | 'Delivered';

export interface GetPartnerOrdersParams {
  pageNumber: number;
  pageSize: number;
  ascending?: boolean;
  status?: PartnerOrderStatus;
}

export interface PartnerOrderListItemDto {
  id: string;
  partnerProductQuotationId: string;
  code: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  subTotalAmount: number;
  shippingFee: number;
  importTaxAmount: number;
  grandTotalAmount: number;
  status: PartnerOrderStatus;
  paymentMethod: string;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerOrderDetailDto extends PartnerOrderListItemDto {
  customerProvinceName?: string | null;
  customerDistrictName?: string | null;
  customerWardName?: string | null;
  detailAddress?: string | null;
  paidAt?: string | null;
}

export interface PartnerOrderListResponse {
  items: PartnerOrderListItemDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface UpdatePartnerOrderStatusDto {
  newStatus: PartnerOrderStatus;
}

export const partnerOrderApi = {
  getOrders: async (params: GetPartnerOrdersParams) => {
    const response = await axiosInstance.get('/partner-orders', {
      params: {
        ascending: true,
        ...params,
      },
    });
    return response.data as PartnerOrderListResponse;
  },

  getOrderById: async (id: string) => {
    const response = await axiosInstance.get(`/partner-orders/${id}`);
    return response.data as PartnerOrderDetailDto;
  },

  updateStatus: async (id: string, payload: UpdatePartnerOrderStatusDto) => {
    const response = await axiosInstance.put(`/partner-orders/${id}/status`, payload);
    return response.data;
  },
};