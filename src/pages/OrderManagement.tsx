import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Package2,
  Phone,
  Printer,
  Receipt,
  ShoppingBag,
  Truck,
  Coins,
  FlaskConical,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import {
  INSTOCK_ORDER_STATUSES,
  useCreateInstockOrderDeliveryTracking,
  useCustomerOrderById,
  useCustomerOrders,
  useInstockOrderDeliveryTracking,
  useUpdateInstockOrderStatus,
} from '@/hooks/useInstockOrderQueries';
import { instockOrderApi } from '@/services/instockOrderApi';
import { useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
  InstockCustomerOrderDto,
  InstockCustomerOrderListItemDto,
  InstockOrderStatus,
} from '@/types/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const ALL_STATUS = '__ALL__';
const COIN_EARN_RATE = 0.01; // 1% of grand total

/** Statuses that can be manually set in Debug Mode */
const DEBUG_STATUSES: InstockOrderStatus[] = [
  'Pending',
  'Processing',
  'Waiting',
  'Shipping',
  'HandedOverToDelivery',
  'Paid',
  'Completed',
  'Delivered',
  'Cancelled',
  'Rejected',
  'Returned',
];

/** GHN status → human-readable label & icon */
const GHN_STATUS_MAP: Record<string, { label: string; color: string }> = {
  ready_to_pick: { label: 'Ready to Pick', color: 'text-blue-500' },
  picking: { label: 'Picking', color: 'text-yellow-500' },
  picked: { label: 'Picked', color: 'text-yellow-600' },
  storing: { label: 'In Warehouse', color: 'text-orange-500' },
  transporting: { label: 'Transporting', color: 'text-purple-500' },
  delivering: { label: 'Out for Delivery', color: 'text-indigo-500' },
  delivered: { label: 'Delivered', color: 'text-green-600' },
  delivery_fail: { label: 'Delivery Failed', color: 'text-red-500' },
  waiting_to_return: { label: 'Waiting to Return', color: 'text-amber-500' },
  return: { label: 'Returning', color: 'text-orange-600' },
  return_transporting: { label: 'Return Transporting', color: 'text-orange-700' },
  returning: { label: 'Returning to Sender', color: 'text-red-600' },
  return_fail: { label: 'Return Failed', color: 'text-red-700' },
  returned: { label: 'Returned', color: 'text-gray-500' },
  cancel: { label: 'Cancelled', color: 'text-gray-400' },
  damage: { label: 'Damaged / Lost', color: 'text-red-800' },
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('vi-VN');
};

const getStatusBadgeVariant = (
  status: InstockOrderStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (['Paid', 'Completed', 'Delivered'].includes(status)) return 'default';
  if (['Cancelled', 'Rejected', 'Returned'].includes(status)) return 'destructive';
  if (
    ['Pending', 'Processing', 'Waiting', 'Shipping', 'HandedOverToDelivery', 'ReadyToPick'].includes(
      status,
    )
  ) {
    return 'secondary';
  }
  return 'outline';
};

// ─── Shared small components ──────────────────────────────────────────────────

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="max-w-[60%] text-right font-medium break-words">{value || 'N/A'}</span>
  </div>
);

// ─── Shipping Timeline ────────────────────────────────────────────────────────

interface TrackingLog {
  status: string;
  updatedDate?: string | null;
  description?: string | null;
}

