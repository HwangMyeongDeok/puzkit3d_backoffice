import { useState } from 'react';
import { ShoppingBag, CreditCard, Wallet, Save, Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner'; // <-- IMPORT SONNER
import { 
  useGetOrderConfig, useUpdateOrderConfig,
  useGetPaymentConfig, useUpdatePaymentConfig,
  useGetWalletConfig, useUpdateWalletConfig 
} from '@/hooks/useSystemConfigs';

// IMPORT TYPE
import { type OrderConfig, type PaymentConfig, type WalletConfig } from '@/services/configApi';

import { handleErrorToast } from '@/lib/error-handler';

// ==========================================
// 1. ORDER CONFIG CARD COMPONENT
// ==========================================
interface OrderConfigCardProps {
  initialData: OrderConfig;
  onSave: (data: OrderConfig) => void;
  isPending: boolean;
}

function OrderConfigCard({ initialData, onSave, isPending }: OrderConfigCardProps) {
  const [orderMustCompleteInDays, setOrderMustCompleteInDays] = useState<number>(initialData.orderMustCompleteInDays);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-indigo-600" />
        <h2 className="font-semibold text-slate-800">Order Settings</h2>
      </div>
      <div className="p-5 flex-1 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Order Must Complete In (Days)
          </label>
          <div className="relative">
            <input 
              type="number" 
              min="0"
              value={orderMustCompleteInDays}
              onChange={(e) => setOrderMustCompleteInDays(Number(e.target.value))}
              className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/50 focus:border-indigo-600"
            />
            <span className="absolute right-3 top-2 text-slate-400 text-sm">days</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">The maximum number of days allowed to complete an order.</p>
        </div>
      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end mt-auto">
        <button 
          onClick={() => onSave({ orderMustCompleteInDays })} 
          disabled={isPending}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Order Rules
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 2. PAYMENT CONFIG CARD COMPONENT
// ==========================================
interface PaymentConfigCardProps {
  initialData: PaymentConfig;
  onSave: (data: PaymentConfig) => void;
  isPending: boolean;
}

function PaymentConfigCard({ initialData, onSave, isPending }: PaymentConfigCardProps) {
  const [onlinePaymentExpiredInDays, setOnlinePaymentExpiredInDays] = useState<number>(initialData.onlinePaymentExpiredInDays);
  const [onlineTransactionExpiredInMinutes, setOnlineTransactionExpiredInMinutes] = useState<number>(initialData.onlineTransactionExpiredInMinutes);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-emerald-600" />
        <h2 className="font-semibold text-slate-800">Payment Settings</h2>
      </div>
      <div className="p-5 flex-1 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Online Payment Expired In (Days)
          </label>
          <div className="relative">
            <input 
              type="number" min="0"
              value={onlinePaymentExpiredInDays}
              onChange={(e) => setOnlinePaymentExpiredInDays(Number(e.target.value))}
              className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600"
            />
            <span className="absolute right-3 top-2 text-slate-400 text-sm">days</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Online Transaction Expired In (Minutes)
          </label>
          <div className="relative">
            <input 
              type="number" min="0"
              value={onlineTransactionExpiredInMinutes}
              onChange={(e) => setOnlineTransactionExpiredInMinutes(Number(e.target.value))}
              className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600"
            />
            <span className="absolute right-3 top-2 text-slate-400 text-sm">mins</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Time limit for user to complete the checkout gateway process.</p>
        </div>
      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end mt-auto">
        <button 
          onClick={() => onSave({ onlinePaymentExpiredInDays, onlineTransactionExpiredInMinutes })} 
          disabled={isPending}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Payment Rules
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 3. WALLET CONFIG CARD COMPONENT
// ==========================================
interface WalletConfigCardProps {
  initialData: WalletConfig;
  onSave: (data: WalletConfig) => void;
  isPending: boolean;
}

function WalletConfigCard({ initialData, onSave, isPending }: WalletConfigCardProps) {
  const [onlineOrderReturnPercentage, setOnlineOrderReturnPercentage] = useState<number>(initialData.onlineOrderReturnPercentage);
  const [onlineOrderCompletedRewardPercentage, setOnlineOrderCompletedRewardPercentage] = useState<number>(initialData.onlineOrderCompletedRewardPercentage);
  const [codOrderCompletedRewardPercentage, setCodOrderCompletedRewardPercentage] = useState<number>(initialData.codOrderCompletedRewardPercentage);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:col-span-2">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-orange-500" />
        <h2 className="font-semibold text-slate-800">Wallet & Cashback Settings</h2>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Online Order Return
          </label>
          <div className="relative">
            <input 
              type="number" min="0" max="100"
              value={onlineOrderReturnPercentage}
              onChange={(e) => setOnlineOrderReturnPercentage(Number(e.target.value))}
              className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
            />
            <span className="absolute right-3 top-2 text-slate-400 text-sm">%</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Percentage returned for online orders.</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Online Order Reward
          </label>
          <div className="relative">
            <input 
              type="number" min="0" max="100"
              value={onlineOrderCompletedRewardPercentage}
              onChange={(e) => setOnlineOrderCompletedRewardPercentage(Number(e.target.value))}
              className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
            />
            <span className="absolute right-3 top-2 text-slate-400 text-sm">%</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Reward rate for completing online orders.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            COD Order Reward
          </label>
          <div className="relative">
            <input 
              type="number" min="0" max="100"
              value={codOrderCompletedRewardPercentage}
              onChange={(e) => setCodOrderCompletedRewardPercentage(Number(e.target.value))}
              className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
            />
            <span className="absolute right-3 top-2 text-slate-400 text-sm">%</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Reward rate for completing COD orders.</p>
        </div>
      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end mt-auto">
        <button 
          onClick={() => onSave({ onlineOrderReturnPercentage, onlineOrderCompletedRewardPercentage, codOrderCompletedRewardPercentage })} 
          disabled={isPending}
          className="flex items-center px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Wallet Rules
        </button>
      </div>
    </div>
  );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function SystemConfigurationsPage() {
  const { data: orderData, isLoading: loadingOrder } = useGetOrderConfig();
  const { mutate: updateOrder, isPending: updatingOrder } = useUpdateOrderConfig();

  const { data: paymentData, isLoading: loadingPayment } = useGetPaymentConfig();
  const { mutate: updatePayment, isPending: updatingPayment } = useUpdatePaymentConfig();

  const { data: walletData, isLoading: loadingWallet } = useGetWalletConfig();
  const { mutate: updateWallet, isPending: updatingWallet } = useUpdateWalletConfig();

  const isLoadingInitial = loadingOrder || loadingPayment || loadingWallet;

  if (isLoadingInitial) {
    return (
      <div className="flex items-center justify-center h-full w-full p-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 max-w-5xl mx-auto w-full space-y-6">
      
      {/* HEADER */}
      <div className="mb-2">
        <h1 className="text-slate-800 font-bold text-2xl tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Business Rules & Configurations
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage system-wide parameters for orders, payments, and wallet rewards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orderData && (
          <OrderConfigCard 
            key={`order-${JSON.stringify(orderData)}`}
            initialData={orderData} 
            onSave={(data) => {
              updateOrder(data, {
                onSuccess: () => toast.success("Order settings updated successfully!"),
                onError: (err) => handleErrorToast(err)
              })
            }} 
            isPending={updatingOrder} 
          />
        )}

        {paymentData && (
          <PaymentConfigCard 
            key={`payment-${JSON.stringify(paymentData)}`}
            initialData={paymentData} 
            onSave={(data) => {
              updatePayment(data, {
                onSuccess: () => toast.success("Payment settings updated successfully!"),
                onError: (err) => handleErrorToast(err)
              })
            }} 
            isPending={updatingPayment} 
          />
        )}

        {walletData && (
          <WalletConfigCard 
            key={`wallet-${JSON.stringify(walletData)}`}
            initialData={walletData} 
            onSave={(data) => {
              updateWallet(data, {
                onSuccess: () => toast.success("Wallet & Cashback settings updated successfully!"),
                onError: (err) => handleErrorToast(err)
              })
            }} 
            isPending={updatingWallet} 
          />
        )}
      </div>
    </div>
  );
}