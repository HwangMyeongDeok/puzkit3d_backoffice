'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';

import { variantFormSchema, type VariantFormValues } from '@/pages/manager/product-editor/schema';
import type { VariantWithInventory } from '@/hooks/useVariantsWithInventoryQueries';
import { PriceDetailsAccordion } from './PriceDetailsAccordion';

interface InlineVariantEditorProps {
  mode: 'add-variant' | 'edit-variant';
  variant: VariantWithInventory | null;
  onSave: (values: VariantFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}

export function InlineVariantEditor({ mode, variant, onSave, onCancel, isSubmitting }: InlineVariantEditorProps) {
  const defaultValues: VariantFormValues = {
    color: variant?.color || '',
    assembledLengthMm: variant?.assembledLengthMm || 0,
    assembledWidthMm: variant?.assembledWidthMm || 0,
    assembledHeightMm: variant?.assembledHeightMm || 0,
    isActive: variant?.isActive ?? true,
    initialStock: variant?.stockQuantity ?? 0,
  };

  const form = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema) as unknown as Resolver<VariantFormValues>,
    values: defaultValues,
  });

  return (
    <Card className="border-brand/20 shadow-sm animate-in fade-in zoom-in-95 duration-200">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onCancel && (
              <Button variant="outline" size="icon" onClick={onCancel} className="h-8 w-8 text-slate-500">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle className="text-xl text-slate-800">
                {mode === 'add-variant' ? 'Create New Variant' : `Edit Variant: ${variant?.sku}`}
              </CardTitle>
              <CardDescription>Update dimensions, colors, and status.</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-8" id="inline-variant-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Red, Walnut..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initialStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{mode === 'add-variant' ? 'Initial Stock Quantity' : 'Stock Quantity'}</FormLabel>
                    <FormControl><Input type="number" min="0" placeholder="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-4">Dimensions (mm)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="assembledLengthMm" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs uppercase">Length</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="assembledWidthMm" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs uppercase">Width</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="assembledHeightMm" render={({ field }) => (
                  <FormItem><FormLabel className="text-xs uppercase">Height</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl></FormItem>
                )} />
              </div>
            </div>

            <div className="rounded-lg border bg-slate-50/50 p-4">
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div>
                    <FormLabel className="text-base cursor-pointer">Active Variant</FormLabel>
                    <FormDescription>Turn on to make this variant visible.</FormDescription>
                  </div>
                  <FormControl>
                    <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-5 w-5 rounded border-gray-300 text-brand cursor-pointer" />
                  </FormControl>
                </FormItem>
              )} />
            </div>
          </form>
        </Form>

        {mode === 'edit-variant' && variant && (
          <div className="mt-8 space-y-4">
            <h4 className="font-semibold text-slate-800">Pricing Management</h4>
            <div className="rounded-lg border">
              <PriceDetailsAccordion variantId={variant.id} />
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-end gap-3 border-t pt-6">
          {onCancel && <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>}
          <Button type="submit" form="inline-variant-form" disabled={isSubmitting} className="min-w-[140px]">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}