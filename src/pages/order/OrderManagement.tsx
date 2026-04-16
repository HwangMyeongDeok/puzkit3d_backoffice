import { useEffect, useMemo, useRef, useState } from 'react';
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
  ExternalLink,
  RefreshCw,
  Loader2,
  ImagePlus,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import {
  INSTOCK_ORDER_STATUSES,
  useCustomerOrderById,
  useCustomerOrders,
  useInstockOrderDeliveryTracking,
  useUpdateInstockOrderStatus,
} from '@/hooks/useInstockOrderQueries';
import { instockOrderApi } from '@/services/instockOrderApi';

import {
  PARTNER_ORDER_STATUSES,
  type PartnerOrderDetailDto,
  type PartnerOrderListItemDto,
  type PartnerOrderStatus,
  type PartnerOrderDisplayStatus,
} from '@/services/partnerOrderApi';
import {
  usePartnerOrderById,
  usePartnerOrders,
  useUpdatePartnerOrderStatus,
} from '@/hooks/usePartnerOrderQueries';

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  CreateDeliveryTrackingDto,
} from '@/types/types';
import {
  useDeliveryTrackingById,
  useDeliveryTrackings,
  useCreateDeliveryTracking,
  useUpdateHandOverImage,
} from '@/hooks/useDeliveryQueries';
import { uploadApi } from '@/services/uploadApi';

const PAGE_SIZE = 10;
const ALL_STATUS = '__ALL__';
const COIN_EARN_RATE = 0.01;

const DEBUG_STATUSES: InstockOrderStatus[] = [
  'Pending',
  'Processing',
  'Waiting',
  'HandedOverToDelivery',
  'Paid',
  'Completed',
  'Delivered',
  'Delivering',
  'Cancelled',
  'Returned',
  'Expired',
];

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

interface DeliveryTrackingDetail {
  id: string;
  type: string;
  itemId: string;
  quantity: number;
}

interface DeliveryTracking {
  id: string;
  orderId: string;
  supportTicketId: string | null;
  deliveryOrderCode: string;
  status: string;
  type: string;
  note: string | null;
  expectedDeliveryDate: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  handOverImageUrl?: string | null;
  details: DeliveryTrackingDetail[];
}

interface DeliveryTrackingResponse {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  data: DeliveryTracking[];
}

const getImageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

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
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (['Paid', 'Completed', 'Delivered'].includes(status)) return 'default';

  if (
    [
      'Cancelled',
      'Rejected',
      'Returned',
      'Expired',
      'CancelledByCustomer',
      'CancelledByStaff',
      'CheckingFailed',
    ].includes(status)
  ) {
    return 'destructive';
  }

  if (
    [
      'Pending',
      'Processing',
      'Waiting',
      'Shipping',
      'HandedOverToDelivery',
      'ReadyToPick',
      'WatingForReorder',
      'OrderedFromPartner',
      'ReceivedAtWarehouse',
      'Delivering',
    ].includes(status)
  ) {
    return 'secondary';
  }

  return 'outline';
};

const getDeliveryStatusColor = (status: string): string => {
  const s = status.toLowerCase();
  if (s.includes('delivered') && !s.includes('fail')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  }
  if (s.includes('cancel') || s.includes('fail') || s.includes('damage')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }
  if (s.includes('return')) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  }
  if (s.includes('ready') || s.includes('pick') || s.includes('process')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  }
  return 'bg-secondary text-secondary-foreground';
};

const PARTNER_STATUS_LABELS: Record<string, string> = {
  Pending: 'Pending',
  Paid: 'Paid',
  WatingForReorder: 'Waiting For Reorder',
  OrderedFromPartner: 'Ordered From Partner',
  ReceivedAtWarehouse: 'Received At Warehouse',
  CheckingFailed: 'Checking Failed',
  Processing: 'Processing',
  HandedOverToDelivery: 'Handed Over To Delivery',
  Completed: 'Completed',
  Expired: 'Expired',
  CancelledByCustomer: 'Cancelled By Customer',
  CancelledByStaff: 'Cancelled By Staff',
  Returned: 'Returned',
  Delivering: 'Delivering',
  Delivered: 'Delivered',
};

const PARTNER_IN_PROGRESS_STATUSES = [
  'Pending',
  'Paid',
  'WatingForReorder',
  'OrderedFromPartner',
  'ReceivedAtWarehouse',
  'Processing',
  'HandedOverToDelivery',
  'Delivering',
];

const formatPartnerStatus = (status?: string | null) => {
  if (!status) return 'N/A';
  return PARTNER_STATUS_LABELS[status] || status;
};

const getLatestTracking = (trackings: DeliveryTracking[]) => {
  if (!trackings.length) return null;
  return [...trackings].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  })[0];
};

