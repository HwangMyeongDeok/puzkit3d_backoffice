import { useState } from 'react';
import { Ticket } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

// Cần đảm bảo các API hook của bạn trả về đúng type SupportTicketDto
import { useGetTicketById, useUpdateTicketStatus } from '@/services/supportTicketApi';
import type { TicketStatus } from '@/services/supportTicketApi'; // Hoặc lấy từ file type nếu bạn đã tách file
import { useDeliveryTrackings, useCreateDeliveryTracking } from '@/hooks/useDeliveryQueries';
import { useCustomerOrderById } from '@/hooks/useInstockOrderQueries';

import { HandOverDialog } from '../HandOverDialog';
import { TicketActionCard } from './TicketActionCard';
import { TicketSummaryCard } from './TicketSummaryCard';
import { TicketShipmentCard } from './TicketShipmentCard';
import { TicketAffectedItems } from './TicketAffectedItems';

import { handleErrorToast } from '@/lib/error-handler';

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
  const { data: deliveriesRes, refetch: refetchDeliveries } = useDeliveryTrackings(
    ticket?.orderId ?? '', 
    open && !!ticket?.orderId
  );

  // --- Mutations ---
  const { mutateAsync: updateTicketStatusAsync, isPending: isUpdatingTicket } = useUpdateTicketStatus();
  const createDelivery = useCreateDeliveryTracking();

  // --- State ---
  const [handOverDialogTrackingId, setHandOverDialogTrackingId] = useState<string | null>(null);

  // --- Handlers ---
  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticketId) return;
    try {
      await updateTicketStatusAsync({ id: ticketId, status });
      toast.success(`Ticket status updated to ${status}`);
    } catch (error) {
      handleErrorToast(error, "Failed to update ticket status");
    }
  };

  const handleCreateShipment = async () => {
    if (!ticket) return;
    try {
      await createDelivery.mutateAsync(
        { orderId: ticket.orderId, supportTicketId: ticket.id },
        { 
          onSuccess: () => { 
            refetchDeliveries(); 
            onShipmentCreated?.(); 
          } 
        }
      );
    } catch (error) {
      handleErrorToast(error, "Failed to create shipment");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[90vh] max-h-[90vh] w-full max-w-5xl flex-col gap-0 p-0">
          <DialogHeader className="bg-background shrink-0 border-b px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              {/* Đã xóa (ticket as any), dùng trực tiếp ticket.code do đã update DTO trước đó */}
              {ticket ? `Ticket ${ticket.code ?? ticket.id}` : 'Ticket Details'}
            </DialogTitle>
            <DialogDescription>
              Full evidence, items, and staff actions for this ticket.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="bg-muted/10 flex-1 overflow-auto">
            <div className="space-y-5 px-6 py-5">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                </div>
              ) : error ? (
                <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
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
                     deliveries={deliveriesRes?.data || []}
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
        orderId={ticket?.orderId ?? null}
        skipOrderStatusUpdate={true}
        onClose={() => setHandOverDialogTrackingId(null)} 
        onSuccess={() => refetchDeliveries()}
      />
    </>
  );
}