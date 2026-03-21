'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Loader2, X, Check, PowerOff, CheckCircle, Pencil } from 'lucide-react';
import { z } from 'zod';
import type { InstockPriceDetailDto } from '@/types/types';
import {
  usePriceDetailsByVariantId,
  useCreatePriceDetail,
  useUpdatePriceDetail,
  useDeletePriceDetail,
} from '@/hooks/useInstockPriceDetailQueries';
import { useInstockPrices } from '@/hooks/useInstockPriceQueries';

// ─── Schema ──────────────────────────────────────────────────────
const priceFormSchema = z.object({
  priceId: z.string().min(1, 'Price campaign is required'),
  unitPrice: z.coerce.number().min(10000, 'Unit price must be at least 10,000'),
  isActive: z.boolean(),
});

type PriceFormValues = z.infer<typeof priceFormSchema>;

// ─── Component ───────────────────────────────────────────────────
interface PriceDetailsAccordionProps {
  variantId: string;
}

export function PriceDetailsAccordion({ variantId }: PriceDetailsAccordionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingDetail, setEditingDetail] = useState<InstockPriceDetailDto | null>(null);
  const [detailToDeactivate, setDetailToDeactivate] = useState<InstockPriceDetailDto | null>(null);

  // Queries
  const { data: priceDetails, isLoading } = usePriceDetailsByVariantId(variantId);
  const { data: priceOptionsResponse, isLoading: isPriceOptionsLoading, isError: isPriceOptionsError } =
    useInstockPrices({ pageNumber: 1, pageSize: 100 });

  // Mutations
  const createMutation = useCreatePriceDetail();
  const updateMutation = useUpdatePriceDetail();
  const deleteMutation = useDeletePriceDetail();

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceFormSchema) as any, // Zod resolver có typing phức tạp, nên tạm thời cast sang any để tránh lỗi TS
    defaultValues: { priceId: '', unitPrice: 0, isActive: true },
  });

  const priceOptions = priceOptionsResponse?.items ?? [];

  const sortedDetails = priceDetails
    ? [...priceDetails].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.priority - b.priority;
      })
    : [];

  const resetFormState = () => {
    setIsAdding(false);
    setEditingDetail(null);
    form.reset({ priceId: '', unitPrice: 0, isActive: true });
  };

  const handleEdit = (detail: InstockPriceDetailDto) => {
    setEditingDetail(detail);
    setIsAdding(true);
    form.reset({
      priceId: detail.priceId,
      unitPrice: detail.unitPrice,
      isActive: detail.isActive,
    });
  };

  const onSubmit = async (values: PriceFormValues) => {
    try {
      if (editingDetail) {
        const updatePayload: { unitPrice: number; isActive?: boolean } = {
          unitPrice: values.unitPrice,
          isActive: values.isActive,
        };
        
        if (values.isActive === editingDetail.isActive) {
          delete updatePayload.isActive;
        }

        await updateMutation.mutateAsync({
          id: editingDetail.id,
          data: updatePayload,
        });
        toast.success('Price detail updated');
      } else {
        await createMutation.mutateAsync({
          priceId: values.priceId,
          variantId,
          unitPrice: values.unitPrice,
          isActive: values.isActive,
        });
        toast.success('Price detail added');
      }
      resetFormState();
    } catch {
      toast.error(editingDetail ? 'Failed to update price detail' : 'Failed to add price detail');
    }
  };

  // Activate: no confirm needed
  const handleActivate = async (detail: InstockPriceDetailDto) => {
    try {
      await updateMutation.mutateAsync({
        id: detail.id,
        data: { isActive: true },
      });
      toast.success('Price detail activated');
    } catch {
      toast.error('Failed to activate price detail');
    }
  };

  // Deactivate via DELETE endpoint: requires confirm
  const handleConfirmDeactivate = async () => {
    if (!detailToDeactivate) return;
    try {
      await deleteMutation.mutateAsync(detailToDeactivate.id);
      toast.success('Price detail deactivated');
    } catch {
      toast.error('Failed to deactivate price detail');
    } finally {
      setDetailToDeactivate(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold">Price Details ({sortedDetails.length})</h3>
          <p className="text-sm text-muted-foreground">
            Assign price campaigns and unit prices for this variant.
          </p>
        </div>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Price
          </Button>
        )}
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingDetail ? 'Edit Price Detail' : 'Add New Price Detail'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Price Campaign — locked when editing */}
                <FormField
                  control={form.control}
                  name="priceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Campaign</FormLabel>
                      <FormControl>
                        <Select
                          disabled={!!editingDetail || isPriceOptionsLoading}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isPriceOptionsLoading ? 'Loading...' : 'Select price campaign'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {priceOptions.map((opt) => {
                              const alreadyUsed = sortedDetails.some(
                                (d) => d.priceId === opt.id && d.id !== editingDetail?.id,
                              );
                              return (
                                <SelectItem key={opt.id} value={opt.id} disabled={alreadyUsed}>
                                  {opt.name}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      {isPriceOptionsError && (
                        <p className="text-sm text-destructive">Failed to load price campaigns.</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Minimum 10,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3 pt-8">
                        <FormLabel>Active</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isMutating}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={isMutating}>
                    {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Check className="mr-1 h-4 w-4" />
                    {editingDetail ? 'Update' : 'Add'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetFormState} disabled={isMutating}>
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {sortedDetails.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDetails.map((detail) => (
                    <TableRow key={detail.id}>
                      <TableCell className="font-medium">{detail.priceName}</TableCell>
                      <TableCell className="font-mono">
                        {detail.unitPrice.toLocaleString()}
                      </TableCell>
                      <TableCell>{detail.priority}</TableCell>
                      <TableCell>
                        <Badge variant={detail.isActive ? 'default' : 'secondary'}>
                          {detail.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(detail)}
                            title="Edit"
                            disabled={isMutating}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {detail.isActive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDetailToDeactivate(detail)}
                              title="Deactivate"
                              disabled={isMutating}
                              className="text-destructive hover:text-destructive"
                            >
                              <PowerOff className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActivate(detail)}
                              title="Activate"
                              disabled={isMutating}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : !isAdding ? (
        <div className="rounded-lg border bg-muted/30 p-8 text-center">
          <p className="mb-4 text-muted-foreground">No prices added yet</p>
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add First Price
          </Button>
        </div>
      ) : null}

      {/* Deactivate Confirm Dialog */}
      <AlertDialog
        open={!!detailToDeactivate}
        onOpenChange={(open) => !open && setDetailToDeactivate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate price detail?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the price detail for campaign{' '}
              <strong>{detailToDeactivate?.priceName}</strong>. You can reactivate it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDeactivate(); }}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteMutation.isPending ? 'Processing...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}