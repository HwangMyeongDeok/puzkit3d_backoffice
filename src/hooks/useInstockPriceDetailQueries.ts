import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priceDetailApi } from '@/services/priceDetailApi';
import type {
  CreateInstockPriceDetailRequestDto,
  UpdateInstockPriceDetailRequestDto,
} from '@/types/types';

export const PRICE_DETAIL_KEYS = {
  all: ['price-details'] as const,
  byVariant: (variantId: string) =>
    [...PRICE_DETAIL_KEYS.all, 'variant', variantId] as const,
  byPrice: (priceId: string, pageNumber: number, pageSize: number) =>
    [...PRICE_DETAIL_KEYS.all, 'price', priceId, pageNumber, pageSize] as const,
};

// 1. Lấy tất cả giá của 1 Variant (để hiển thị trong form Edit)
export const usePriceDetailsByVariantId = (variantId: string | undefined) => {
  return useQuery({
    queryKey: PRICE_DETAIL_KEYS.byVariant(variantId!),
    queryFn: () => priceDetailApi.getPriceDetailsByVariantId(variantId!),
    enabled: !!variantId,
  });
};

// 1b. Lấy tất cả giá của 1 Price (theo priceId)
export const usePriceDetailsByPriceId = (
  priceId: string | undefined,
  pageNumber: number = 1,
  pageSize: number = 10,
) => {
  return useQuery({
    queryKey: PRICE_DETAIL_KEYS.byPrice(priceId!, pageNumber, pageSize),
    queryFn: () =>
      priceDetailApi.getPriceDetailsByPriceId(priceId!, pageNumber, pageSize),
    enabled: !!priceId,
  });
};

// 2. Thêm giá mới cho Variant
export const useCreatePriceDetail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInstockPriceDetailRequestDto) =>
      priceDetailApi.createPriceDetail(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PRICE_DETAIL_KEYS.byVariant(variables.variantId),
      });
      // Invalidate price-based queries
      queryClient.invalidateQueries({
        queryKey: [...PRICE_DETAIL_KEYS.all, 'price'],
      });
    },
  });
};

// 3. Sửa giá hiện tại
export const useUpdatePriceDetail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInstockPriceDetailRequestDto }) =>
      priceDetailApi.updatePriceDetail(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRICE_DETAIL_KEYS.all });
    },
  });
};

// 4. Xóa giá
export const useDeletePriceDetail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      priceDetailApi.deletePriceDetail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRICE_DETAIL_KEYS.all });
    },
  });
};