import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save } from 'lucide-react';
import type { InstockProductVariantDto } from '@/types/types';
import {
  useCreateInstockProductVariant,
  useUpdateInstockProductVariant,
} from '@/hooks/useInstockProductQueries';
import { variantFormSchema, type VariantFormValues } from '@/pages/manager/product-editor/schema';
import { PriceDetailsAccordion } from './PriceDetailsAccordion';

interface VariantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variant: InstockProductVariantDto | null;
}

export function VariantSheet({
  open,
  onOpenChange,
  productId,
  variant,
}: VariantSheetProps) {
  const isCreateMode = !variant;

  // Mutations
  const createMutation = useCreateInstockProductVariant();
  const updateMutation = useUpdateInstockProductVariant();

  const defaultValues: VariantFormValues = {
    color: variant?.color || '',
    assembledLengthMm: variant?.assembledLengthMm || 0,
    assembledWidthMm: variant?.assembledWidthMm || 0,
    assembledHeightMm: variant?.assembledHeightMm || 0,
    isActive: variant?.isActive ?? true,
  };

  const form = useForm<VariantFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(variantFormSchema) as any,
    values: defaultValues,
  });

  const onSubmit = async (values: VariantFormValues) => {
    try {
      if (isCreateMode) {
        await createMutation.mutateAsync({
          productId,
          data: values,
        });
        toast.success('Variant created successfully!');
        onOpenChange(false);
      } else if (variant) {
        let updatePayload: Partial<VariantFormValues> = { ...values };
        if (values.isActive === variant.isActive) {
          const { isActive, ...rest } = updatePayload;
          updatePayload = rest;
        }

        await updateMutation.mutateAsync({
          productId,
          variantId: variant.id,
          data: updatePayload,
        });
        toast.success('Variant updated successfully!');
        onOpenChange(false);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isCreateMode
            ? 'Failed to create variant'
            : 'Failed to update variant',
      );
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isCreateMode ? 'Create Variant' : `Edit Variant - ${variant?.sku}`}
          </SheetTitle>
          <SheetDescription>
            {isCreateMode
              ? 'Add a new color/dimension variant'
              : 'Update variant details and manage prices'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Variant Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="variant-form">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input placeholder="Red" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="assembledLengthMm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assembledWidthMm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assembledHeightMm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 py-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded border cursor-pointer"
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Active</FormLabel>
                  </FormItem>
                )}
              />
            </form>
          </Form>

          {/* Price Details Section - Only show when editing */}
          {!isCreateMode && variant && (
            <>
              <Separator />
              <PriceDetailsAccordion
                variantId={variant.id}
              />
            </>
          )}

          {/* Update Button at Bottom */}
          <Button
            type="submit"
            form="variant-form"
            disabled={isSubmitting}
            className="w-full gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSubmitting
              ? 'Saving...'
              : isCreateMode
                ? 'Create Variant'
                : 'Update Variant'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
