import React, { useState } from 'react';
import {
  Ticket,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Package2,
  Calendar,
  Hash,
  FileText,
  Wrench,
  RefreshCw,
  ShieldAlert,
  Truck,
  MapPin,
  ImageIcon,
  Upload,
  ImagePlus,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react';

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
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  useGetTickets,
  useGetTicketById,
  useUpdateTicketStatus,
  useDeleteTicket,
  type TicketStatus,
  type SupportTicketListItemDto,
} from '@/services/supportTicketApi';

// 👉 Sửa đường dẫn import này cho khớp với project của ông nhé
import { useCreateDeliveryTracking, useUpdateHandOverImage } from '@/hooks/useDeliveryQueries'; 
import { useDeliveryTrackings } from '@/hooks/useDeliveryQueries'; 
import { MediaViewer } from '@/components/support/MediaViewer';
import { toast } from 'sonner';
import { uploadApi } from '@/services/uploadApi';
import { useUpdateInstockOrderStatus } from '@/hooks/useInstockOrderQueries';

const PAGE_SIZE = 10;
const ALL_STATUS = '__ALL__';

const TICKET_TYPE_LABEL: Record<string, string> = {
  ReplacePart: 'Replace Part',
  Exchange:    'Exchange',
};

const VALID_STATUSES: TicketStatus[] = ['Open', 'Processing', 'Resolved', 'Rejected'];

