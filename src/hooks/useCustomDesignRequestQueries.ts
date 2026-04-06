import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customDesignRequestApi } from "@/services/customDesignRequestApi";
import type { GetRequestsParams, UpdateCustomDesignRequestPayload } from "@/types/types";

// Setup Query Keys chuẩn để quản lý cache gọn gàng
export const requestKeys = {
  all: ["custom-requests"] as const,
  lists: () => [...requestKeys.all, "list"] as const,
  list: (params: GetRequestsParams) => [...requestKeys.lists(), params] as const,
  details: () => [...requestKeys.all, "detail"] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
};

// ==========================================
// 1. HOOK: Lấy danh sách (Có phân trang, filter)
// ==========================================
export const useGetRequests = (params: GetRequestsParams) => {
  return useQuery({
    queryKey: requestKeys.list(params),
    queryFn: () => customDesignRequestApi.getRequests(params),
    // Giữ data cũ trong lúc fetch trang mới để UI không bị giật/nháy
    placeholderData: (previousData) => previousData, 
  });
};

// ==========================================
// 2. HOOK: Lấy chi tiết 1 request
// ==========================================
export const useGetRequestDetail = (id: string) => {
  return useQuery({
    queryKey: requestKeys.detail(id),
    queryFn: () => customDesignRequestApi.getRequestById(id),
    enabled: !!id, // Chỉ gọi API khi ID hợp lệ
  });
};

// ==========================================
// 3. HOOK: Update (PUT) thông tin/trạng thái
// ==========================================
export const useUpdateCustomRequest = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCustomDesignRequestPayload) => 
      customDesignRequestApi.updateRequest(id, payload),
    onSuccess: () => {
      // Invalidate list để refresh lại bảng data
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      // Invalidate detail để update lại giao diện chi tiết hiện tại
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(id) });
      
      toast.success("Đã cập nhật yêu cầu thiết kế thành công!");
    },
    onError: (error: any) => {
      // Có thể log thêm error ra để debug nếu cần
      console.error("Lỗi update request:", error);
      toast.error(
        error.response?.data?.message || "Không thể cập nhật yêu cầu thiết kế. Vui lòng thử lại!"
      );
    },
  });
};