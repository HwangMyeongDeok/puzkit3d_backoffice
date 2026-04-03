import { useEffect } from 'react';
import { Receipt } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerOrderById, useInstockOrderDeliveryTracking } from '@/hooks/useInstockOrderQueries';

import { OrderDetailContent } from './OrderDetailContent';

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
  const queryClient = useQueryClient();
  const { data: order, isLoading, error } = useCustomerOrderById(orderId);
  const { data: deliveryTracking } = useInstockOrderDeliveryTracking(orderId, open && !!orderId);

  const displayOrder =
    order && deliveryTracking?.statusUpdated
      ? { ...order, status: deliveryTracking.orderStatus }
      : order;

  useEffect(() => {
    if (open && orderId && deliveryTracking?.statusUpdated) {
      queryClient.invalidateQueries({ queryKey: ['instock-orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['instock-orders', 'detail', orderId] });
    }
  }, [deliveryTracking?.statusUpdated, open, orderId, queryClient]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-full max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="border-b px-6 py-5 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {order ? `Order ${order.code}` : 'Order Details'}
          </DialogTitle>
          <DialogDescription>
            View order info, delivery tracking, and individual items.
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
            ) : displayOrder ? (
              <OrderDetailContent
                order={displayOrder}
                ghnStatus={deliveryTracking?.ghnStatus}
                statusUpdated={deliveryTracking?.statusUpdated ?? false}
                trackingLogs={deliveryTracking?.logs}
              />
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}