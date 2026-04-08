import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  partnerOrderApi,
  type GetPartnerOrdersParams,
  type UpdatePartnerOrderStatusDto,
} from '@/services/partnerOrderApi';

export const usePartnerOrders = (params: GetPartnerOrdersParams) => {
  return useQuery({
    queryKey: ['partner-orders', 'list', params],
    queryFn: () => partnerOrderApi.getOrders(params),
  });
};

export const usePartnerOrderById = (orderId: string | null) => {
  return useQuery({
    queryKey: ['partner-orders', 'detail', orderId],
    queryFn: () => partnerOrderApi.getOrderById(orderId!),
    enabled: !!orderId,
  });
};

export const useUpdatePartnerOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: UpdatePartnerOrderStatusDto;
    }) => partnerOrderApi.updateStatus(orderId, data),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['partner-orders', 'list'] }),
        queryClient.invalidateQueries({
          queryKey: ['partner-orders', 'detail', variables.orderId],
        }),
      ]);
    },
  });
};