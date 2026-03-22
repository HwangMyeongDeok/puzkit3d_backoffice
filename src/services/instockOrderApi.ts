import { axiosInstance } from '@/lib/axios';
import type {
  GetCustomerOrdersParams,
  InstockCustomerOrderDto,
  InstockCustomerOrderListItemDto,
  InstockOrderDeliveryTrackingDto,
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

  createDeliveryTracking: async (orderId: string): Promise<void> => {
    const response = await axiosInstance.post(
      `/instock-orders/${orderId}/delivery-tracking`,
    );

    return response.data;
  },

  getDeliveryTracking: async (
    orderId: string,
  ): Promise<InstockOrderDeliveryTrackingDto> => {
    const response = await axiosInstance.get<InstockOrderDeliveryTrackingDto>(
      `/instock-orders/${orderId}/delivery-tracking`,
    );

    return response.data;
  },

    getWaybillUrl: async (orderId: string): Promise<string> => {
    const response = await axiosInstance.get<string>(
      `/instock-orders/${orderId}/delivery-tracking/waybill-number`,
    );
    return response.data;
  },
};
