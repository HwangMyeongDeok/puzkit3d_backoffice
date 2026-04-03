import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useCustomerOrders, useUpdateInstockOrderStatus, INSTOCK_ORDER_STATUSES } from '@/hooks/useInstockOrderQueries';
import { type InstockOrderStatus } from '@/types/types';

import { PAGE_SIZE, ALL_STATUS } from '@/components/order/constants';
import { formatCurrency } from '@/components/order/utils';
import { OrderRow } from '@/components/order/OrderRow';
import { OrderDetailDialog } from '@/components/order/OrderDetailDialog';

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