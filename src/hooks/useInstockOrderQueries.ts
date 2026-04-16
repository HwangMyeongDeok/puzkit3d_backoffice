import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  GetCustomerOrdersParams,
  InstockOrderStatus,
  UpdateInstockOrderStatusRequestDto,
} from '@/types/types';
import { instockOrderApi } from '@/services/instockOrderApi';

export const INSTOCK_ORDER_KEYS = {
  all: ['instock-orders'] as const,
  lists: () => [...INSTOCK_ORDER_KEYS.all, 'list'] as const,
  list: (params: GetCustomerOrdersParams) =>
    [...INSTOCK_ORDER_KEYS.lists(), params] as const,
  details: () => [...INSTOCK_ORDER_KEYS.all, 'detail'] as const,
  detail: (orderId: string) => [...INSTOCK_ORDER_KEYS.details(), orderId] as const,
  deliveryTracking: (orderId: string) =>
    [...INSTOCK_ORDER_KEYS.all, 'delivery-tracking', orderId] as const,
};

export const INSTOCK_ORDER_STATUSES: InstockOrderStatus[] = [
  'Pending',
  'Paid',
  'Processing',
  'Waiting',
  'Delivered',
  'Cancelled',
  'Completed',
  'Returned',
  'HandedOverToDelivery',
];

export const useCustomerOrders = (params: GetCustomerOrdersParams) => {
  return useQuery({
    queryKey: INSTOCK_ORDER_KEYS.list(params),
    queryFn: () => instockOrderApi.getAllOrders(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useCustomerOrderById = (orderId: string | null) => {
  return useQuery({
    queryKey: INSTOCK_ORDER_KEYS.detail(orderId || ''),
    queryFn: () => instockOrderApi.getCustomerOrderById(orderId!),
    enabled: !!orderId,
  });
};

export const useUpdateInstockOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: UpdateInstockOrderStatusRequestDto;
    }) => instockOrderApi.updateOrderStatus(orderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INSTOCK_ORDER_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: INSTOCK_ORDER_KEYS.detail(variables.orderId),
      });
    },
  });
};

// export const useCreateInstockOrderDeliveryTracking = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (data: CreateDeliveryTrackingDto) => 
//       instockOrderApi.createDeliveryTracking(data),
    
//     // variables chính là cái data ông truyền vào mutateAsync
//     onSuccess: (_, variables) => {
//       const orderId = variables.orderId;
//       queryClient.invalidateQueries({ queryKey: INSTOCK_ORDER_KEYS.lists() });
//       queryClient.invalidateQueries({
//         queryKey: INSTOCK_ORDER_KEYS.detail(orderId),
//       });
//       queryClient.invalidateQueries({
//         queryKey: INSTOCK_ORDER_KEYS.deliveryTracking(orderId),
//       });
//     },
//   });
// };;

export const useInstockOrderDeliveryTracking = (
  orderId: string | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: INSTOCK_ORDER_KEYS.deliveryTracking(orderId || ''),
    queryFn: () => instockOrderApi.getDeliveryTracking(orderId!),
    enabled: !!orderId && enabled,
  });
};
