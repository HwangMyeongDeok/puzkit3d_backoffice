import { type InstockOrderStatus } from '@/types/types';

export const PAGE_SIZE = 10;
export const ALL_STATUS = '__ALL__';
export const COIN_EARN_RATE = 0.01;

export const DEBUG_STATUSES: InstockOrderStatus[] = [
  'Pending', 'Processing', 'Waiting', 'HandedOverToDelivery', 
  'Paid', 'Completed', 'Delivered', 'Delivering', 
  'Cancelled', 'Returned', 'Expired',
];

export const GHN_STATUS_MAP: Record<string, { label: string; color: string }> = {
  ready_to_pick:       { label: 'Ready to Pick',        color: 'text-blue-500' },
  picking:             { label: 'Picking',               color: 'text-yellow-500' },
  picked:              { label: 'Picked',                color: 'text-yellow-600' },
  storing:             { label: 'In Warehouse',          color: 'text-orange-500' },
  transporting:        { label: 'Transporting',          color: 'text-purple-500' },
  delivering:          { label: 'Out for Delivery',      color: 'text-indigo-500' },
  delivered:           { label: 'Delivered',             color: 'text-green-600' },
  delivery_fail:       { label: 'Delivery Failed',       color: 'text-red-500' },
  waiting_to_return:   { label: 'Waiting to Return',     color: 'text-amber-500' },
  return:              { label: 'Returning',             color: 'text-orange-600' },
  return_transporting: { label: 'Return Transporting',  color: 'text-orange-700' },
  returning:           { label: 'Returning to Sender',  color: 'text-red-600' },
  return_fail:         { label: 'Return Failed',        color: 'text-red-700' },
  returned:            { label: 'Returned',             color: 'text-gray-500' },
  cancel:              { label: 'Cancelled',            color: 'text-gray-400' },
  damage:              { label: 'Damaged / Lost',       color: 'text-red-800' },
};