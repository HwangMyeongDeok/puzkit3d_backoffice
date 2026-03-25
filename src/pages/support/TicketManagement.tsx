// src/pages/support/TicketManagement.tsx

import { useState } from 'react';
import {
  Ticket,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Package,
  Calendar,
  Hash,
  FileText,
  Wrench,
  RefreshCw,
  ShieldAlert,
  Truck,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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

import { useCreateDeliveryTracking } from '@/hooks/useDeliveryQueries';

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
   Status Badge
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

/* ─────────────────────────────────────────────────────────────────────────────
   Formatters
───────────────────────────────────────────────────────────────────────────── */

const formatDateTime = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'N/A'
    : date.toLocaleString('vi-VN');
};

/* ─────────────────────────────────────────────────────────────────────────────
   Detail Sheet
───────────────────────────────────────────────────────────────────────────── */

function TicketDetailSheet({
  ticketId,
  open,
  onOpenChange,
}: {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const updateStatus = useUpdateTicketStatus();

  const { data: ticket, isLoading } = useGetTicketById(ticketId, open);

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticketId) return;
    await updateStatus.mutateAsync({ id: ticketId, status });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Ticket Details
            </SheetTitle>
            <SheetDescription>
              Full information and staff actions for this support ticket.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-5 px-6 py-5">
              {isLoading && (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              )}

              {ticket && (
                <>
                  {/* Header row */}
                  <div className="bg-muted/30 border-border/50 flex items-center justify-between rounded-lg border p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider">Type</span>
                      <span className="font-semibold text-sm">
                        {TICKET_TYPE_LABEL[ticket.type] ?? ticket.type}
                      </span>
                    </div>
                    <TicketStatusBadge status={ticket.status} />
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="text-muted-foreground h-4 w-4 shrink-0" />
                      <span className="text-muted-foreground w-24">Ticket ID:</span>
                      <span className="font-mono text-xs">{ticket.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="text-muted-foreground h-4 w-4 shrink-0" />
                      <span className="text-muted-foreground w-24">Order ID:</span>
                      <span className="font-mono text-xs">{ticket.orderId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground h-4 w-4 shrink-0" />
                      <span className="text-muted-foreground w-24">Created:</span>
                      <span>{formatDateTime(ticket.createdAt)}</span>
                    </div>
                    {ticket.updatedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="text-muted-foreground h-4 w-4 shrink-0" />
                        <span className="text-muted-foreground w-24">Updated:</span>
                        <span>{formatDateTime(ticket.updatedAt)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Reason */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <FileText className="h-4 w-4" />
                      Reason
                    </div>
                    <p className="text-muted-foreground bg-muted/20 rounded-md p-3 text-sm leading-relaxed">
                      {ticket.reason}
                    </p>
                  </div>

                  {/* Proof */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <LinkIcon className="h-4 w-4" />
                      Proof / Evidence
                    </div>
                    <a
                      href={ticket.proof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 break-all text-sm underline underline-offset-2"
                    >
                      {ticket.proof}
                    </a>
                  </div>

                  <Separator />

                  {/* Items */}
                  {ticket.details && ticket.details.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Package className="h-4 w-4" />
                        Affected Items ({ticket.details.length})
                      </div>
                      <div className="flex flex-col gap-3">
                        {ticket.details.map((d) => (
                          <div
                            key={d.id}
                            className="bg-muted/20 border-border/50 rounded-lg border p-3"
                          >
                            <div className="flex items-start gap-3">
                              {d.thumbnailUrl && (
                                <img
                                  src={d.thumbnailUrl}
                                  alt={d.productName ?? ''}
                                  className="border-border h-10 w-10 shrink-0 rounded-md border object-cover"
                                />
                              )}
                              <div className="flex flex-col gap-0.5 text-sm">
                                <span className="font-medium">
                                  {d.productName ?? d.orderDetailId}
                                </span>
                                {d.variantName && (
                                  <span className="text-muted-foreground text-xs">
                                    {d.variantName}
                                  </span>
                                )}
                                {d.partId && (
                                  <span className="text-muted-foreground text-xs flex items-center gap-1">
                                    <Wrench className="h-3 w-3" />
                                    Part: <span className="text-foreground font-medium">{d.partId}</span>
                                  </span>
                                )}
                                <span className="text-muted-foreground text-xs">
                                  Qty: <span className="text-foreground font-medium">{d.quantity}</span>
                                </span>
                                {d.note && (
                                  <span className="text-muted-foreground text-xs italic">
                                    "{d.note}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Staff Action — Update Status */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <ShieldAlert className="h-4 w-4" />
                      Update Status (Staff)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {VALID_STATUSES.map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={ticket.status === s ? 'default' : 'outline'}
                          disabled={updateStatus.isPending || ticket.status === s}
                          onClick={() => handleStatusChange(s)}
                          className="text-xs"
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                    {updateStatus.isPending && (
                      <p className="text-muted-foreground text-xs">Updating...</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
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

  const canDelete = ticket.status === 'Open';

  // Chỉ hiện nút khi type eligible VÀ status = Processing
  const showReplacementBtn =
    (ticket.type === 'ReplacePart' || ticket.type === 'Exchange') &&
    ticket.status === 'Processing';

  const handleCreateShipment = async () => {
    await createDelivery.mutateAsync({
      orderId: ticket.orderId,
      supportTicketId: ticket.id,
    });
    // Refetch dữ liệu sau khi tạo shipping thành công
    onShipmentCreated?.();
  };

  return (
    <TableRow>
      {/* Ticket Code — dùng ticket.code nếu có, fallback về id */}
      <TableCell className="font-mono text-xs font-medium">
        {(ticket).code ?? ticket.id}
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
            View
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
  const [pageNumber,    setPageNumber]    = useState(1);
  const [statusFilter,  setStatusFilter]  = useState<string>(ALL_STATUS);

  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [sheetOpen,     setSheetOpen]     = useState(false);

  const [deleteTarget,  setDeleteTarget]  = useState<string | null>(null);
  const [deleteOpen,    setDeleteOpen]    = useState(false);

  /* ── data ── */
  const { data, isLoading, isError, refetch } = useGetTickets({
    pageNumber,
    pageSize: PAGE_SIZE,
    ...(statusFilter !== ALL_STATUS ? { status: statusFilter } : {}),
  });

  const deleteTicket = useDeleteTicket();

  /* ── handlers ── */

  const handleView = (id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
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

  /* ─────────────────────────────────────────────────────────────────────── */
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
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
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

      {/* Detail Sheet */}
      <TicketDetailSheet
        ticketId={selectedId}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedId(null);
        }}
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