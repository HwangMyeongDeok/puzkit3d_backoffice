import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type InstockCustomerOrderListItemDto } from '@/types/types';

import { formatCurrency, formatDateTime, getStatusBadgeVariant } from './utils';

export function OrderRow({
  order,
  onView,
  onMoveToProcessing,
  isUpdating,
}: {
  order: InstockCustomerOrderListItemDto;
  onView: (orderId: string) => void;
  onMoveToProcessing: (orderId: string) => void;
  isUpdating: boolean;
}) {
  const canMoveToProcessing = order.status === 'Paid' || order.status === 'Waiting';

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div>
          <p>{order.code}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium">{order.customerName || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{order.customerPhone || 'N/A'}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <Badge variant={getStatusBadgeVariant(order.status)} className="w-fit">
            {order.status}
          </Badge>
          <p className="text-xs text-muted-foreground">{order.paymentMethod}</p>
        </div>
      </TableCell>
      <TableCell>{order.totalQuantity}</TableCell>
      <TableCell className="font-medium">{formatCurrency(order.grandTotalAmount)}</TableCell>
      <TableCell>
        <Badge variant={order.isPaid ? 'default' : 'secondary'}>
          {order.isPaid ? 'Paid' : 'Unpaid'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          {order.orderDetailsPreview.slice(0, 2).map((item, index) => (
            <span
              key={`${order.id}-${index}`}
              className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
            >
              {item.productName} x{item.quantity}
            </span>
          ))}
          {order.orderDetailsPreview.length > 2 && (
            <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
              +{order.orderDetailsPreview.length - 2} more
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {canMoveToProcessing && (
            <Button size="sm" onClick={() => onMoveToProcessing(order.id)} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Move to Processing'}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onView(order.id)}>
            View Details
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}