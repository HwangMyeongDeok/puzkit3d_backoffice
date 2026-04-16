import { useState } from 'react';
import { Ticket } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

import { useGetTicketById, useUpdateTicketStatus, type TicketStatus } from '@/services/supportTicketApi';
import { useDeliveryTrackings, useCreateDeliveryTracking } from '@/hooks/useDeliveryQueries';
import { useCustomerOrderById } from '@/hooks/useInstockOrderQueries';

import { HandOverDialog } from '../HandOverDialog';
import { TicketActionCard } from './TicketActionCard';
import { TicketSummaryCard } from './TicketSummaryCard';
import { TicketShipmentCard } from './TicketShipmentCard';
import { TicketAffectedItems } from './TicketAffectedItems';
import type { DeliveryTracking } from '@/services/deliveryApi';

interface Props {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onShipmentCreated?: () => void;
}

export function TicketDetailDialog({ ticketId, open, onOpenChange, onShipmentCreated }: Props) {
  // --- Data Fetching Hooks ---
  const { data: ticket, isLoading, error } = useGetTicketById(ticketId, open);
  const { data: orderData } = useCustomerOrderById(ticket?.orderId ?? null);
  const { data: deliveriesRes, refetch: refetchDeliveries } = useDeliveryTrackings(ticket?.orderId ?? '', open && !!ticket?.orderId);
  console.log(deliveriesRes);
  // --- Mutations ---
  const { mutateAsync: updateTicketStatusAsync, isPending: isUpdatingTicket } = useUpdateTicketStatus();
  const createDelivery = useCreateDeliveryTracking();

  // --- State ---
  const [handOverDialogTrackingId, setHandOverDialogTrackingId] = useState<string | null>(null);

  const supportShipment = deliveriesRes?.data?.find((d: DeliveryTracking) => d.type === 'Support' && d.supportTicketId === ticket?.id);

  // --- Handlers ---
  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticketId) return;
    try {
      await updateTicketStatusAsync({ id: ticketId, status });
      toast.success(`Ticket status updated to ${status}`);
    } catch (err) {
      toast.error("Failed to update ticket status");
    }
  };

  const handleCreateShipment = async () => {
    if (!ticket) return;
    await createDelivery.mutateAsync(
      { orderId: ticket.orderId, supportTicketId: ticket.id },
      { onSuccess: () => { refetchDeliveries(); onShipmentCreated?.(); } }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[90vh] max-h-[90vh] w-full max-w-5xl flex-col gap-0 p-0">
          <DialogHeader className="border-b px-6 py-5 shrink-0 bg-background">
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              {ticket ? `Ticket ${(ticket as any).code ?? ticket.id}` : 'Ticket Details'}
            </DialogTitle>
            <DialogDescription>
              Full evidence, items, and staff actions for this ticket.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-auto bg-muted/10">
            <div className="px-6 py-5 space-y-5">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" />
                  </div>
                </div>
              ) : error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  Failed to load ticket details. Please try again.
                </div>
              ) : ticket ? (
                <>
                  <TicketActionCard 
                    currentStatus={ticket.status} 
                    isUpdating={isUpdatingTicket} 
                    onStatusChange={handleStatusChange} 
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <TicketSummaryCard ticket={ticket} orderData={orderData} />
                    <TicketShipmentCard 
                      ticket={ticket} 
                      supportShipment={supportShipment} 
                      isCreating={createDelivery.isPending} 
                      onCreateShipment={handleCreateShipment}
                      onHandOverClick={setHandOverDialogTrackingId} 
                    />
                  </div>

                  <TicketAffectedItems 
                    details={ticket.details} 
                    ticketType={ticket.type} 
                    orderData={orderData} 
                  />
                </>
              ) : null}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <HandOverDialog 
  trackingId={handOverDialogTrackingId} 
  orderId={ticket?.orderId}    // 👉 Truyền orderId vào đây
  onClose={() => setHandOverDialogTrackingId(null)} 
  onSuccess={() => refetchDeliveries()}
/>
    </>
  );
}