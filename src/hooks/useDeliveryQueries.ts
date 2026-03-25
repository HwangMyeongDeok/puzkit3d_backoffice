import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchDeliveryTrackings, 
  getDeliveryTrackingById,
  createDeliveryTracking,
  type DeliveryTracking,
  type DeliveryTrackingResponse,
} from '@/services/deliveryApi';
import type { CreateDeliveryTrackingDto } from '@/types/types';

// Hook lấy danh sách tracking theo orderId (của ông nãy tui giữ nguyên)
export const useDeliveryTrackings = (orderId: string, enabled: boolean = false) => {
  return useQuery<DeliveryTrackingResponse>({
    // Khuyến nghị: Thêm chữ 'list' vào key để sau này phân biệt với 'detail' cho dễ quản lý cache
    queryKey: ['delivery-trackings', 'list', orderId], 
    queryFn: () => fetchDeliveryTrackings(orderId),
    enabled: enabled && !!orderId, // Check thêm !!orderId cho an toàn
    staleTime: 60_000,
  });
};

// Hook MỚI: Lấy chi tiết 1 tracking cụ thể theo ID
export const useDeliveryTrackingById = (trackingId: string, enabled: boolean = true) => {
  return useQuery<DeliveryTracking>({
    queryKey: ['delivery-trackings', 'detail', trackingId],
    queryFn: () => getDeliveryTrackingById(trackingId),
    // Chỉ gọi API khi được enable VÀ trackingId có tồn tại (tránh lỗi khi component vừa mount lên id bị undefined)
    enabled: enabled && !!trackingId, 
    staleTime: 0, // Cập nhật ngay khi tab ra/vào
    refetchOnWindowFocus: true,
  });
};

// Hook MỚI: Tạo delivery tracking mới
export const useCreateDeliveryTracking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateDeliveryTrackingDto) => createDeliveryTracking(payload),
    onSuccess: (data) => {
      // Invalidate danh sách trackings của order này để refresh dữ liệu
      queryClient.invalidateQueries({
        queryKey: ['delivery-trackings', 'list', data.orderId],
      });
    },
  });
};

// Hook: Update Hand Over Image
export const useUpdateHandOverImage = () => {
  return useMutation({
    mutationFn: (payload: { id: string; imageUrl: string }) => {
      // Need to import updateHandOverImage inline if not added above, but we will add it to the import list above.
      // Wait, let's just make sure we export from deliveryApi.
      return import('@/services/deliveryApi').then(m => m.updateHandOverImage(payload));
    },
  });
};