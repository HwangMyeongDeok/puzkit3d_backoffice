import { useState } from 'react';
import { Ticket, RefreshCw, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { useGetTickets, useDeleteTicket } from '@/services/supportTicketApi';

import { PAGE_SIZE, ALL_STATUS, STATUS_FILTER_OPTIONS } from '@/components/support/constants';
import { TicketRow, TableRowSkeleton } from '@/components/support/TicketRow';
import { TicketDetailDialog } from '@/components/support/TicketDetail/TicketDetailDialog';
import { type SupportTicketListItemDto } from '@/services/supportTicketApi';

export function TicketManagement() {
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
  // TypeScript sẽ tự động hiểu `t` là SupportTicketListItemDto nếu useGetTickets chuẩn
  const openCount = data?.items.filter((t: SupportTicketListItemDto) => t.status === 'Open').length ?? 0;
  const pendingCount = data?.items.filter((t: SupportTicketListItemDto) => t.status === 'Processing').length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">
            Review customer reports and manage replacements, exchanges, and returns.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

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
            <CardTitle className="text-blue-600 flex items-center gap-2 text-2xl">{openCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress (this page)</CardDescription>
            <CardTitle className="text-yellow-600 flex items-center gap-2 text-2xl">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

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
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isError && (
            <div className="bg-destructive/5 text-destructive border-destructive/20 mb-4 rounded-lg border p-4 text-sm">
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
                    <TableCell colSpan={6} className="text-muted-foreground h-32 text-center">
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
                      isDeleting={deleteTicket.isPending && deleteTicket.variables === ticket.id}
                      onShipmentCreated={refetch}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {data && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Page {data.pageNumber} of {totalPages || 1} &bull; {data.totalCount} tickets total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={!data.hasPreviousPage}
                  onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={!data.hasNextPage}
                  onClick={() => setPageNumber((p) => p + 1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TicketDetailDialog
        ticketId={selectedId}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedId(null);
        }}
        onShipmentCreated={refetch}
      />

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
              <span className="font-medium">Note: only tickets with status &quot;Open&quot; can be deleted.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTicket.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteTicket.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteTicket.isPending ? 'Deleting...' : 'Delete Ticket'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}