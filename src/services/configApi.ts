import axiosInstance from '@/lib/axios';

// --- TYPES ---
export interface OrderConfig {
  id?: string;
  orderMustCompleteInDays: number;
}

export interface PaymentConfig {
  id?: string;
  onlinePaymentExpiredInDays: number;
  onlineTransactionExpiredInMinutes: number;
}

export interface WalletConfig {
  id?: string;
  onlineOrderReturnPercentage: number;
  onlineOrderCompletedRewardPercentage: number;
  codOrderCompletedRewardPercentage: number;
}

// --- API CALLS ---
export const configService = {
  // ORDER
  getOrderConfig: async () => {
    const { data } = await axiosInstance.get<OrderConfig>('/configs/order');
    return data;
  },
  updateOrderConfig: async (payload: OrderConfig) => {
    const { data } = await axiosInstance.put('/instock-orders/configs/order', payload);
    return data;
  },

  // PAYMENT
  getPaymentConfig: async () => {
    const { data } = await axiosInstance.get<PaymentConfig>('/configs/payment');
    return data;
  },
  updatePaymentConfig: async (payload: PaymentConfig) => {
    const { data } = await axiosInstance.put('/configs/payment', payload);
    return data;
  },

  // WALLET
  getWalletConfig: async () => {
    const { data } = await axiosInstance.get<WalletConfig>('/configs/wallet');
    return data;
  },
  updateWalletConfig: async (payload: WalletConfig) => {
    const { data } = await axiosInstance.put('/configs/wallet', payload);
    return data;
  }
};