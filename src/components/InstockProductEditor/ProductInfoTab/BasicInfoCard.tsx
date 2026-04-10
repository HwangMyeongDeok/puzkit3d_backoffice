'use client';

import slugify from 'slugify';
import { type UseFormReturn } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import type { ProductFormValues } from '@/pages/manager/product-editor/schema';

interface BasicInfoCardProps {
  form: UseFormReturn<ProductFormValues>;
  isCreateMode: boolean;
}

export function BasicInfoCard({ form, isCreateMode }: BasicInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Awesome Product" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      if (isCreateMode) {
                        const autoSlug = slugify(e.target.value, { lower: true, strict: true, locale: 'vi', trim: true });
                        form.setValue('slug', autoSlug, { shouldValidate: false, shouldDirty: true });
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug *</FormLabel>
                <FormControl><Input placeholder="my-product" {...field} /></FormControl>
                <FormDescription>Auto-generated from name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your product..." 
                  className="min-h-20" 
                  {...field} 
                  value={field.value || ''} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}