const getPartnerDisplayStatus = (
  orderStatus: PartnerOrderStatus,
  trackings: DeliveryTracking[],
): PartnerOrderDisplayStatus => {
  const latestTracking = getLatestTracking(trackings);

  if (['Completed', 'Expired', 'CancelledByCustomer', 'CancelledByStaff', 'Returned'].includes(orderStatus)) {
    return orderStatus as PartnerOrderDisplayStatus;
  }

  if (!latestTracking) return orderStatus;

  const trackingStatus = (latestTracking.status || '').toLowerCase();

  if (
    ['return', 'return_transporting', 'returning', 'returned', 'waiting_to_return'].includes(
      trackingStatus,
    )
  ) {
    return 'Returned';
  }

  if (trackingStatus === 'delivered') {
    return 'Delivered';
  }

  if (
    [
      'ready_to_pick',
      'picking',
      'picked',
      'storing',
      'transporting',
      'delivering',
    ].includes(trackingStatus)
  ) {
    return 'Delivering';
  }

  return orderStatus;
};

type PartnerPrimaryAction =
  | { type: 'status'; label: string; newStatus: PartnerOrderStatus }
  | { type: 'create-delivery'; label: string }
  | null;

const getPartnerPrimaryAction = (
  orderStatus: PartnerOrderStatus,
  hasTracking: boolean,
): PartnerPrimaryAction => {
  switch (orderStatus) {
    case 'Pending':
    case 'Paid':
    case 'WatingForReorder':
      return {
        type: 'status',
        label: 'Ordered From Partner',
        newStatus: 'OrderedFromPartner',
      };

    case 'OrderedFromPartner':
      return {
        type: 'status',
        label: 'Received At Warehouse',
        newStatus: 'ReceivedAtWarehouse',
      };

    case 'ReceivedAtWarehouse':
      return {
        type: 'status',
        label: 'Move to Processing',
        newStatus: 'Processing',
      };

    case 'Processing':
      if (!hasTracking) {
        return {
          type: 'create-delivery',
          label: 'Create Delivery',
        };
      }
      return {
        type: 'status',
        label: 'Handed Over To Delivery',
        newStatus: 'HandedOverToDelivery',
      };

    default:
      return null;
  }
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="max-w-[60%] break-words text-right font-medium">{value || 'N/A'}</span>
  </div>
);

function OrderSourceBadge({ type }: { type: 'instock' | 'partner' }) {
  return (
    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
      {type === 'instock' ? 'Instock Product' : 'Partner Product'}
    </Badge>
  );
}

type OrderSummaryStats = {
  totalOrders: number;
  paidCount: number;
  processingCount: number;
  totalRevenue: number;
};

