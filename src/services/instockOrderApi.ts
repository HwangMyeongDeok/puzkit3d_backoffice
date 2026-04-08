import { axiosInstance } from '@/lib/axios';
import type {
  DeliveryTrackingPaginatedResponse,
  GetCustomerOrdersParams,
  InstockCustomerOrderDto,
  InstockCustomerOrderListItemDto,
  PagedResult,
  UpdateInstockOrderStatusRequestDto,
} from '@/types/types';

export const instockOrderApi = {
  getAllOrders: async (
    params: GetCustomerOrdersParams,
  ): Promise<PagedResult<InstockCustomerOrderListItemDto>> => {
    const response = await axiosInstance.get<
      PagedResult<InstockCustomerOrderListItemDto>
    >('/instock-orders/all', {
      params,
    });

    return response.data;
  },

  getCustomerOrderById: async (
    orderId: string,
  ): Promise<InstockCustomerOrderDto> => {
    const response = await axiosInstance.get<InstockCustomerOrderDto>(
      `/instock-orders/${orderId}`,
    );

    return response.data;
  },

  updateOrderStatus: async (
    orderId: string,
    data: UpdateInstockOrderStatusRequestDto,
  ): Promise<void> => {
    const response = await axiosInstance.patch(
      `/instock-orders/${orderId}/status`,
      data,
    );

    return response.data;
  },

  // createDeliveryTracking: async (data: CreateDeliveryTrackingDto): Promise<void> => {
  //   const response = await axiosInstance.post(
  //     `/delivery-trackings`,
  //     data
  //   );

  //   return response.data;
  // },

  getDeliveryTracking: async (
    orderId: string,
  ): Promise<DeliveryTrackingPaginatedResponse> => {
    const response = await axiosInstance.get<DeliveryTrackingPaginatedResponse>(
      `/delivery-trackings/order/${orderId}`,
    );

    return response.data;
  },

  getWaybillUrl: async (deliveryTrackingId: string): Promise<{ waybillUrl: string }> => {
    const response = await axiosInstance.get<{ waybillUrl: string }>(
      `/delivery-trackings/${deliveryTrackingId}/waybill-number`,
    );
    return response.data;
  },
};
