'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Pencil, Plus, CheckCircle, XCircle } from 'lucide-react';

import { DateRangePicker, type DateRange } from '@/components/DateRangePicker';

import {
  useInstockPrices, useCreateInstockPrice, useUpdateInstockPrice,
  useToggleInstockPriceStatus, INSTOCK_PRICE_KEYS,
} from '@/hooks/useInstockPriceQueries';
import type {
  InstockPriceDto, UpdateInstockPriceRequestDto, CreateInstockPriceRequestDto,
} from '@/types/types';


const priceSchema = z.object({
  name:      z.string().min(1, 'Name is required').max(100),
  priority:  z.number().int().min(0, 'Priority must be ≥ 0'),
  dateRange: z
    .custom<DateRange>((v) => v !== null && v !== undefined, {
      message: 'Please select a date range',
    }),
  isActive:  z.boolean(),
  _isEdit:   z.boolean().optional(),
});

type PriceFormValues = z.infer<typeof priceSchema>;

// ─── Helpers ─────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

/** Build ISO string from a Date + hour + minute */
function toUtcIso(d: Date, h: number, m: number): string {
  const copy = new Date(d);
  copy.setHours(h, m, 0, 0);
  return copy.toISOString();
}

/** Parse an ISO/date string into a DateRange-compatible object */
function parseDateRange(
  fromIso?: string | null,
  toIso?: string | null,
): DateRange | null {
  if (!fromIso || !toIso) return null;
  const from = new Date(fromIso);
  const to   = new Date(toIso);
  return {
    from, to,
    fromHour:   from.getHours(),
    fromMinute: from.getMinutes(),
    toHour:     to.getHours(),
    toMinute:   to.getMinutes(),
  };
}

// ─── Date Range Bar (table cell) ─────────────────────────────────

function DateRangeBar({
  from, to, isActive,
}: {
  from?: string | Date | null;
  to?: string | Date | null;
  isActive: boolean;
}) {
  const fmt = (d?: string | Date | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };
  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      <div className="flex items-center gap-1.5">
        <span className={`h-[7px] w-[7px] rounded-full shrink-0 border-[1.5px] ${
          isActive ? 'border-emerald-500 bg-emerald-400' : 'border-border bg-muted'
        }`} />
        <div className={`flex-1 h-[2px] rounded-full ${
          isActive ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-border'
        }`} />
        <span className={`h-[7px] w-[7px] rounded-full shrink-0 border-[1.5px] ${
          isActive ? 'border-emerald-600 bg-emerald-500' : 'border-border bg-muted'
        }`} />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>{fmt(from)}</span>
        <span>{fmt(to)}</span>
      </div>
    </div>
  );
}

// ─── Price Form Dialog ───────────────────────────────────────────

interface PriceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  price?: InstockPriceDto;
}

