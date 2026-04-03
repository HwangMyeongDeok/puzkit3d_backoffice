import { type InstockOrderStatus } from '@/types/types';

export const getImageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

export const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0 ₫';
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN');
};

export const getStatusBadgeVariant = (
  status: InstockOrderStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (['Paid', 'Completed', 'Delivered'].includes(status)) return 'default';
  if (['Cancelled', 'Rejected', 'Returned'].includes(status)) return 'destructive';
  if (['Pending', 'Processing', 'Waiting', 'Shipping', 'HandedOverToDelivery', 'ReadyToPick'].includes(status)) return 'secondary';
  return 'outline';
};

export const getDeliveryStatusColor = (status: string): string => {
  const s = status.toLowerCase();
  if (s.includes('delivered') && !s.includes('fail')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  if (s.includes('cancel') || s.includes('fail') || s.includes('damage')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  if (s.includes('return')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  if (s.includes('ready') || s.includes('pick') || s.includes('process')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-secondary text-secondary-foreground';
};