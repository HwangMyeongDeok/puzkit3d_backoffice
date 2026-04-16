import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDeliveryTrackings,
  getDeliveryTrackingById,
  createDeliveryTracking,
  type DeliveryTracking,
  type DeliveryTrackingResponse,
} from '@/services/deliveryApi';
import type { CreateDeliveryTrackingDto } from '@/types/types';

export const useDeliveryTrackings = (orderId: string, enabled: boolean = false) => {
  return useQuery<DeliveryTrackingResponse>({
    queryKey: ['delivery-trackings', 'list', orderId],
    queryFn: () => fetchDeliveryTrackings(orderId),
    enabled: enabled && !!orderId,
    staleTime: 60_000,
  });
};

export const useDeliveryTrackingById = (trackingId: string, enabled: boolean = true) => {
  return useQuery<DeliveryTracking>({
    queryKey: ['delivery-trackings', 'detail', trackingId],
    queryFn: () => getDeliveryTrackingById(trackingId),
    enabled: enabled && !!trackingId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const useCreateDeliveryTracking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDeliveryTrackingDto) => createDeliveryTracking(payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['delivery-trackings', 'list', variables.orderId],
      });
    },
  });
};

export const useUpdateHandOverImage = () => {
  return useMutation({
    mutationFn: (payload: { id: string; imageUrl: string }) => {
      return import('@/services/deliveryApi').then((m) => m.updateHandOverImage(payload));
    },
  });
};