const STATUS_FILTER_OPTIONS = [
  { value: ALL_STATUS,   label: 'All Statuses' },
  { value: 'Open',       label: 'Open' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Resolved',   label: 'Resolved' },
  { value: 'Rejected',   label: 'Rejected' },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const map: Record<TicketStatus, string> = {
    Open:       'bg-blue-500/10   text-blue-600   border-blue-500/30',
    Processing: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    Resolved:   'bg-green-500/10  text-green-600  border-green-500/30',
    Rejected:   'bg-red-500/10    text-red-600    border-red-500/30',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase ${map[status] ?? ''}`}
    >
      {status}
    </span>
  );
}

const formatDateTime = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'N/A'
    : date.toLocaleString('vi-VN');
};

function InfoRow({ 
  label, 
  value, 
  valueClassName 
}: { 
  label: string; 
  value: React.ReactNode; 
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right ${valueClassName || ''}`}>{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Ticket Detail Dialog (Bung ra khi ấn nút View)
───────────────────────────────────────────────────────────────────────────── */

export function TicketDetailDialog({
  ticketId,
  open,
  onOpenChange,
  onShipmentCreated,
}: {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onShipmentCreated?: () => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // --- 1. HOOKS CỦA TICKET ---
  const { data: ticket, isLoading, error } = useGetTicketById(ticketId, open);
  const { mutateAsync: updateTicketStatusAsync, isPending: isUpdatingTicket } = useUpdateTicketStatus();
  
  // --- 2. HOOKS CỦA DELIVERY & HAND OVER (Y HỆT BÊN ORDER) ---
  const { data: deliveriesRes, refetch: refetchDeliveries } = useDeliveryTrackings(ticket?.orderId ?? '', open && !!ticket?.orderId);
  
  const supportShipment = deliveriesRes?.data?.find(
    (d: any) => d.type === 'Support' && d.supportTicketId === ticket?.id
  );

  const { mutateAsync: updateHandOverImage } = useUpdateHandOverImage();
  const createDelivery = useCreateDeliveryTracking();

  // --- 3. STATES HAND OVER DIALOG ---
  const [submittingHandOver, setSubmittingHandOver] = useState<Record<string, boolean>>({});
  const [successHandOver, setSuccessHandOver] = useState<Record<string, boolean>>({});
  const [handOverDialogTrackingId, setHandOverDialogTrackingId] = useState<string | null>(null);
  const [handOverFile, setHandOverFile] = useState<File | null>(null);
  const [handOverPreview, setHandOverPreview] = useState<string | null>(null);

  // --- 4. STATES UPLOAD TICKET STAFF PROOF ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submittingStaffProof, setSubmittingStaffProof] = useState(false);

  // ---------------------------------------------------------------------------
  // CÁC HÀM XỬ LÝ 
  // ---------------------------------------------------------------------------
  const handleStatusChange = async (status: string) => {
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

  const handleUploadStaffProof = async () => {
    if (!selectedFile || !ticketId) return;
    setSubmittingStaffProof(true);
    try {
      const customPath = `support-tickets/${ticketId}-${Date.now()}`;
      const imageUrl = await uploadApi.uploadFileToS3(selectedFile, 'support-tickets', customPath);

      toast.success("Resolution proof uploaded successfully!");
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload resolution proof');
    } finally {
      setSubmittingStaffProof(false);
    }
  };
  const confirmHandOver = async () => {
    if (!handOverDialogTrackingId || !handOverFile || !ticket) return;
    const trackingId = handOverDialogTrackingId;
    
    setSubmittingHandOver(prev => ({ ...prev, [trackingId]: true }));
    try {
      const customPath = `hand-overs/${trackingId}-${Date.now()}`;
      const imageUrl = await uploadApi.uploadFileToS3(handOverFile, 'deliveries', customPath);
      
      await updateHandOverImage({ id: trackingId, imageUrl });
      
      setSuccessHandOver(prev => ({ ...prev, [trackingId]: true }));
      await refetchDeliveries();
      
      setSubmittingHandOver(prev => ({ ...prev, [trackingId]: false }));
      setHandOverDialogTrackingId(null); 
      toast.success("Hand over image uploaded successfully!");
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload hand over image');
      setSubmittingHandOver(prev => ({ ...prev, [trackingId]: false }));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[90vh] max-h-[90vh] w-full max-w-5xl flex-col gap-0 p-0">          
          <DialogHeader className="border-b px-6 py-5 shrink-0">
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
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                </div>
              ) : error ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  Failed to load ticket details. Please try again.
                </div>
              ) : ticket ? (
                <>
                  {/* 1. Thanh Action & Upload của Staff */}
                  <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20">
                    <CardHeader className="py-4 px-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Chuyển Status */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-semibold text-sm">
                            <ShieldAlert className="h-4 w-4" />
                            Update Status
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {VALID_STATUSES.map((s) => (
                              <Button
                                key={s}
                                size="sm"
                                variant={ticket.status === s ? 'default' : 'outline'}
                                disabled={isUpdatingTicket || ticket.status === s}
                                onClick={() => handleStatusChange(s)}
                                className="h-8 text-xs"
                              >
                                {s}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <Separator className="md:hidden" />
                      </div>
                    </CardHeader>
                  </Card>

                  {/* 2. Grid 2 cột: Summary & Shipment */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Cột 1: Ticket Summary & Proof */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <FileText className="h-4 w-4" />
                          Ticket Summary & Evidence
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <InfoRow label="Status" value={<TicketStatusBadge status={ticket.status} />} />
                        <InfoRow label="Type" value={<Badge variant="secondary">{TICKET_TYPE_LABEL[ticket.type] ?? ticket.type}</Badge>} />
                        <InfoRow label="Order ID" value={<span className="font-mono text-xs">{ticket.orderId}</span>} />
                        
                        <Separator className="my-3" />
                        
                        <div className="space-y-1">
                          <span className="text-muted-foreground text-sm">Reason:</span>
                          <p className="text-sm bg-muted/30 p-2 rounded-md border">{ticket.reason}</p>
                        </div>

                        <div className="space-y-1 mt-4">
                          <span className="text-muted-foreground text-sm flex items-center gap-1 font-medium">
                            <ImageIcon className="h-4 w-4" /> Customer Provided Evidence:
                          </span>
                          <MediaViewer proofData={ticket.proof} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cột 2: Support Shipment / Delivery */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Truck className="h-4 w-4" />
                            Replacement Delivery
                          </CardTitle>
                          
                          <div className="flex items-center gap-2">
                            {/* Nút Create Shipment */}
                            {!supportShipment && 
                             (ticket.type === 'ReplacePart' || ticket.type === 'Exchange') && 
                             ticket.status === 'Processing' && (
                              <Button 
                                size="sm" 
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={handleCreateShipment}
                                disabled={createDelivery.isPending}
                              >
                                {createDelivery.isPending ? 'Creating...' : 'Create Shipment'}
                              </Button>
                            )}

                            {/* Nút HAND OVER cho Shipment thay thế */}
                            {supportShipment && supportShipment.status === "ReadyToPick" && (
                              <Button 
                                size="sm" 
                                className={
                                  (successHandOver[supportShipment.id])
                                    ? "h-7 px-3 text-xs bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none"
                                    : "h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm ring-1 ring-inset ring-amber-700/50 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                }
                                onClick={() => { setHandOverDialogTrackingId(supportShipment.id); setHandOverFile(null); setHandOverPreview(null); }}
                                disabled={submittingHandOver[supportShipment.id] || successHandOver[supportShipment.id]}
                              >
                                {submittingHandOver[supportShipment.id] ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                )}
                                {successHandOver[supportShipment.id] ? "Handed Over" : "Hand Over"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {supportShipment ? (
                          <>
                            <InfoRow label="Tracking Code" value={<span className="font-mono">{supportShipment.deliveryOrderCode || 'Pending Sync'}</span>} />
                            <InfoRow label="Status" value={
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 uppercase text-[10px]">
                                {supportShipment.status}
                              </Badge>
                            } />
                            <InfoRow label="Expected Date" value={supportShipment.expectedDeliveryDate ? new Date(supportShipment.expectedDeliveryDate).toLocaleString() : 'N/A'} />
                            
                            {supportShipment.handOverImageUrl && (
                              <div className="mt-4 space-y-1">
                                <span className="text-muted-foreground text-sm flex items-center gap-1 font-medium">
                                  <MapPin className="h-3.5 w-3.5" /> Proof of Handover:
                                </span>
                                <div className="mt-2 rounded-md border overflow-hidden">
                                  <a href={supportShipment.handOverImageUrl} target="_blank" rel="noopener noreferrer">
                                    <img 
                                      src={supportShipment.handOverImageUrl} 
                                      alt="Handover" 
                                      className="w-full max-h-[250px] object-cover transition-opacity hover:opacity-90"
                                    />
                                  </a>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-muted-foreground gap-2">
                            <Truck className="h-8 w-8 opacity-20" />
                            <span className="text-sm text-center px-4">
                              No replacement shipment created yet. <br/>
                              Change status to "Processing" to create one.
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* 3. Affected Items (Mockup array, ông thay bằng list items thật của ticket) */}
                  {ticket.items && ticket.items.length > 0 && (
                     <Card>
                       <CardHeader className="pb-3">
                         <CardTitle className="text-base flex items-center gap-2">
                           <Package2 className="h-4 w-4" /> Affected Items
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="space-y-3">
                           {ticket.items.map((item: any) => (
                             <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                               <div className="flex-1">
                                 <p className="font-medium text-sm">{item.productName || 'Unknown Product'}</p>
                                 <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                               </div>
                             </div>
                           ))}
                         </div>
                       </CardContent>
                     </Card>
                  )}
                </>
              ) : null}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HAND OVER UPLOAD DIALOG (Bê nguyên xi từ Order) */}
      {/* Nằm ngoài thẻ Dialog trên hoặc gán z-index thật cao để không bị đè */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!handOverDialogTrackingId} onOpenChange={(open) => !open && setHandOverDialogTrackingId(null)}>
        <DialogContent className="sm:max-w-md z-[100]">
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
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Table Row Skeleton
───────────────────────────────────────────────────────────────────────────── */

function TableRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-5 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Single Row
───────────────────────────────────────────────────────────────────────────── */

function TicketRow({
  ticket,
  onView,
  onDelete,
  isDeleting,
  onShipmentCreated,
}: {
  ticket: SupportTicketListItemDto;
  onView:    (id: string) => void;
  onDelete:  (id: string) => void;
  isDeleting: boolean;
  onShipmentCreated?: () => void;
}) {
  const createDelivery = useCreateDeliveryTracking();

  // Hook của ông
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
    await createDelivery.mutateAsync({
      orderId: ticket.orderId,
      supportTicketId: ticket.id,
    });
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
              size="sm"
              variant="default"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCreateShipment}
              disabled={createDelivery.isPending}
            >
              <Truck className="h-3.5 w-3.5" />
              {createDelivery.isPending ? 'Creating...' : 'Create Replacement'}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(ticket.id)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            View Detail
          </Button>

          {canDelete && (
            <Button
              size="sm"
              variant="outline"
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

/* ─────────────────────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────────────────────── */

export function TicketManagement() {
  const [pageNumber,    setPageNumber]   = useState(1);
  const [statusFilter,  setStatusFilter] = useState<string>(ALL_STATUS);

  const [selectedId,    setSelectedId]   = useState<string | null>(null);
  const [dialogOpen,    setDialogOpen]   = useState(false);

  const [deleteTarget,  setDeleteTarget] = useState<string | null>(null);
  const [deleteOpen,    setDeleteOpen]   = useState(false);

  const { data, isLoading, isError, refetch } = useGetTickets({
    pageNumber,
    pageSize: PAGE_SIZE,
    ...(statusFilter !== ALL_STATUS ? { status: statusFilter } : {}),
  });

  const deleteTicket = useDeleteTicket();

  const handleView = (id: string) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteTarget(id);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteTicket.mutateAsync(deleteTarget);
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPageNumber(1);
  };

  const totalPages = data?.totalPages ?? 1;
  const openCount    = data?.items.filter((t) => t.status === 'Open').length      ?? 0;
  const pendingCount = data?.items.filter((t) => t.status === 'Processing').length ?? 0;

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">
            Review customer reports and manage replacements, exchanges, and returns.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tickets</CardDescription>
            <CardTitle className="text-2xl">{data?.totalCount ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open (this page)</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl text-blue-600">
              {openCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress (this page)</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl text-yellow-600">
              {pendingCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>All Tickets</CardTitle>
            <CardDescription>Filter by status and open each row to take action.</CardDescription>
          </div>
          <div className="w-full md:w-52">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isError && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              Failed to load tickets. Please refresh and try again.
            </div>
          )}

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} />)
                ) : !data?.items.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Ticket className="h-8 w-8 opacity-30" />
                        No tickets match the current filter.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((ticket) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      onView={handleView}
                      onDelete={handleDeleteRequest}
                      isDeleting={
                        deleteTicket.isPending &&
                        deleteTicket.variables === ticket.id
                      }
                      onShipmentCreated={refetch}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Page {data.pageNumber} of {totalPages || 1} &bull; {data.totalCount} tickets total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasPreviousPage}
                  onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasNextPage}
                  onClick={() => setPageNumber((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <TicketDetailDialog
        ticketId={selectedId}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedId(null);
        }}
        onShipmentCreated={refetch}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="text-destructive h-5 w-5" />
              Delete Support Ticket
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
              <br />
              <span className="font-medium">Note: only tickets with status "Open" can be deleted.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTicket.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteTicket.isPending}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleteTicket.isPending ? 'Deleting...' : 'Delete Ticket'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}