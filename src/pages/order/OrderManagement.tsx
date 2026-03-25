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
  ExternalLink,
  RefreshCw,
  Loader2,
  ImagePlus,
  X,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  INSTOCK_ORDER_STATUSES,
  useCustomerOrderById,
  useCustomerOrders,
  useInstockOrderDeliveryTracking,
  useUpdateInstockOrderStatus,
} from '@/hooks/useInstockOrderQueries';
import { instockOrderApi } from '@/services/instockOrderApi';
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
import { useDeliveryTrackingById, useDeliveryTrackings, useCreateDeliveryTracking, useUpdateHandOverImage } from '@/hooks/useDeliveryQueries';
import { uploadApi } from '@/services/uploadApi';
import * as React from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Delivery Tracking Types ──────────────────────────────────────────────────

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
  details: DeliveryTrackingDetail[];
}

interface DeliveryTrackingResponse {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  data: DeliveryTracking[];
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const getImageUrl = (path: string | null) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
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
  status: InstockOrderStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (['Paid', 'Completed', 'Delivered'].includes(status)) return 'default';
  if (['Cancelled', 'Rejected', 'Returned'].includes(status)) return 'destructive';
  if (['Pending', 'Processing', 'Waiting', 'Shipping', 'HandedOverToDelivery', 'ReadyToPick'].includes(status)) return 'secondary';
  return 'outline';
};

