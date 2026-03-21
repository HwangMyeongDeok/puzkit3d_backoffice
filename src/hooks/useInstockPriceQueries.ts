import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priceApi } from '@/services/priceApi';
import type {
  InstockPriceQueryConfig,
  CreateInstockPriceRequestDto,
  UpdateInstockPriceRequestDto,
} from '@/types/types';

// Keys chuẩn cho TanStack Query
export const INSTOCK_PRICE_KEYS = {
  all: ['instock-prices'] as const,
  lists: () => [...INSTOCK_PRICE_KEYS.all, 'list'] as const,
  list: (params: InstockPriceQueryConfig) =>
    [...INSTOCK_PRICE_KEYS.lists(), params] as const,
  details: () => [...INSTOCK_PRICE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INSTOCK_PRICE_KEYS.details(), id] as const,
};

// 1. GET ALL (Có phân trang, search, filter)
export const useInstockPrices = (params: InstockPriceQueryConfig) => {
  return useQuery({
    queryKey: INSTOCK_PRICE_KEYS.list(params),
    queryFn: () => priceApi.getAllInstockPrices(params),
    placeholderData: (previousData) => previousData,
  });
};

// 2. GET BY ID (Lấy chi tiết 1 chiến dịch giá)
export const useInstockPriceById = (id: string) => {
  return useQuery({
    queryKey: INSTOCK_PRICE_KEYS.detail(id),
    queryFn: () => priceApi.getInstockPriceById(id),
    enabled: !!id,
  });
};

// 3. CREATE (Tạo chiến dịch giá mới)
export const useCreateInstockPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInstockPriceRequestDto) =>
      priceApi.createInstockPrice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTOCK_PRICE_KEYS.lists() });
    },
  });
};

// 4. UPDATE (Sửa chiến dịch giá)
export const useUpdateInstockPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInstockPriceRequestDto }) =>
      priceApi.updateInstockPrice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: INSTOCK_PRICE_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: INSTOCK_PRICE_KEYS.detail(variables.id),
      });
    },
  });
};

// 5. TOGGLE / SOFT DELETE (Đã sửa lại logic theo ý ông)
export const useToggleInstockPriceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isActive) {
        // Nếu ĐANG BẬT -> gọi DELETE để tắt (Soft delete)
        return priceApi.deactivateInstockPrice(id);
      } else {
        // Nếu ĐANG TẮT -> Lấy lại data cũ -> Update thành true
        const currentData = await priceApi.getInstockPriceById(id);
        
        // Build payload để gửi update (Map từ DTO GET sang DTO UPDATE)
        const updatePayload: UpdateInstockPriceRequestDto = {
          name: currentData.name,
          priority: currentData.priority,
          effectiveFrom: currentData.effectiveFrom,
          effectiveTo: currentData.effectiveTo,
          isActive: true, // <--- Ghi đè thành true để bật lại
        };

        return priceApi.updateInstockPrice(id, updatePayload);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INSTOCK_PRICE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INSTOCK_PRICE_KEYS.detail(variables.id) });
    },
  });
};