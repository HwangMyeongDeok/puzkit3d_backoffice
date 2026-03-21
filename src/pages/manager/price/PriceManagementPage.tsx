'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

// --- UI Components ---
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// --- Icons ---
import { Pencil, Plus, CheckCircle, PowerOff } from 'lucide-react';

// --- Hooks & Types ---
import {
  useInstockPrices,
  useCreateInstockPrice,
  useUpdateInstockPrice,
  useToggleInstockPriceStatus,
  INSTOCK_PRICE_KEYS,
} from '@/hooks/useInstockPriceQueries';
import type { 
  InstockPriceDto, 
  UpdateInstockPriceRequestDto, 
  CreateInstockPriceRequestDto 
} from '@/types/types';
import { priceSchema, type PriceFormValues } from './schema';

// ─── Price Form Dialog (Create / Edit) ──────────────────────────
interface PriceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  price?: InstockPriceDto;
}

function PriceFormDialog({ open, onOpenChange, price }: PriceFormDialogProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateInstockPrice();
  const updateMutation = useUpdateInstockPrice();

  // KHÔNG DÙNG "any" - Chỉ cần truyền PriceFormValues là đủ để TypeScript suy luận
  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceSchema) as any, // Zod resolver có typing hơi phức tạp, nên tạm thời cast sang any để tránh lỗi TS
    defaultValues: {
      name: '',
      effectiveFrom: null as unknown as Date, // Fallback null safely for form reset
      effectiveTo: null as unknown as Date,
      priority: 1,
      isActive: true,
    },
  });

  useEffect(() => {
    if (price) {
      form.reset({
        name: price.name,
        effectiveFrom: price.effectiveFrom ? new Date(price.effectiveFrom) : null as unknown as Date,
        effectiveTo: price.effectiveTo ? new Date(price.effectiveTo) : null as unknown as Date,
        priority: price.priority,
        isActive: price.isActive,
      });
    } else {
      form.reset({
        name: '',
        effectiveFrom: null as unknown as Date,
        effectiveTo: null as unknown as Date,
        priority: 1,
        isActive: true,
      });
    }
  }, [price, form]);

  const toUtcIsoString = (dateObj: Date | string | null | undefined): string => {
    if (!dateObj) return '';
    return new Date(dateObj).toISOString();
  };

  const onSubmit = async (values: PriceFormValues) => {
    // Ép kiểu chuẩn thay vì dùng any
    const basePayload = {
      name: values.name,
      priority: values.priority,
      effectiveFrom: toUtcIsoString(values.effectiveFrom),
      effectiveTo: toUtcIsoString(values.effectiveTo),
      isActive: values.isActive,
    };

    try {
      if (price) {
        // Xử lý lách luật Backend: Gỡ bỏ isActive nếu không thay đổi
        let updatePayload: Partial<UpdateInstockPriceRequestDto> = { ...basePayload };
        
        if (values.isActive === price.isActive) {
          const { isActive, ...rest } = updatePayload;
          updatePayload = rest; // Xóa isActive an toàn có typing
        }

        await updateMutation.mutateAsync({ 
          id: price.id, 
          data: updatePayload as UpdateInstockPriceRequestDto 
        });
        toast.success('Price updated successfully');
      } else {
        await createMutation.mutateAsync(basePayload as CreateInstockPriceRequestDto);
        toast.success('Price created successfully');
      }
      
      queryClient.invalidateQueries({ queryKey: INSTOCK_PRICE_KEYS.lists() });
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error(price ? 'Failed to update price' : 'Failed to create price');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const toDatetimeLocalValue = (val: Date | string | null | undefined) => {
    if (!val || isNaN(new Date(val).getTime())) return '';
    const d = new Date(val);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{price ? 'Edit Price' : 'Create New Price'}</DialogTitle>
          <DialogDescription>
            {price ? 'Update price campaign details' : 'Add a new price campaign'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Summer Sale 2026" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      disabled={isPending}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effectiveFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective From</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      disabled={isPending}
                      {...field}
                      // Bỏ as Date | string | null thay bằng kiểu chuẩn
                      value={toDatetimeLocalValue(field.value)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effectiveTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective To</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      disabled={isPending}
                      {...field}
                      value={toDatetimeLocalValue(field.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 pt-2">
                  <FormLabel className="pt-2">Active Status</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? (price ? 'Updating...' : 'Creating...')
                  : (price ? 'Update' : 'Create')}
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
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priceFormOpen, setPriceFormOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<InstockPriceDto | null>(null);
  const [priceToToggle, setPriceToToggle] = useState<InstockPriceDto | null>(null);
  const pageSize = 10;

  // Xử lý param isActive để gửi API Filter
  const isActiveQuery = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const { data: pricesData, isLoading, isError } = useInstockPrices({
    pageNumber: page,
    pageSize,
    searchTerm: searchTerm || undefined,
    isActive: isActiveQuery,
  });

  const toggleMutation = useToggleInstockPriceStatus();

  const handleEditPrice = (price: InstockPriceDto) => {
    setEditingPrice(price);
    setPriceFormOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!priceToToggle) return;
    try {
      await toggleMutation.mutateAsync({
        id: priceToToggle.id,
        isActive: priceToToggle.isActive,
      });
      toast.success(`Price ${priceToToggle.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch {
      toast.error('Failed to toggle price status');
    } finally {
      setPriceToToggle(null);
    }
  };

  const prices = pricesData?.items || [];
  const totalPages = pricesData?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Price Management</h1>
          <p className="text-muted-foreground mt-2">Manage price campaigns</p>
        </div>
        <Button
          onClick={() => {
            setEditingPrice(null);
            setPriceFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Price
        </Button>
      </div>

      {/* Action Bar (Search & Filter) */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search prices by name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        
        <Select 
          value={statusFilter} 
          onValueChange={(val) => {
            setStatusFilter(val);
            setPage(1); // Reset page khi đổi filter
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isError ? (
        <div className="text-destructive">Failed to load prices</div>
      ) : isLoading ? (
        <div className="text-muted-foreground">Loading prices...</div>
      ) : prices.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">No prices found</div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Effective Period</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prices.map((price) => (
                <TableRow 
                  key={price.id}
                  className={!price.isActive ? 'opacity-50 bg-muted/30 hover:opacity-80 transition-opacity' : ''}
                >
                  <TableCell className="font-semibold">{price.name}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(price.effectiveFrom || '').toLocaleDateString()} –{' '}
                    {new Date(price.effectiveTo || '').toLocaleDateString()}
                  </TableCell>
                  <TableCell>{price.priority}</TableCell>
                  <TableCell>
                    <Badge variant={price.isActive ? 'default' : 'secondary'}>
                      {price.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(price.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditPrice(price)}
                      title="Edit price"
                      disabled={toggleMutation.isPending}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={price.isActive ? 'destructive' : 'secondary'}
                      onClick={() => setPriceToToggle(price)}
                      title={price.isActive ? 'Deactivate' : 'Activate'}
                      disabled={toggleMutation.isPending}
                    >
                      {price.isActive ? <PowerOff className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Price Form Dialog */}
      <PriceFormDialog
        open={priceFormOpen}
        onOpenChange={setPriceFormOpen}
        price={editingPrice ?? undefined}
      />

      {/* Toggle Confirm Dialog */}
      <AlertDialog open={!!priceToToggle} onOpenChange={(open) => !open && setPriceToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will <strong>{priceToToggle?.isActive ? 'deactivate' : 'activate'}</strong> the price{' '}
              <strong>{priceToToggle?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmToggle(); }}
              disabled={toggleMutation.isPending}
              className={
                priceToToggle?.isActive
                  ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                  : 'bg-primary hover:bg-primary/90'
              }
            >
              {toggleMutation.isPending ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}