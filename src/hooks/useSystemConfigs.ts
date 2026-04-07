import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configService, type OrderConfig, type PaymentConfig, type WalletConfig } from '@/services/configApi';

// --- ORDER HOOKS ---
export const useGetOrderConfig = () => {
  return useQuery({
    queryKey: ['orderConfig'],
    queryFn: configService.getOrderConfig,
  });
};

export const useUpdateOrderConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrderConfig) => configService.updateOrderConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderConfig'] });
    },
  });
};

// --- PAYMENT HOOKS ---
export const useGetPaymentConfig = () => {
  return useQuery({
    queryKey: ['paymentConfig'],
    queryFn: configService.getPaymentConfig,
  });
};

export const useUpdatePaymentConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentConfig) => configService.updatePaymentConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentConfig'] });
    },
  });
};

// --- WALLET HOOKS ---
export const useGetWalletConfig = () => {
  return useQuery({
    queryKey: ['walletConfig'],
    queryFn: configService.getWalletConfig,
  });
};

export const useUpdateWalletConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WalletConfig) => configService.updateWalletConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletConfig'] });
    },
  });
};