const getDeliveryStatusColor = (status: string): string => {
  const lower = status.toLowerCase().replace(/\s/g, '_');
  const s = status.toLowerCase();
  if (s.includes('delivered') && !s.includes('fail')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  if (s.includes('cancel') || s.includes('fail') || s.includes('damage')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  if (s.includes('return')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  if (s.includes('ready') || s.includes('pick') || s.includes('process')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-secondary text-secondary-foreground';
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

function ShippingTimeline({ logs, currentGhnStatus }: { logs?: TrackingLog[]; currentGhnStatus?: string }) {
  const hasLogs = logs && logs.length > 0;
  if (!currentGhnStatus && !hasLogs) {
    return <p className="text-sm text-muted-foreground">No tracking information available yet.</p>;
  }
  const displayLogs: TrackingLog[] = hasLogs ? logs! : currentGhnStatus ? [{ status: currentGhnStatus }] : [];
  return (
    <ol className="relative border-l border-muted ml-2 space-y-0">
      {displayLogs.map((log, index) => {
        const meta = GHN_STATUS_MAP[log.status] ?? { label: log.status, color: 'text-gray-500' };
        const isFirst = index === 0;
        return (
          <li key={index} className="mb-0 ml-4">
            <span className={`absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background ${isFirst ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
            <div className="pb-5">
              <p className={`text-sm font-semibold ${isFirst ? 'text-foreground' : 'text-muted-foreground'}`}>
                <span className={meta.color}>{meta.label}</span>
              </p>
              {log.updatedDate && <time className="text-xs text-muted-foreground">{formatDateTime(log.updatedDate)}</time>}
              {log.description && <p className="mt-0.5 text-xs text-muted-foreground">{log.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Waybill Button ───────────────────────────────────────────────────────────

interface WaybillResponse { waybillUrl: string; }
interface PrintWaybillButtonProps { orderId: string; }

function PrintWaybillButton({ orderId }: PrintWaybillButtonProps) {
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

// ─── Debug Mode Panel ─────────────────────────────────────────────────────────

function DebugModePanel({ orderId, currentStatus }: { orderId: string; currentStatus: InstockOrderStatus }) {
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

// ─── Delivery Tracking Section ────────────────────────────────────────────────

function DeliveryTrackingSection({ orderId,orderStatus }: { orderId: string;   orderStatus: InstockOrderStatus; }) {
 const isHandedOver = orderStatus === 'HandedOverToDelivery';
  
  // Auto-load tracking list nếu status là HandedOverToDelivery
  const [enabled, setEnabled] = useState(isHandedOver);
  // 1. Hook lấy list data
  const { data, isLoading, isError, refetch, isFetching } = useDeliveryTrackings(orderId, enabled);
  
  // 2. Hook update status
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateInstockOrderStatus();

  // 3. Hook create delivery tracking
  const { mutate: createTracking, isPending: isCreating } = useCreateDeliveryTracking();

  // Xử lý mảng trackings an toàn
  const trackings = data?.data ?? [];

  // =======================================================================
  // 3. HOOK GỌI API DETAIL (AUTO-CALL LÀ Ở ĐÂY NÈ)
  // Tìm ID của tracking có status là HandedOverToDelivery
  const handedOverTracking = trackings.find(t => t.status === "HandedOverToDelivery");

  const firstTracking = trackings[0];

  const targetStatuses: InstockOrderStatus[] = ['HandedOverToDelivery', 'Delivering', 'Delivered', 'Completed', 'Returned'];
  const shouldAutoFetchDetail = !!firstTracking?.id && targetStatuses.includes(orderStatus);

  const { isFetching: isFetchingDetail, data: detailData } = useDeliveryTrackingById(
    firstTracking?.id ?? '',
    shouldAutoFetchDetail
  );

  useEffect(() => {
    if (detailData) {
      refetch();
    }
  }, [detailData, refetch]);
  // =======================================================================

  // Hook update hand over image
  const { mutateAsync: updateHandOverImage } = useUpdateHandOverImage();

  // 4. Hàm xử lý khi bấm nút "Hand Over"
  const [submittingHandOver, setSubmittingHandOver] = useState<Record<string, boolean>>({});
  const [successHandOver, setSuccessHandOver] = useState<Record<string, boolean>>({});

  // States for Hand Over Modal
  const [handOverDialogTrackingId, setHandOverDialogTrackingId] = useState<string | null>(null);
  const [handOverFile, setHandOverFile] = useState<File | null>(null);
  const [handOverPreview, setHandOverPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const confirmHandOver = async () => {
    if (!handOverDialogTrackingId || !handOverFile) return;
    const trackingId = handOverDialogTrackingId;
    
    setSubmittingHandOver(prev => ({ ...prev, [trackingId]: true }));
    try {
      // 1. Upload to S3
      const customPath = `hand-overs/${trackingId}-${Date.now()}`;
      const imageUrl = await uploadApi.uploadFileToS3(handOverFile, 'deliveries', customPath);
      
      // 2. Cập nhật ảnh lên Tracking API
      await updateHandOverImage({ id: trackingId, imageUrl });
      
      // 3. Update Order Status
      updateStatus(
        {
          orderId: orderId,
          data: { newStatus: "HandedOverToDelivery" },
        },
        {
          onSuccess: async () => {
            setSuccessHandOver(prev => ({ ...prev, [trackingId]: true }));
            await refetch(); 
            setSubmittingHandOver(prev => ({ ...prev, [trackingId]: false }));
            setHandOverDialogTrackingId(null);
            toast.success("Package handed over successfully!");
          },
          onError: (err) => {
            console.error("Lỗi cập nhật order status:", err);
            setSubmittingHandOver(prev => ({ ...prev, [trackingId]: false }));
            toast.error("Hand over image uploaded but failed to update order status.");
          }
        }
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image or update status');
      setSubmittingHandOver(prev => ({ ...prev, [trackingId]: false }));
    }
  };

  // 5. Hàm xử lý tạo delivery tracking mới
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [successCreate, setSuccessCreate] = useState(false);

  const handleCreateDelivery = () => {
    setSubmittingCreate(true);
    const payload: CreateDeliveryTrackingDto = {
      orderId: orderId,
      supportTicketId: null, // optional field
    };
    
    createTracking(payload, {
      onSuccess: async (data) => {
        setSuccessCreate(true);
        toast.success(`Delivery tracking created! Code: ${data.deliveryOrderCode}`);
        setEnabled(true); // Hiển thị section
        await refetch(); // Refresh danh sách
        setSubmittingCreate(false);
      },
      onError: (err) => {
        toast.error('Failed to create delivery tracking');
        console.error(err);
        setSubmittingCreate(false);
      }
    });
  };

  // -----------------------------------------------------------------------
  // 6. CÁC EARLY RETURNS (PHẢI NẰM DƯỚI CÙNG SAU KHI ĐÃ GỌI HẾT HOOKS)
  // -----------------------------------------------------------------------

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
              (successCreate || trackings.length > 0)
                ? "h-8 px-4 bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none"
                : "h-8 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
            }
            onClick={handleCreateDelivery}
            disabled={isCreating || submittingCreate || successCreate || trackings.length > 0}
          >
            {isCreating || submittingCreate ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (successCreate || trackings.length > 0) ? (
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
            ) : (
              <Truck className="mr-1.5 h-4 w-4" />
            )}
            {(successCreate || trackings.length > 0) ? "Created" : "Create Delivery"}
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
            (successCreate || trackings.length > 0)
              ? "h-8 px-4 bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none"
              : "h-8 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
          }
        >
          {isCreating || submittingCreate ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (successCreate || trackings.length > 0) ? (
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
          ) : (
            <Truck className="mr-1.5 h-4 w-4" />
          )}
          {(successCreate || trackings.length > 0) ? "Created" : "Create Delivery"}
        </Button>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // 6. RENDER GIAO DIỆN CHÍNH
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{trackings.length} tracking record(s) found</p>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            className={
              (successCreate || trackings.length > 0)
                ? "h-7 px-3 text-xs bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none"
                : "h-7 px-3 text-xs bg-slate-800 hover:bg-slate-700 text-white font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
            }
            onClick={handleCreateDelivery}
            disabled={isCreating || submittingCreate || successCreate || trackings.length > 0}
          >
            {isCreating || submittingCreate ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (successCreate || trackings.length > 0) ? (
              <CheckCircle2 className="mr-1 h-3 w-3" />
            ) : (
              <Truck className="mr-1 h-3 w-3" />
            )}
            {(successCreate || trackings.length > 0) ? "Created" : "Create Delivery"}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-1 h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {trackings.map((tracking) => (
        <div
          key={tracking.id}
          className="rounded-xl border bg-card shadow-sm overflow-hidden"
        >
          {/* Header stripe */}
          <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm font-semibold tracking-wider">
                {tracking.deliveryOrderCode}
              </span>
              <Badge variant="outline" className="text-xs">{tracking.type}</Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Nút Hand Over */}
              {tracking.status === "ReadyToPick" && ( 
                <Button 
                  size="sm" 
                  className={
                    (successHandOver[tracking.id] || orderStatus === 'HandedOverToDelivery')
                      ? "h-7 px-3 text-xs bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none"
                      : "h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm ring-1 ring-inset ring-amber-700/50 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  }
                  onClick={() => { setHandOverDialogTrackingId(tracking.id); setHandOverFile(null); setHandOverPreview(null); }}
                  disabled={isUpdating || submittingHandOver[tracking.id] || successHandOver[tracking.id] || orderStatus === 'HandedOverToDelivery'}
                >
                  {isUpdating || submittingHandOver[tracking.id] ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                  )}
                  {(successHandOver[tracking.id] || orderStatus === 'HandedOverToDelivery') ? "Handed Over" : "Hand Over"}
                </Button>
              )}

              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getDeliveryStatusColor(tracking.status)}`}>
                {tracking.status}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="grid gap-3 p-4 sm:grid-cols-2 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expected Delivery</p>
              <p className="font-medium">{formatDateTime(tracking.expectedDeliveryDate)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivered At</p>
              <p className="font-medium">{formatDateTime(tracking.deliveredAt)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</p>
              <p className="font-medium">{formatDateTime(tracking.createdAt)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Updated</p>
              <p className="font-medium">{formatDateTime(tracking.updatedAt)}</p>
            </div>
            {tracking.note && (
              <div className="col-span-2 space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Note</p>
                <p className="font-medium">{tracking.note}</p>
              </div>
            )}
          </div>

          {/* Hand Over Image */}
          {tracking.handOverImageUrl && (
            <div className="border-t px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Hand Over Proof
              </p>
              <a href={getImageUrl(tracking.handOverImageUrl)} target="_blank" rel="noopener noreferrer" className="block w-40 h-40 overflow-hidden rounded-lg border hover:opacity-80 transition-opacity">
                <img src={getImageUrl(tracking.handOverImageUrl)} alt="Hand Over Proof" className="w-full h-full object-cover" />
              </a>
            </div>
          )}

          {/* Details */}
          {tracking.details.length > 0 && (
            <div className="border-t px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Items ({tracking.details.length})
                </p>
                
                {/* HIỂN THỊ ĐANG LOADING API DETAIL (TÙY CHỌN CHO ĐẸP UI) */}
                {tracking.id === firstTracking?.id && isFetchingDetail && (
                  <span className="text-xs text-blue-500 animate-pulse flex items-center">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Loading detail...
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {tracking.details.map((d) => (
                  <div key={d.id} className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-1 text-xs">
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

      {/* Hand Over Upload Dialog */}
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
              <div className="relative w-full max-w-sm rounded-lg border overflow-hidden">
                <img src={handOverPreview} alt="Preview" className="w-full h-auto object-cover max-h-64" />
                <Button 
                  size="icon" 
                  variant="destructive" 
                  className="absolute top-2 right-2 h-6 w-6 rounded-full"
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
                className="flex flex-col items-center justify-center w-full max-w-sm h-40 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Click to upload photo</p>
                <p className="text-xs text-muted-foreground/70 mt-1">JPEG, PNG, WEBP max 5MB</p>
              </div>
            )}
          </div>
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" onClick={() => setHandOverDialogTrackingId(null)} disabled={submittingHandOver[handOverDialogTrackingId || '']}>
              Cancel
            </Button>
            <Button 
              disabled={!handOverFile || submittingHandOver[handOverDialogTrackingId || '']} 
              onClick={confirmHandOver}
              className="bg-teal-600 hover:bg-teal-700 text-white"
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
  const fullAddress = [order.detailAddress, order.customerWardName, order.customerDistrictName, order.customerProvinceName]
    .filter(Boolean)
    .join(', ');

  const estimatedCoins = Math.floor(order.grandTotalAmount * COIN_EARN_RATE);
  const isDelivered = order.status === 'Delivered';
  const hasDeliveryCode = !!order.deliveryOrderCode;

  return (
    <div className="space-y-5">
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

      {/* Delivery Tracking Section */}
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
            <div className="flex items-start justify-between gap-4 rounded-md bg-yellow-50 dark:bg-yellow-950/20 px-3 py-2 text-sm border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400">
                <Coins className="h-4 w-4 shrink-0" />
                <span>{isDelivered ? 'Coins Earned' : 'Est. Coins to Earn'}</span>
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
                  <img src={detail.thumbnailUrl} alt={detail.productName} className="h-20 w-20 rounded-lg border object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">No image</div>
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
                    <InfoRow label="Size" value={`${detail.variantDetails.assembledLengthMm} x ${detail.variantDetails.assembledWidthMm} x ${detail.variantDetails.assembledHeightMm} mm`} />
                  </div>
                  <div className="rounded-md bg-muted/40 p-3 text-sm">
                    <p className="font-medium">{detail.productDetails.name}</p>
                    <p className="mt-1 text-muted-foreground">{detail.productDetails.description || 'No product description.'}</p>
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

// ─── Order Detail Dialog ──────────────────────────────────────────────────────

function OrderDetailDialog({
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

// ─── Order Row ────────────────────────────────────────────────────────────────

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

// ─── Main Export ──────────────────────────────────────────────────────────────

export function OrderManagement() {
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const updateOrderStatusMutation = useUpdateInstockOrderStatus();

  const { data, isLoading, error } = useCustomerOrders({
    pageNumber,
    pageSize: PAGE_SIZE,
    status: statusFilter === ALL_STATUS ? undefined : (statusFilter as InstockOrderStatus),
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
            <CardDescription>Filter by status and open each order for full details.</CardDescription>
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
                  <SelectItem key={status} value={status}>{status}</SelectItem>
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

      {/* Detail Dialog */}
      <OrderDetailDialog
        orderId={selectedOrderId}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedOrderId(null);
        }}
      />
    </div>
  );
}