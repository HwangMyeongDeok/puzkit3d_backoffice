import { Receipt } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerOrderById, useInstockOrderDeliveryTracking } from '@/hooks/useInstockOrderQueries';

import { OrderDetailContent } from './OrderDetailContent';
import type { InstockOrderDeliveryTrackingDto } from '@/types/types';

function OrderDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function OrderDetailDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: order, isLoading, error } = useCustomerOrderById(orderId);
  
  const { data: deliveriesRes} = useInstockOrderDeliveryTracking(orderId, open && !!orderId);
  const deliveries = (deliveriesRes?.data as InstockOrderDeliveryTrackingDto[]) || [];
  console.log(deliveries);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-full max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="border-b px-6 py-5 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {order ? `Order ${order.code}` : 'Order Details'}
          </DialogTitle>
          <DialogDescription>
            View order info, delivery trackings, and individual items.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-6 py-5">
            {isLoading ? (
              <OrderDetailSkeleton />
            ) : error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                Failed to load order details. Please try again.
              </div>
            ) : order ? (
              <OrderDetailContent
                order={order}
                deliveries={deliveries}
              />
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}