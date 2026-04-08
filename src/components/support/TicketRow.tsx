import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Trash2, Truck } from 'lucide-react';

import type { SupportTicketListItemDto } from '@/services/supportTicketApi';
import { useDeliveryTrackings, useCreateDeliveryTracking } from '@/hooks/useDeliveryQueries';
import { TICKET_TYPE_LABEL, formatDateTime } from './constants';
import { TicketStatusBadge } from './shared';

export function TableRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-5 w-full" /></TableCell>
      ))}
    </TableRow>
  );
}

export function TicketRow({
  ticket,
  onView,
  onDelete,
  isDeleting,
  onShipmentCreated,
}: {
  ticket: SupportTicketListItemDto;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  onShipmentCreated?: () => void;
}) {
  const createDelivery = useCreateDeliveryTracking();
  const { data: deliveriesRes } = useDeliveryTrackings(ticket.orderId, true);

  const supportShipment = deliveriesRes?.data?.find(
    (d: any) => d.type === 'Support' && d.supportTicketId === ticket.id
  );

  const canDelete = ticket.status === 'Open';
  const hasShipment = !!supportShipment;

  const showReplacementBtn =
    (ticket.type === 'ReplacePart' || ticket.type === 'Exchange') &&
    ticket.status === 'Processing' &&
    !hasShipment;

  const handleCreateShipment = async () => {
    await createDelivery.mutateAsync({ orderId: ticket.orderId, supportTicketId: ticket.id });
    onShipmentCreated?.();
  };

  return (
    <TableRow>
      <TableCell className="font-mono text-xs font-medium">
        {(ticket as any).code ?? ticket.id}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {TICKET_TYPE_LABEL[ticket.type] ?? ticket.type}
        </Badge>
      </TableCell>
      <TableCell>
        <TicketStatusBadge status={ticket.status} />
      </TableCell>
      <TableCell className="max-w-[200px]">
        <p className="truncate text-sm text-muted-foreground">{ticket.reason}</p>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDateTime(ticket.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {showReplacementBtn && (
            <Button
              size="sm" variant="default"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCreateShipment}
              disabled={createDelivery.isPending}
            >
              <Truck className="h-3.5 w-3.5" />
              {createDelivery.isPending ? 'Creating...' : 'Create Replacement'}
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={() => onView(ticket.id)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" /> View Detail
          </Button>

          {canDelete && (
            <Button
              size="sm" variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => onDelete(ticket.id)}
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}