function OrderStatsCard({
  title,
  type,
  stats,
}: {
  title: string;
  type: 'instock' | 'partner';
  stats: OrderSummaryStats;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>Statistics separated by order source.</CardDescription>
          </div>
          <OrderSourceBadge type={type} />
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="mt-1 text-2xl font-bold">{stats.totalOrders}</p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Paid Orders</p>
          <p className="mt-1 text-2xl font-bold">{stats.paidCount}</p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="mt-1 text-2xl font-bold">{stats.processingCount}</p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

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
    return <p className="text-sm text-muted-foreground">No tracking information available yet.</p>;
  }

  const displayLogs: TrackingLog[] = hasLogs ? logs! : currentGhnStatus ? [{ status: currentGhnStatus }] : [];

  return (
    <ol className="relative ml-2 space-y-0 border-l border-muted">
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

interface WaybillResponse {
  waybillUrl: string;
}

function PrintWaybillButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      const response = (await instockOrderApi.getWaybillUrl(orderId)) as WaybillResponse;
      const finalUrl = response?.waybillUrl;
      if (!finalUrl) throw new Error('No waybill URL returned.');
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
      toast.success('Waybill opened in a new tab.');
    } catch (err) {
      console.error(err);
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
    <div className="rounded-lg border border-dashed border-amber-400 bg-amber-50 p-3 dark:bg-amber-950/20">
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

function DeliveryTrackingSection({
  orderId,
  orderStatus,
}: {
  orderId: string;
  orderStatus: InstockOrderStatus;
}) {
  const isHandedOver = orderStatus === 'HandedOverToDelivery';
  const [enabled, setEnabled] = useState(isHandedOver);

  const { data, isLoading, isError, refetch, isFetching } = useDeliveryTrackings(orderId, enabled);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateInstockOrderStatus();
  const { mutate: createTracking, isPending: isCreating } = useCreateDeliveryTracking();

  const trackings = ((data as DeliveryTrackingResponse | undefined)?.data ?? []) as DeliveryTracking[];

  const firstTracking = trackings[0];
  const targetStatuses: InstockOrderStatus[] = [
    'HandedOverToDelivery',
    'Delivering',
    'Delivered',
    'Completed',
    'Returned',
  ];
  const shouldAutoFetchDetail = !!firstTracking?.id && targetStatuses.includes(orderStatus);

  const { isFetching: isFetchingDetail, data: detailData } = useDeliveryTrackingById(
    firstTracking?.id ?? '',
    shouldAutoFetchDetail,
  );

  useEffect(() => {
    if (detailData) {
      refetch();
    }
  }, [detailData, refetch]);

  const { mutateAsync: updateHandOverImage } = useUpdateHandOverImage();

  const [submittingHandOver, setSubmittingHandOver] = useState<Record<string, boolean>>({});
  const [successHandOver, setSuccessHandOver] = useState<Record<string, boolean>>({});

  const [handOverDialogTrackingId, setHandOverDialogTrackingId] = useState<string | null>(null);
  const [handOverFile, setHandOverFile] = useState<File | null>(null);
  const [handOverPreview, setHandOverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const confirmHandOver = async () => {
    if (!handOverDialogTrackingId || !handOverFile) return;
    const trackingId = handOverDialogTrackingId;

    setSubmittingHandOver((prev) => ({ ...prev, [trackingId]: true }));

    try {
      const customPath = `hand-overs/${trackingId}-${Date.now()}`;
      const imageUrl = await uploadApi.uploadFileToS3(handOverFile, 'deliveries', customPath);

      await updateHandOverImage({ id: trackingId, imageUrl });

      updateStatus(
        {
          orderId,
          data: { newStatus: 'HandedOverToDelivery' },
        },
        {
          onSuccess: async () => {
            setSuccessHandOver((prev) => ({ ...prev, [trackingId]: true }));
            await refetch();
            setSubmittingHandOver((prev) => ({ ...prev, [trackingId]: false }));
            setHandOverDialogTrackingId(null);
            toast.success('Package handed over successfully!');
          },
          onError: (err) => {
            console.error('Lỗi cập nhật order status:', err);
            setSubmittingHandOver((prev) => ({ ...prev, [trackingId]: false }));
            toast.error('Hand over image uploaded but failed to update order status.');
          },
        },
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image or update status');
      setSubmittingHandOver((prev) => ({ ...prev, [trackingId]: false }));
    }
  };

  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [successCreate, setSuccessCreate] = useState(false);

  const handleCreateDelivery = () => {
    setSubmittingCreate(true);

    const payload: CreateDeliveryTrackingDto = {
      orderId,
      supportTicketId: null,
    };

    createTracking(payload, {
      onSuccess: async () => {
        setSuccessCreate(true);
        toast.success('Delivery tracking created successfully.');
        setEnabled(true);
        await refetch();
        setSubmittingCreate(false);
      },
      onError: (err) => {
        toast.error('Failed to create delivery tracking');
        console.error(err);
        setSubmittingCreate(false);
      },
    });
  };

  if (!enabled) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Truck className="h-4 w-4" />
          <span>Delivery tracking details not loaded yet.</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEnabled(true)}>
          <ExternalLink className="mr-1.5 h-4 w-4" />
          View Delivery Status
        </Button>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        <span>Failed to load delivery tracking data.</span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className={
              successCreate || trackings.length > 0
                ? 'h-8 cursor-not-allowed bg-slate-100 px-4 text-slate-400 shadow-none dark:bg-slate-800 dark:text-slate-500'
                : 'h-8 bg-slate-800 px-4 font-medium text-white shadow-sm transition-all active:scale-95 hover:bg-slate-700 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
            }
            onClick={handleCreateDelivery}
            disabled={isCreating || submittingCreate || successCreate || trackings.length > 0}
          >
            {isCreating || submittingCreate ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : successCreate || trackings.length > 0 ? (
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
            ) : (
              <Truck className="mr-1.5 h-4 w-4" />
            )}
            {successCreate || trackings.length > 0 ? 'Created' : 'Create Delivery'}
          </Button>

          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (trackings.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 shrink-0" />
          <span>No delivery tracking records found for this order.</span>
        </div>
        <Button
          size="sm"
          onClick={handleCreateDelivery}
          disabled={isCreating || submittingCreate || successCreate || trackings.length > 0}
          className={
            successCreate || trackings.length > 0
              ? 'h-8 cursor-not-allowed bg-slate-100 px-4 text-slate-400 shadow-none dark:bg-slate-800 dark:text-slate-500'
              : 'h-8 bg-slate-800 px-4 font-medium text-white shadow-sm transition-all active:scale-95 hover:bg-slate-700 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
          }
        >
          {isCreating || submittingCreate ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : successCreate || trackings.length > 0 ? (
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
          ) : (
            <Truck className="mr-1.5 h-4 w-4" />
          )}
          {successCreate || trackings.length > 0 ? 'Created' : 'Create Delivery'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{trackings.length} tracking record(s) found</p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className={
              successCreate || trackings.length > 0
                ? 'h-7 cursor-not-allowed bg-slate-100 px-3 text-xs text-slate-400 shadow-none dark:bg-slate-800 dark:text-slate-500'
                : 'h-7 bg-slate-800 px-3 text-xs font-medium text-white shadow-sm transition-all active:scale-95 hover:bg-slate-700 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
            }
            onClick={handleCreateDelivery}
            disabled={isCreating || submittingCreate || successCreate || trackings.length > 0}
          >
            {isCreating || submittingCreate ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : successCreate || trackings.length > 0 ? (
              <CheckCircle2 className="mr-1 h-3 w-3" />
            ) : (
              <Truck className="mr-1 h-3 w-3" />
            )}
            {successCreate || trackings.length > 0 ? 'Created' : 'Create Delivery'}
          </Button>

          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-1 h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {trackings.map((tracking) => (
        <div key={tracking.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm font-semibold tracking-wider">{tracking.deliveryOrderCode}</span>
              <Badge variant="outline" className="text-xs">
                {tracking.type}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {tracking.status === 'ReadyToPick' && (
                <Button
                  size="sm"
                  className={
                    successHandOver[tracking.id] || orderStatus === 'HandedOverToDelivery'
                      ? 'h-7 cursor-not-allowed bg-slate-100 px-3 text-xs text-slate-400 shadow-none dark:bg-slate-800 dark:text-slate-500'
                      : 'h-7 bg-amber-600 px-3 text-xs font-medium text-white shadow-sm ring-1 ring-inset ring-amber-700/50 transition-all active:scale-95 hover:bg-amber-700 disabled:pointer-events-none disabled:opacity-50'
                  }
                  onClick={() => {
                    setHandOverDialogTrackingId(tracking.id);
                    setHandOverFile(null);
                    setHandOverPreview(null);
                  }}
                  disabled={
                    isUpdating ||
                    submittingHandOver[tracking.id] ||
                    successHandOver[tracking.id] ||
                    orderStatus === 'HandedOverToDelivery'
                  }
                >
                  {isUpdating || submittingHandOver[tracking.id] ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                  )}
                  {successHandOver[tracking.id] || orderStatus === 'HandedOverToDelivery'
                    ? 'Handed Over'
                    : 'Hand Over'}
                </Button>
              )}

              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getDeliveryStatusColor(
                  tracking.status,
                )}`}
              >
                {tracking.status}
              </span>
            </div>
          </div>

          <div className="grid gap-3 p-4 text-sm sm:grid-cols-2">
            <div className="space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Expected Delivery</p>
              <p className="font-medium">{formatDateTime(tracking.expectedDeliveryDate)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Delivered At</p>
              <p className="font-medium">{formatDateTime(tracking.deliveredAt)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created</p>
              <p className="font-medium">{formatDateTime(tracking.createdAt)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last Updated</p>
              <p className="font-medium">{formatDateTime(tracking.updatedAt)}</p>
            </div>

            {tracking.note && (
              <div className="col-span-2 space-y-0.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Note</p>
                <p className="font-medium">{tracking.note}</p>
              </div>
            )}
          </div>

          {tracking.handOverImageUrl && (
            <div className="border-t px-4 py-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Hand Over Proof
              </p>
              <a
                href={getImageUrl(tracking.handOverImageUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-40 w-40 overflow-hidden rounded-lg border transition-opacity hover:opacity-80"
              >
                <img
                  src={getImageUrl(tracking.handOverImageUrl)}
                  alt="Hand Over Proof"
                  className="h-full w-full object-cover"
                />
              </a>
            </div>
          )}

          {tracking.details.length > 0 && (
            <div className="border-t px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Items ({tracking.details.length})
                </p>

                {tracking.id === firstTracking?.id && isFetchingDetail && (
                  <span className="flex items-center animate-pulse text-xs text-blue-500">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Loading detail...
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {tracking.details.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-1 text-xs"
                  >
                    <Package2 className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{d.type}</span>
                    <span className="text-muted-foreground">×{d.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      <Dialog open={!!handOverDialogTrackingId} onOpenChange={(open) => !open && setHandOverDialogTrackingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hand Over Package</DialogTitle>
            <DialogDescription>
              Please upload a photo of the packed package to confirm hand over to the delivery service.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setHandOverFile(file);
                  setHandOverPreview(URL.createObjectURL(file));
                }
              }}
            />

            {handOverPreview ? (
              <div className="relative w-full max-w-sm overflow-hidden rounded-lg border">
                <img src={handOverPreview} alt="Preview" className="max-h-64 w-full object-cover" />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute right-2 top-2 h-6 w-6 rounded-full"
                  onClick={() => {
                    setHandOverFile(null);
                    setHandOverPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex h-40 w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 transition-colors hover:bg-muted/30"
              >
                <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Click to upload photo</p>
                <p className="mt-1 text-xs text-muted-foreground/70">JPEG, PNG, WEBP max 5MB</p>
              </div>
            )}
          </div>

          <div className="flex w-full justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setHandOverDialogTrackingId(null)}
              disabled={submittingHandOver[handOverDialogTrackingId || '']}
            >
              Cancel
            </Button>
            <Button
              disabled={!handOverFile || submittingHandOver[handOverDialogTrackingId || '']}
              onClick={confirmHandOver}
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {submittingHandOver[handOverDialogTrackingId || ''] ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Hand Over
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
    <div className="space-y-5">
      <DebugModePanel orderId={order.id} currentStatus={order.status} />

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
            <InfoRow
              label="GHN Status"
              value={ghnStatus ? GHN_STATUS_MAP[ghnStatus]?.label ?? ghnStatus : 'N/A'}
            />
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4" />
            Delivery Tracking
          </CardTitle>
          <CardDescription>Real-time delivery tracking records for this order.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeliveryTrackingSection orderId={order.id} orderStatus={order.status} />
        </CardContent>
      </Card>

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
            <InfoRow label="Coin Discount" value={formatCurrency(order.usedCoinAmount)} />
            <Separator />
            <InfoRow label="Grand Total" value={formatCurrency(order.grandTotalAmount)} />
            <Separator />
            <div className="flex items-start justify-between gap-4 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm dark:border-yellow-800 dark:bg-yellow-950/20">
              <div className="flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400">
                <Coins className="h-4 w-4 shrink-0" />
                <span>{isDelivered ? 'Coins Earned' : 'Est. Coins to Earn'}</span>
                {!isDelivered && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-3.5 w-3.5 cursor-help opacity-60" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[180px] text-xs">
                          Customer receives {COIN_EARN_RATE * 100}% of grand total as coins once the order is{' '}
                          <strong>Delivered</strong>.
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
    </div>
  );
}

function PartnerDeliveryStatusPanel({
  order,
}: {
  order: PartnerOrderDetailDto;
}) {
  const [open, setOpen] = useState(order.status === 'HandedOverToDelivery');
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDeliveryTrackings(order.id, true);

  const updatePartnerOrderStatusMutation = useUpdatePartnerOrderStatus();
  const createDeliveryTrackingMutation = useCreateDeliveryTracking();

  const trackings = ((data as DeliveryTrackingResponse | undefined)?.data ?? []) as DeliveryTracking[];
  const latestTracking = getLatestTracking(trackings);
  const displayStatus = getPartnerDisplayStatus(order.status, trackings);
  const primaryAction = getPartnerPrimaryAction(order.status, trackings.length > 0);

  const handlePrimaryAction = async () => {
    try {
      if (!primaryAction) return;

      if (primaryAction.type === 'status') {
        await updatePartnerOrderStatusMutation.mutateAsync({
          orderId: order.id,
          data: { newStatus: primaryAction.newStatus },
        });
        toast.success(`Partner order updated to ${formatPartnerStatus(primaryAction.newStatus)}.`);
        if (primaryAction.newStatus === 'HandedOverToDelivery') {
          setOpen(true);
        }
        await refetch();
        return;
      }

      await createDeliveryTrackingMutation.mutateAsync({
        orderId: order.id,
        supportTicketId: null,
      });
      toast.success('Delivery tracking created successfully.');
      setOpen(true);
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Action failed. ${message}`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-4 w-4" />
          Partner Order Flow
        </CardTitle>
        <CardDescription>
          Follow the partner order progression step by step.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current Status
            </p>
            <div className="mt-2">
              <Badge variant={getStatusBadgeVariant(displayStatus)}>
                {formatPartnerStatus(displayStatus)}
              </Badge>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Delivery Code
            </p>
            <p className="mt-2 font-mono text-sm font-semibold">
              {latestTracking?.deliveryOrderCode || 'N/A'}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Expected Delivery
            </p>
            <p className="mt-2 text-sm font-semibold">
              {formatDateTime(latestTracking?.expectedDeliveryDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {primaryAction && (
            <Button
              onClick={handlePrimaryAction}
              disabled={
                updatePartnerOrderStatusMutation.isPending ||
                createDeliveryTrackingMutation.isPending
              }
            >
              {updatePartnerOrderStatusMutation.isPending ||
              createDeliveryTrackingMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Truck className="mr-2 h-4 w-4" />
              )}
              {primaryAction.label}
            </Button>
          )}

          {(trackings.length > 0 || order.status === 'HandedOverToDelivery') && (
            <Button variant="outline" onClick={() => setOpen((prev) => !prev)}>
              {open ? (
                <ChevronDown className="mr-2 h-4 w-4" />
              ) : (
                <ChevronRight className="mr-2 h-4 w-4" />
              )}
              {open ? 'Hide Delivery Status' : 'View Delivery Status'}
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {open && (
          <div className="rounded-xl border bg-card">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold">Delivery Tracking</p>
              <p className="text-xs text-muted-foreground">
                Live tracking information for this partner order.
              </p>
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  Failed to load delivery tracking data.
                </div>
              ) : trackings.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No delivery tracking records yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {trackings.map((tracking) => (
                    <div key={tracking.id} className="overflow-hidden rounded-lg border">
                      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm font-semibold">
                            {tracking.deliveryOrderCode}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {tracking.type}
                          </Badge>
                        </div>

                        <Badge variant={getStatusBadgeVariant(getPartnerDisplayStatus(order.status, [tracking]))}>
                          {tracking.status}
                        </Badge>
                      </div>

                      <div className="grid gap-3 p-4 text-sm sm:grid-cols-2">
                        <InfoRow label="Expected Delivery" value={formatDateTime(tracking.expectedDeliveryDate)} />
                        <InfoRow label="Delivered At" value={formatDateTime(tracking.deliveredAt)} />
                        <InfoRow label="Created At" value={formatDateTime(tracking.createdAt)} />
                        <InfoRow label="Updated At" value={formatDateTime(tracking.updatedAt)} />
                        <InfoRow label="Note" value={tracking.note || 'N/A'} />
                      </div>

                      {tracking.details.length > 0 && (
                        <div className="border-t px-4 py-3">
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Items ({tracking.details.length})
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {tracking.details.map((detail) => (
                              <div
                                key={detail.id}
                                className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-1 text-xs"
                              >
                                <Package2 className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{detail.type}</span>
                                <span className="text-muted-foreground">×{detail.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PartnerOrderDetailContent({ order }: { order: PartnerOrderDetailDto }) {
  const fullAddress = [
    order.detailAddress,
    order.customerWardName,
    order.customerDistrictName,
    order.customerProvinceName,
  ]
    .filter(Boolean)
    .join(', ');

  const {
    data,
  } = useDeliveryTrackings(order.id, true);

  const trackings = ((data as DeliveryTrackingResponse | undefined)?.data ?? []) as DeliveryTracking[];
  const latestTracking = getLatestTracking(trackings);
  const displayStatus = getPartnerDisplayStatus(order.status, trackings);

  return (
    <div className="space-y-5">
      <PartnerDeliveryStatusPanel order={order} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Status" value={formatPartnerStatus(displayStatus)} />
            <InfoRow label="Payment Method" value={order.paymentMethod} />
            <InfoRow label="Paid" value={order.isPaid ? 'Yes' : 'No'} />
            <InfoRow label="Created At" value={formatDateTime(order.createdAt)} />
            <InfoRow label="Updated At" value={formatDateTime(order.updatedAt)} />
            <InfoRow label="Paid At" value={formatDateTime(order.paidAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4" />
              Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Delivery Code" value={latestTracking?.deliveryOrderCode || 'N/A'} />
            <InfoRow label="Expected Date" value={formatDateTime(latestTracking?.expectedDeliveryDate)} />
            <InfoRow label="Address" value={fullAddress || 'N/A'} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Customer" value={order.customerName} />
            <InfoRow label="Phone" value={order.customerPhone} />
            <InfoRow label="Email" value={order.customerEmail} />
            <InfoRow label="Quotation ID" value={order.partnerProductQuotationId} />
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
            <InfoRow label="Import Tax" value={formatCurrency(order.importTaxAmount)} />
            <Separator />
            <InfoRow label="Grand Total" value={formatCurrency(order.grandTotalAmount)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PartnerOrderDetailDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: order, isLoading, error } = usePartnerOrderById(orderId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-full max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {order ? `Order ${order.code}` : 'Partner Order Details'}
            <OrderSourceBadge type="partner" />
          </DialogTitle>
          <DialogDescription>
            View partner order flow, delivery tracking, and payment information.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-6 py-5">
            {isLoading ? (
              <OrderDetailSkeleton />
            ) : error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                Failed to load partner order details. Please try again.
              </div>
            ) : order ? (
              <PartnerOrderDetailContent order={order} />
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function PartnerOrderRow({
  order,
  onView,
  onRunPrimaryAction,
  isUpdatingOrderId,
  isCreatingDeliveryOrderId,
}: {
  order: PartnerOrderListItemDto;
  onView: (orderId: string) => void;
  onRunPrimaryAction: (order: PartnerOrderListItemDto, action: PartnerPrimaryAction) => void;
  isUpdatingOrderId: string | null;
  isCreatingDeliveryOrderId: string | null;
}) {
  const { data } = useDeliveryTrackings(order.id, true);

  const trackings = ((data as DeliveryTrackingResponse | undefined)?.data ?? []) as DeliveryTracking[];
  const latestTracking = getLatestTracking(trackings);
  const displayStatus = getPartnerDisplayStatus(order.status, trackings);
  const primaryAction = getPartnerPrimaryAction(order.status, trackings.length > 0);

  const isBusy =
    isUpdatingOrderId === order.id || isCreatingDeliveryOrderId === order.id;

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p>{order.code}</p>
            <OrderSourceBadge type="partner" />
          </div>
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
          <Badge variant={getStatusBadgeVariant(displayStatus)} className="w-fit">
            {formatPartnerStatus(displayStatus)}
          </Badge>
          <p className="text-xs text-muted-foreground">{order.paymentMethod}</p>
        </div>
      </TableCell>

      <TableCell>
        <div className="space-y-1">
          <p className="font-mono text-sm font-medium">
            {latestTracking?.deliveryOrderCode || 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground">
            {latestTracking ? trackingStatusLabel(latestTracking.status) : 'No tracking yet'}
          </p>
        </div>
      </TableCell>

      <TableCell className="font-medium">{formatCurrency(order.grandTotalAmount)}</TableCell>

      <TableCell>
        <Badge variant={order.isPaid ? 'default' : 'secondary'}>
          {order.isPaid ? 'Paid' : 'Unpaid'}
        </Badge>
      </TableCell>

      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {primaryAction && (
            <Button
              size="sm"
              onClick={() => onRunPrimaryAction(order, primaryAction)}
              disabled={isBusy}
            >
              {isBusy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Truck className="mr-2 h-4 w-4" />
              )}
              {primaryAction.label}
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={() => onView(order.id)}>
            {trackings.length > 0 || order.status === 'HandedOverToDelivery'
              ? 'View Delivery Status'
              : 'View Details'}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function trackingStatusLabel(status: string) {
  return GHN_STATUS_MAP[status]?.label || status;
}

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

function OrderDetailDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: order, isLoading, error } = useCustomerOrderById(orderId);
  const { data: deliveryTracking } = useInstockOrderDeliveryTracking(orderId, open && !!orderId);

  const trackingData = deliveryTracking?.data ?? [];
  const latestTracking = trackingData[0];

  const trackingLogs =
    trackingData.map((item) => ({
      status: item.status,
      updatedDate: item.updatedAt,
      description: item.note ?? null,
    })) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-full max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {order ? `Order ${order.code}` : 'Order Details'}
            <OrderSourceBadge type="instock" />
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
            ) : order ? (
              <OrderDetailContent
                order={order}
                ghnStatus={latestTracking?.status}
                statusUpdated={false}
                trackingLogs={trackingLogs}
              />
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function OrderRow({
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
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p>{order.code}</p>
            <OrderSourceBadge type="instock" />
          </div>
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

export function OrderManagement() {
  const [activeTab, setActiveTab] = useState<'instock' | 'partner'>('instock');

  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [partnerPageNumber, setPartnerPageNumber] = useState(1);
  const [partnerStatusFilter, setPartnerStatusFilter] = useState<string>(ALL_STATUS);
  const [selectedPartnerOrderId, setSelectedPartnerOrderId] = useState<string | null>(null);
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const [partnerUpdatingOrderId, setPartnerUpdatingOrderId] = useState<string | null>(null);
  const [partnerCreatingDeliveryOrderId, setPartnerCreatingDeliveryOrderId] = useState<string | null>(null);

  const updateOrderStatusMutation = useUpdateInstockOrderStatus();
  const updatePartnerOrderStatusMutation = useUpdatePartnerOrderStatus();
  const createDeliveryTrackingMutation = useCreateDeliveryTracking();

  const { data, isLoading, error } = useCustomerOrders({
    pageNumber,
    pageSize: PAGE_SIZE,
    status: statusFilter === ALL_STATUS ? undefined : (statusFilter as InstockOrderStatus),
  });

  const {
    data: partnerData,
    isLoading: isPartnerLoading,
    error: partnerError,
  } = usePartnerOrders({
    pageNumber: partnerPageNumber,
    pageSize: PAGE_SIZE,
    ascending: true,
    status:
      partnerStatusFilter === ALL_STATUS
        ? undefined
        : (partnerStatusFilter as PartnerOrderStatus),
  });

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDialogOpen(true);
  };

  const handleMoveToProcessing = async (orderId: string) => {
    try {
      await updateOrderStatusMutation.mutateAsync({ orderId, data: { newStatus: 'Processing' } });
      toast.success('Order status updated to Processing.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to update order status. ${message}`);
    }
  };

  const handleViewPartnerOrder = (orderId: string) => {
    setSelectedPartnerOrderId(orderId);
    setPartnerDialogOpen(true);
  };

  const handleRunPartnerPrimaryAction = async (
    order: PartnerOrderListItemDto,
    action: PartnerPrimaryAction,
  ) => {
    if (!action) return;

    try {
      if (action.type === 'status') {
        setPartnerUpdatingOrderId(order.id);
        await updatePartnerOrderStatusMutation.mutateAsync({
          orderId: order.id,
          data: { newStatus: action.newStatus },
        });
        toast.success(`Partner order updated to ${formatPartnerStatus(action.newStatus)}.`);
        return;
      }

      setPartnerCreatingDeliveryOrderId(order.id);
      await createDeliveryTrackingMutation.mutateAsync({
        orderId: order.id,
        supportTicketId: null,
      });
      toast.success('Delivery tracking created successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Action failed. ${message}`);
    } finally {
      setPartnerUpdatingOrderId(null);
      setPartnerCreatingDeliveryOrderId(null);
    }
  };

  const instockStats = useMemo(() => {
    const items = data?.items || [];
    const paidCount = items.filter((item) => item.isPaid).length;
    const processingCount = items.filter((item) =>
      ['Pending', 'Processing', 'Waiting', 'Shipping', 'HandedOverToDelivery'].includes(item.status),
    ).length;
    const totalRevenue = items.reduce((sum, item) => sum + item.grandTotalAmount, 0);

    return {
      totalOrders: data?.totalCount || 0,
      paidCount,
      processingCount,
      totalRevenue,
    };
  }, [data]);

  const filteredPartnerItems = useMemo(() => {
    const items = partnerData?.items || [];
    if (partnerStatusFilter === ALL_STATUS) return items;
    return items.filter((item) => item.status === partnerStatusFilter);
  }, [partnerData, partnerStatusFilter]);

  const partnerStats = useMemo(() => {
    const items = partnerData?.items || [];
    const paidCount = items.filter((item) => item.isPaid).length;
    const processingCount = items.filter((item) =>
      PARTNER_IN_PROGRESS_STATUSES.includes(item.status),
    ).length;
    const totalRevenue = items.reduce((sum, item) => sum + item.grandTotalAmount, 0);

    return {
      totalOrders: partnerData?.totalCount || 0,
      paidCount,
      processingCount,
      totalRevenue,
    };
  }, [partnerData]);

  const currentStats = activeTab === 'instock' ? instockStats : partnerStats;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">
            Manage instock orders and partner product orders with separated flows.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Page size:</span>
          <span className="font-semibold">{PAGE_SIZE}</span>
        </div>
      </div>

      <div className="inline-flex w-fit rounded-xl border bg-card p-1">
        <button
          type="button"
          onClick={() => setActiveTab('instock')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === 'instock'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Instock Product
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('partner')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === 'partner'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Partner Product
        </button>
      </div>

      <OrderStatsCard
        title={activeTab === 'instock' ? 'Instock Orders' : 'Partner Product Orders'}
        type={activeTab}
        stats={currentStats}
      />

      {activeTab === 'instock' ? (
        <Card>
          <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Instock Orders
                <OrderSourceBadge type="instock" />
              </CardTitle>
              <CardDescription>Existing instock order flow is kept intact.</CardDescription>
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
                Failed to load instock orders. Please refresh and try again.
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
                        No instock orders match the current filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.items.map((order) => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        onView={handleViewOrder}
                        onMoveToProcessing={handleMoveToProcessing}
                        isUpdating={
                          updateOrderStatusMutation.isPending &&
                          updateOrderStatusMutation.variables?.orderId === order.id
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
                  Page {data.pageNumber} of {data.totalPages || 1} • {data.totalCount} orders •{' '}
                  {instockStats.processingCount} in progress on this page
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
      ) : (
        <Card>
          <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Partner Product Orders
                <OrderSourceBadge type="partner" />
              </CardTitle>
              <CardDescription>
                Cleaner tab view with partner-specific status flow.
              </CardDescription>
            </div>

            <div className="w-full md:w-56">
              <Select
                value={partnerStatusFilter}
                onValueChange={(value) => {
                  setPartnerStatusFilter(value);
                  setPartnerPageNumber(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUS}>All Statuses</SelectItem>
                  {PARTNER_ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatPartnerStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {partnerError && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                Failed to load partner orders. Please refresh and try again.
              </div>
            )}

            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isPartnerLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-10 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        <TableCell><Skeleton className="ml-auto h-8 w-36" /></TableCell>
                      </TableRow>
                    ))
                  ) : !filteredPartnerItems.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No partner orders match the current filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPartnerItems.map((order) => (
                      <PartnerOrderRow
                        key={order.id}
                        order={order}
                        onView={handleViewPartnerOrder}
                        onRunPrimaryAction={handleRunPartnerPrimaryAction}
                        isUpdatingOrderId={partnerUpdatingOrderId}
                        isCreatingDeliveryOrderId={partnerCreatingDeliveryOrderId}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {partnerData && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {partnerData.pageNumber} of {partnerData.totalPages || 1} •{' '}
                  {partnerData.totalCount} partner orders • {partnerStats.processingCount} in progress on this page
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!partnerData.hasPreviousPage}
                    onClick={() => setPartnerPageNumber((prev) => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!partnerData.hasNextPage}
                    onClick={() => setPartnerPageNumber((prev) => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <OrderDetailDialog
        orderId={selectedOrderId}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedOrderId(null);
        }}
      />

      <PartnerOrderDetailDialog
        orderId={selectedPartnerOrderId}
        open={partnerDialogOpen}
        onOpenChange={(open) => {
          setPartnerDialogOpen(open);
          if (!open) setSelectedPartnerOrderId(null);
        }}
      />
    </div>
  );
}