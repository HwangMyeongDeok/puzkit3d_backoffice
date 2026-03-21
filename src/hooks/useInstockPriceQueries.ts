import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priceApi } from '@/services/priceApi';
import type {
  InstockPriceQueryConfig,
  CreateInstockPriceRequestDto,
  UpdateInstockPriceRequestDto,
} from '@/types/types';

export const INSTOCK_PRICE_KEYS = {
  all: ['instock-prices'] as const,
  lists: () => [...INSTOCK_PRICE_KEYS.all, 'list'] as const,
  list: (params: InstockPriceQueryConfig) =>
    [...INSTOCK_PRICE_KEYS.lists(), params] as const,
  details: () => [...INSTOCK_PRICE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INSTOCK_PRICE_KEYS.details(), id] as const,
};

const invalidateLists = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({
    queryKey: INSTOCK_PRICE_KEYS.lists(),
    refetchType: 'all',
  });

// 1. GET ALL
export const useInstockPrices = (params: InstockPriceQueryConfig) => {
  return useQuery({
    queryKey: INSTOCK_PRICE_KEYS.list(params),
    queryFn: () => priceApi.getAllInstockPrices(params),
    placeholderData: (previousData) => previousData,
  });
};

// 2. GET BY ID
export const useInstockPriceById = (id: string) => {
  return useQuery({
    queryKey: INSTOCK_PRICE_KEYS.detail(id),
    queryFn: () => priceApi.getInstockPriceById(id),
    enabled: !!id,
  });
};

// 3. CREATE
export const useCreateInstockPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInstockPriceRequestDto) =>
      priceApi.createInstockPrice(data),
    onSuccess: () => invalidateLists(queryClient),
  });
};

// 4. UPDATE
export const useUpdateInstockPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInstockPriceRequestDto }) =>
      priceApi.updateInstockPrice(id, data),
    onSuccess: (_, { id }) => {
      invalidateLists(queryClient);
      queryClient.invalidateQueries({
        queryKey: INSTOCK_PRICE_KEYS.detail(id),
        refetchType: 'all',
      });
    },
  });
};

// 5. TOGGLE STATUS
export const useToggleInstockPriceStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isActive) {
        return priceApi.deactivateInstockPrice(id);
      } else {
        const currentData = await priceApi.getInstockPriceById(id);
        const updatePayload: UpdateInstockPriceRequestDto = {
          name: currentData.name,
          priority: currentData.priority,
          effectiveFrom: currentData.effectiveFrom,
          effectiveTo: currentData.effectiveTo,
          isActive: true,
        };
        return priceApi.updateInstockPrice(id, updatePayload);
      }
    },
    onSuccess: (_, { id }) => {
      invalidateLists(queryClient);
      queryClient.invalidateQueries({
        queryKey: INSTOCK_PRICE_KEYS.detail(id),
        refetchType: 'all',
      });
    },
  });
};