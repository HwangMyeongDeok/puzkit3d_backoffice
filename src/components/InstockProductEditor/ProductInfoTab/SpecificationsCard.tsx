'use client';

import { type UseFormReturn } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

import type { ProductFormValues } from '@/pages/manager/product-editor/schema';

// Khai báo type cơ bản cho các danh sách để tránh lỗi TypeScript
interface MasterDataItem {
  id: string;
  name: string;
}

interface SpecificationsCardProps {
  form: UseFormReturn<ProductFormValues>;
  topics: MasterDataItem[] | undefined;
  materials: MasterDataItem[] | undefined;
  assemblyMethods: MasterDataItem[] | undefined;
  capabilities: MasterDataItem[] | undefined;
}

export function SpecificationsCard({ form, topics, materials, assemblyMethods, capabilities }: SpecificationsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Specifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="difficultLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Difficulty Level</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estimatedBuildTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Build Time (min)</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="totalPieceCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Piece Count</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="topicId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topic</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {topics?.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="materialId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {materials?.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="assemblyMethodId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assembly Method</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {assemblyMethods?.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="capabilityIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capabilities</FormLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {capabilities?.map((cap) => {
                  const checked = field.value?.includes(cap.id);
                  return (
                    <label key={cap.id} className={`flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${checked ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
                      <input 
                        type="checkbox" 
                        checked={checked} 
                        className="hidden" 
                        onChange={(e) => {
                          const updated = e.target.checked 
                            ? [...(field.value || []), cap.id] 
                            : field.value?.filter((id) => id !== cap.id);
                          field.onChange(updated);
                        }} 
                      />
                      {cap.name}
                    </label>
                  );
                })}
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}