function ShippingTimeline({
  logs,
  currentGhnStatus,
}: {
  logs?: TrackingLog[];
  currentGhnStatus?: string;
}) {
  const hasLogs = logs && logs.length > 0;

  if (!currentGhnStatus && !hasLogs) {
    return (
      <p className="text-sm text-muted-foreground">No tracking information available yet.</p>
    );
  }

  // If no detailed logs but we have current status, show a single node
  const displayLogs: TrackingLog[] = hasLogs
    ? logs!
    : currentGhnStatus
    ? [{ status: currentGhnStatus }]
    : [];

  return (
    <ol className="relative border-l border-muted ml-2 space-y-0">
      {displayLogs.map((log, index) => {
        const meta = GHN_STATUS_MAP[log.status] ?? { label: log.status, color: 'text-gray-500' };
        const isFirst = index === 0;
        return (
          <li key={index} className="mb-0 ml-4">
            <span
              className={`absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background ${
                isFirst ? 'bg-primary' : 'bg-muted-foreground/40'
              }`}
            />
            <div className="pb-5">
              <p className={`text-sm font-semibold ${isFirst ? 'text-foreground' : 'text-muted-foreground'}`}>
                <span className={meta.color}>{meta.label}</span>
              </p>
              {log.updatedDate && (
                <time className="text-xs text-muted-foreground">{formatDateTime(log.updatedDate)}</time>
              )}
              {log.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{log.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Waybill Button ───────────────────────────────────────────────────────────

function PrintWaybillButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      const url = await instockOrderApi.getWaybillUrl(orderId);
      if (!url) throw new Error('No waybill URL returned.');
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success('Waybill opened in a new tab.');
    } catch (err) {
      toast.error('Failed to retrieve waybill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handlePrint} disabled={loading}>
      <Printer className="mr-1.5 h-4 w-4" />
      {loading ? 'Loading...' : 'Print Waybill'}
    </Button>
  );
}

// ─── Debug Mode Panel ─────────────────────────────────────────────────────────

function DebugModePanel({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: InstockOrderStatus;
}) {
  const [open, setOpen] = useState(false);
  const updateStatusMutation = useUpdateInstockOrderStatus();

  const handleOverride = async (status: InstockOrderStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ orderId, data: { newStatus: status } });
      toast.success(`[Debug] Status overridden to "${status}".`);
    } catch {
      toast.error('[Debug] Failed to override status.');
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400"
        onClick={() => setOpen((v) => !v)}
      >
        <FlaskConical className="h-4 w-4" />
        Debug / Demo Mode
        <span className="ml-auto text-xs font-normal opacity-70">{open ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Manually override status for testing. Current: <strong>{currentStatus}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {DEBUG_STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-300"
                disabled={updateStatusMutation.isPending}
                onClick={() => handleOverride(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Order Detail Content ─────────────────────────────────────────────────────

function OrderDetailContent({
  order,
  ghnStatus,
  statusUpdated,
  trackingLogs,
}: {
  order: InstockCustomerOrderDto;
  ghnStatus?: string;
  statusUpdated: boolean;
  trackingLogs?: TrackingLog[];
}) {
  const fullAddress = [
    order.detailAddress,
    order.customerWardName,
    order.customerDistrictName,
    order.customerProvinceName,
  ]
    .filter(Boolean)
    .join(', ');

  const estimatedCoins = Math.floor(order.grandTotalAmount * COIN_EARN_RATE);
  const isDelivered = order.status === 'Delivered';
  const hasDeliveryCode = !!order.deliveryOrderCode;

  return (
    <>
      {/* Debug Mode */}
      <DebugModePanel orderId={order.id} currentStatus={order.status} />

      {/* Summary + Delivery row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Status" value={order.status} />
            <InfoRow label="GHN Status" value={ghnStatus ? (GHN_STATUS_MAP[ghnStatus]?.label ?? ghnStatus) : 'N/A'} />
            <InfoRow label="Status Synced" value={statusUpdated ? 'Yes' : 'No'} />
            <InfoRow label="Payment Method" value={order.paymentMethod} />
            <InfoRow label="Paid" value={order.isPaid ? 'Yes' : 'No'} />
            <InfoRow label="Created At" value={formatDateTime(order.createdAt)} />
            <InfoRow label="Updated At" value={formatDateTime(order.updatedAt)} />
            <InfoRow label="Paid At" value={formatDateTime(order.paidAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4" />
                Delivery
              </CardTitle>
              {hasDeliveryCode && <PrintWaybillButton orderId={order.id} />}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Delivery Code" value={order.deliveryOrderCode || 'N/A'} />
            <InfoRow label="Expected Date" value={formatDateTime(order.expectedDeliveryDate)} />
            <InfoRow label="Address" value={fullAddress || 'N/A'} />
          </CardContent>
        </Card>
      </div>

      {/* Shipping Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Shipping Timeline
          </CardTitle>
          <CardDescription>Live tracking events from GHN.</CardDescription>
        </CardHeader>
        <CardContent>
          <ShippingTimeline logs={trackingLogs} currentGhnStatus={ghnStatus} />
        </CardContent>
      </Card>

      {/* Customer + Payment */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Name" value={order.customerName} />
            <InfoRow label="Phone" value={order.customerPhone} />
            <InfoRow label="Email" value={order.customerEmail} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              Payment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Subtotal" value={formatCurrency(order.subTotalAmount)} />
            <InfoRow label="Shipping Fee" value={formatCurrency(order.shippingFee)} />
            <InfoRow label="Used Coin" value={order.usedCoinAmount.toLocaleString('vi-VN')} />
            <InfoRow label="Coin Discount" value={formatCurrency(order.usedCoinAmountAsMoney)} />
            <Separator />
            <InfoRow label="Grand Total" value={formatCurrency(order.grandTotalAmount)} />
            <Separator />
            {/* Coin Incentive */}
            <div className="flex items-start justify-between gap-4 rounded-md bg-yellow-50 dark:bg-yellow-950/20 px-3 py-2 text-sm border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400">
                <Coins className="h-4 w-4 shrink-0" />
                <span>
                  {isDelivered ? 'Coins Earned' : 'Est. Coins to Earn'}
                </span>
                {!isDelivered && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-3.5 w-3.5 opacity-60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[180px] text-xs">
                          Customer receives {COIN_EARN_RATE * 100}% of grand total as coins once the order is <strong>Delivered</strong>.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                {estimatedCoins.toLocaleString('vi-VN')} coins
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package2 className="h-4 w-4" />
            Order Items
          </CardTitle>
          <CardDescription>{order.orderDetails.length} item(s) in this order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.orderDetails.map((detail) => (
            <div key={detail.id} className="rounded-lg border p-4">
              <div className="flex gap-4">
                {detail.thumbnailUrl ? (
                  <img
                    src={detail.thumbnailUrl}
                    alt={detail.productName}
                    className="h-20 w-20 rounded-lg border object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
                    No image
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{detail.productName}</p>
                      <p className="text-sm text-muted-foreground">{detail.variantName}</p>
                    </div>
                    <Badge variant="outline">{detail.priceName || 'Default price'}</Badge>
                  </div>

                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <InfoRow label="SKU" value={detail.sku} />
                    <InfoRow label="Color" value={detail.variantDetails.color} />
                    <InfoRow label="Quantity" value={detail.quantity.toString()} />
                    <InfoRow label="Unit Price" value={formatCurrency(detail.unitPrice)} />
                    <InfoRow label="Total" value={formatCurrency(detail.totalAmount)} />
                    <InfoRow
                      label="Size"
                      value={`${detail.variantDetails.assembledLengthMm} x ${detail.variantDetails.assembledWidthMm} x ${detail.variantDetails.assembledHeightMm} mm`}
                    />
                  </div>

                  <div className="rounded-md bg-muted/40 p-3 text-sm">
                    <p className="font-medium">{detail.productDetails.name}</p>
                    <p className="mt-1 text-muted-foreground">
                      {detail.productDetails.description || 'No product description.'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Code: {detail.productDetails.code}</span>
                      <span>Level: {detail.productDetails.difficultLevel}</span>
                      <span>Pieces: {detail.productDetails.totalPieceCount}</span>
                      <span>Build time: {detail.productDetails.estimatedBuildTime} min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Order Detail Skeleton ────────────────────────────────────────────────────

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

// ─── Order Detail Sheet ───────────────────────────────────────────────────────

function OrderDetailSheet({
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
  const { data: deliveryTracking } = useInstockOrderDeliveryTracking(
    orderId,
    open && !!orderId,
  );

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {order ? `Order ${order.code}` : 'Order Details'}
            </SheetTitle>
            <SheetDescription>
              View order info, delivery tracking, and individual items.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-6 px-6 py-5">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Order Row ────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  onView,
  onMoveToProcessing,
  onCreateDelivery,
  isUpdating,
  isCreatingDelivery,
}: {
  order: InstockCustomerOrderListItemDto;
  onView: (orderId: string) => void;
  onMoveToProcessing: (orderId: string) => void;
  onCreateDelivery: (orderId: string) => void;
  isUpdating: boolean;
  isCreatingDelivery: boolean;
}) {
  const canMoveToProcessing = order.status === 'Paid' || order.status === 'Waiting';
  const canCreateDelivery = order.status === 'Processing';

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
            <Button
              size="sm"
              onClick={() => onMoveToProcessing(order.id)}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Move to Processing'}
            </Button>
          )}
          {canCreateDelivery && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onCreateDelivery(order.id)}
              disabled={isCreatingDelivery}
            >
              {isCreatingDelivery ? 'Creating...' : 'Create Delivery'}
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

// ─── Main Export ──────────────────────────────────────────────────────────────

export function OrderManagement() {
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const updateOrderStatusMutation = useUpdateInstockOrderStatus();
  const createDeliveryTrackingMutation = useCreateInstockOrderDeliveryTracking();

  const { data, isLoading, error } = useCustomerOrders({
    pageNumber,
    pageSize: PAGE_SIZE,
    status:
      statusFilter === ALL_STATUS
        ? undefined
        : (statusFilter as InstockOrderStatus),
  });

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setSheetOpen(true);
  };

  const handleMoveToProcessing = async (orderId: string) => {
    try {
      await updateOrderStatusMutation.mutateAsync({
        orderId,
        data: { newStatus: 'Processing' },
      });
      toast.success('Order status updated to Processing.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to update order status. ${message}`);
    }
  };

  const handleCreateDelivery = async (orderId: string) => {
    try {
      await createDeliveryTrackingMutation.mutateAsync(orderId);
      const deliveryTracking = await instockOrderApi.getDeliveryTracking(orderId);
      toast.success(
        deliveryTracking.ghnStatus
          ? `Delivery order created. GHN status: ${deliveryTracking.ghnStatus}`
          : 'Delivery order created successfully.',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to create delivery order. ${message}`);
    }
  };

  const stats = useMemo(() => {
    const items = data?.items || [];
    const paidCount = items.filter((item) => item.isPaid).length;
    const processingCount = items.filter((item) =>
      ['Pending', 'Processing', 'Waiting', 'Shipping', 'HandedOverToDelivery'].includes(item.status),
    ).length;
    const totalRevenue = items.reduce((sum, item) => sum + item.grandTotalAmount, 0);
    return { totalOrders: data?.totalCount || 0, paidCount, processingCount, totalRevenue };
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">
            Manage all orders, shipping, and delivery tracking for staff role.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Page size:</span>
          <span className="font-semibold">{PAGE_SIZE}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-2xl">{stats.totalOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paid Orders (this page)</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              {stats.paidCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue (this page)</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(stats.totalRevenue)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              Filter by status and open each order for full details.
            </CardDescription>
          </div>
          <div className="w-full md:w-56">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPageNumber(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUS}>All Statuses</SelectItem>
                {INSTOCK_ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              Failed to load orders. Please refresh and try again.
            </div>
          )}

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-10 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-8 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : !data?.items.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No orders match the current filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      onView={handleViewOrder}
                      onMoveToProcessing={handleMoveToProcessing}
                      onCreateDelivery={handleCreateDelivery}
                      isUpdating={
                        updateOrderStatusMutation.isPending &&
                        updateOrderStatusMutation.variables?.orderId === order.id
                      }
                      isCreatingDelivery={
                        createDeliveryTrackingMutation.isPending &&
                        createDeliveryTrackingMutation.variables === order.id
                      }
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {data && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Page {data.pageNumber} of {data.totalPages || 1} &bull; {data.totalCount} orders &bull;{' '}
                {stats.processingCount} in progress on this page
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasPreviousPage}
                  onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasNextPage}
                  onClick={() => setPageNumber((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <OrderDetailSheet
        orderId={selectedOrderId}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedOrderId(null);
        }}
      />
    </div>
  );
}