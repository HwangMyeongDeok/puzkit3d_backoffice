import * as React from 'react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Truck,  Loader2, CheckCircle2, RefreshCw, Package2, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDeliveryTrackings, useUpdateHandOverImage, useCreateDeliveryTracking, useDeliveryTrackingById } from '@/hooks/useDeliveryQueries';
import { useUpdateInstockOrderStatus } from '@/hooks/useInstockOrderQueries';
import { uploadApi } from '@/services/uploadApi';
import { type InstockOrderStatus, type CreateDeliveryTrackingDto } from '@/types/types';
import { formatDateTime, getDeliveryStatusColor, getImageUrl } from './utils';

export function DeliveryTrackingSection({ orderId, orderStatus }: { orderId: string; orderStatus: InstockOrderStatus }) {
  // 1. Hook lấy list data - LUÔN LUÔN BẬT ĐỂ AUTO FETCH
  const { data, isLoading, isError, refetch, isFetching } = useDeliveryTrackings(orderId, true);
  
  // 2. Hook update status
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateInstockOrderStatus();

  // 3. Hook create delivery tracking
  const { mutate: createTracking, isPending: isCreating } = useCreateDeliveryTracking();

  // Xử lý mảng trackings an toàn
const trackings = (data?.data ?? []).filter(t => t.type === 'Original');

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
  // 6. CÁC EARLY RETURNS TỐI ƯU
  // -----------------------------------------------------------------------

  if (isLoading || isFetching) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Gộp chung lỗi (ví dụ API trả 404 do chưa có data) và mảng rỗng thành 1 màn hình nhẹ nhàng
  if (isError || trackings.length === 0) {
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
  // 7. RENDER GIAO DIỆN CHÍNH
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
                
                {/* HIỂN THỊ ĐANG LOADING API DETAIL */}
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