function PriceFormDialog({ open, onOpenChange, price }: PriceFormDialogProps) {
  const queryClient    = useQueryClient();
  const createMutation = useCreateInstockPrice();
  const updateMutation = useUpdateInstockPrice();
  const isEdit = !!price;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceSchema) as any,
    defaultValues: {
      name:      '',
      priority:  1,
      dateRange: undefined as unknown as DateRange,
      isActive:  true,
      _isEdit:   false,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (price) {
      form.reset({
        name:      price.name,
        priority:  price.priority,
        dateRange: parseDateRange(price.effectiveFrom, price.effectiveTo) as DateRange,
        isActive:  price.isActive,
        _isEdit:   true,
      });
    } else {
      form.reset({
        name:      '',
        priority:  1,
        dateRange: undefined as unknown as DateRange,
        isActive:  true,
        _isEdit:   false,
      });
    }
  }, [price, open, form]);

  const onSubmit = async (values: PriceFormValues) => {
    const { dateRange } = values;
    try {
      if (isEdit && price) {
        const payload: Partial<UpdateInstockPriceRequestDto> = {
          name:          values.name,
          priority:      values.priority,
          effectiveFrom: toUtcIso(dateRange.from, dateRange.fromHour, dateRange.fromMinute),
          effectiveTo:   toUtcIso(dateRange.to,   dateRange.toHour,   dateRange.toMinute),
        };
        // ✅ Only send isActive if it actually changed
        if (values.isActive !== price.isActive) payload.isActive = values.isActive;
        await updateMutation.mutateAsync({ id: price.id, data: payload as UpdateInstockPriceRequestDto });
        toast.success('Campaign updated');
      } else {
        await createMutation.mutateAsync({
          name:          values.name,
          priority:      values.priority,
          effectiveFrom: toUtcIso(dateRange.from, dateRange.fromHour, dateRange.fromMinute),
          effectiveTo:   toUtcIso(dateRange.to,   dateRange.toHour,   dateRange.toMinute),
          isActive:      values.isActive,
        } as CreateInstockPriceRequestDto);
        toast.success('Campaign created');
      }
      queryClient.invalidateQueries({ queryKey: INSTOCK_PRICE_KEYS.lists() });
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? 'Failed to update' : 'Failed to create');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const watchRange  = form.watch('dateRange');
  const watchActive = form.watch('isActive');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] gap-0 p-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b">
          <DialogTitle className="text-[15px] font-medium">
            {isEdit ? 'Edit campaign' : 'New campaign'}
          </DialogTitle>
          <DialogDescription className="text-xs mt-0.5">
            {isEdit
              ? 'Update this price campaign.'
              : 'Start date must be today or in the future.'}
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4">

              {/* Name */}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground">
                    Campaign name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Summer Sale 2026"
                      className="h-9 text-sm" disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              {/* Priority */}
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground">
                    Priority
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number" min={0}
                      className="h-9 text-sm" disabled={isPending}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              {/* Date range — single picker for both from & to */}
              <FormField control={form.control} name="dateRange" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground">
                    Effective period
                  </FormLabel>
                  <FormControl>
                    <DateRangePicker
                      value={field.value ?? null}
                      onChange={field.onChange}
                      disabled={isPending}
                      // When creating: disallow past days. When editing: no restriction.
                      minDate={isEdit ? undefined : today}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              {/* Period preview — shown after range is selected */}
              {watchRange?.from && watchRange?.to && (
                <div className="rounded-md border bg-muted/40 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                    Period preview
                  </p>
                  <DateRangeBar
                    from={watchRange.from}
                    to={watchRange.to}
                    isActive={watchActive}
                  />
                </div>
              )}

              {/* Active status */}
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-4 py-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">
                      Active status
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      {field.value ? 'Campaign is live' : 'Campaign is paused'}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )} />

            </div>

            {/* Footer */}
            <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2">
              <Button
                type="button" variant="outline" size="sm"
                onClick={() => onOpenChange(false)} disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending
                  ? (isEdit ? 'Saving…' : 'Creating…')
                  : (isEdit ? 'Save changes' : 'Create campaign')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function PriceManagementPage() {
  const [page,          setPage]          = useState(1);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [statusFilter,  setStatusFilter]  = useState<string>('all');
  const [priceFormOpen, setPriceFormOpen] = useState(false);
  const [editingPrice,  setEditingPrice]  = useState<InstockPriceDto | null>(null);
  const [priceToToggle, setPriceToToggle] = useState<InstockPriceDto | null>(null);
  const pageSize = 10;

  const isActiveQuery =
    statusFilter === 'all' ? undefined : statusFilter === 'active';

  const { data: pricesData, isLoading, isError } = useInstockPrices({
    pageNumber: page, pageSize,
    searchTerm: searchTerm || undefined,
    isActive:   isActiveQuery,
  });

  const toggleMutation = useToggleInstockPriceStatus();
  const queryClient    = useQueryClient();

  const handleConfirmToggle = async () => {
    if (!priceToToggle) return;
    try {
      await toggleMutation.mutateAsync({ id: priceToToggle.id, isActive: priceToToggle.isActive });
      toast.success(`Campaign ${priceToToggle.isActive ? 'deactivated' : 'activated'}`);
      queryClient.invalidateQueries({ queryKey: INSTOCK_PRICE_KEYS.lists() });
    } catch {
      toast.error('Failed to toggle status');
    } finally {
      setPriceToToggle(null);
    }
  };

  const prices     = pricesData?.items      || [];
  const totalPages = pricesData?.totalPages || 1;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Price management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage campaigns and effective periods
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditingPrice(null); setPriceFormOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New campaign
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 flex-wrap">
        <Input
          placeholder="Search by name…"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          className="h-8 text-sm w-[200px]"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="h-8 text-sm w-[150px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="inactive">Inactive only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isError ? (
        <p className="text-sm text-destructive">Failed to load campaigns.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : prices.length === 0 ? (
        <div className="text-center py-14 text-sm text-muted-foreground">No campaigns found.</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {['Name', 'Effective period', 'Priority', 'Status', 'Created', ''].map((h, i) => (
                  <TableHead
                    key={i}
                    className="text-[11px] uppercase tracking-wide font-medium h-9"
                    style={i === 5 ? { textAlign: 'right' } : {}}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {prices.map((price) => (
                <TableRow
                  key={price.id}
                  className={!price.isActive ? 'opacity-45 hover:opacity-60 transition-opacity' : ''}
                >
                  <TableCell className="font-medium text-sm py-3">{price.name}</TableCell>

                  <TableCell className="py-3">
                    <DateRangeBar
                      from={price.effectiveFrom}
                      to={price.effectiveTo}
                      isActive={price.isActive}
                    />
                  </TableCell>

                  <TableCell className="py-3">
                    <span className="inline-flex items-center justify-center h-[22px] w-[22px] rounded-md border bg-muted text-[11px] font-medium text-muted-foreground">
                      {price.priority}
                    </span>
                  </TableCell>

                  <TableCell className="py-3">
                    <Badge
                      variant={price.isActive ? 'default' : 'secondary'}
                      className="rounded-full text-[11px] font-normal px-2.5 py-0.5"
                    >
                      {price.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground py-3">
                    {new Date(price.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </TableCell>

                  <TableCell className="py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon" variant="ghost"
                        className="h-7 w-7 rounded-md text-muted-foreground"
                        onClick={() => { setEditingPrice(price); setPriceFormOpen(true); }}
                        disabled={toggleMutation.isPending} title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        className={`h-7 w-7 rounded-md ${
                          price.isActive
                            ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                            : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                        onClick={() => setPriceToToggle(price)}
                        disabled={toggleMutation.isPending}
                        title={price.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {price.isActive
                          ? <XCircle     className="h-3.5 w-3.5" />
                          : <CheckCircle className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <Button variant="outline" size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      )}

      {/* Form dialog */}
      <PriceFormDialog
        open={priceFormOpen}
        onOpenChange={(open) => { setPriceFormOpen(open); if (!open) setEditingPrice(null); }}
        price={editingPrice ?? undefined}
      />

      {/* Toggle confirm */}
      <AlertDialog open={!!priceToToggle} onOpenChange={(open) => !open && setPriceToToggle(null)}>
        <AlertDialogContent className="max-w-[360px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px]">Confirm status change</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will{' '}
              <span className="font-medium text-foreground">
                {priceToToggle?.isActive ? 'deactivate' : 'activate'}
              </span>{' '}
              the campaign{' '}
              <span className="font-medium text-foreground">{priceToToggle?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleMutation.isPending} className="h-8 text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmToggle(); }}
              disabled={toggleMutation.isPending}
              className={`h-8 text-sm ${
                priceToToggle?.isActive
                  ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                  : ''
              }`}
            >
              {toggleMutation.isPending ? 'Processing…' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}