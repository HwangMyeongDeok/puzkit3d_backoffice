'use client';

import { type UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

import type { ProductFormValues } from '@/pages/manager/product-editor/schema';
// IMPORT CÁC TYPE TỪ API
import type { 
  TopicItem, 
  MaterialItem, 
  FilterBriefItem, 
  CapabilityDriveBriefItem 
} from '@/services/catalogApi';

// Định nghĩa Type chuẩn cho mảng DriveDetails trong Form
interface DriveDetail {
  driveId: string;
  quantity: number;
}

interface SpecificationsCardProps {
  form: UseFormReturn<ProductFormValues>;
  topics: TopicItem[] | undefined;
  materials: MaterialItem[] | undefined;
  capabilities: FilterBriefItem[] | undefined;
  drives: CapabilityDriveBriefItem[] | undefined;
  assemblyMethods: FilterBriefItem[] | undefined;
  isCalculating: boolean;
}

export function SpecificationsCard({ 
  form, topics, materials, capabilities, drives, assemblyMethods, isCalculating 
}: SpecificationsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Specifications Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Bước 1: Chọn Topic và Material */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="topicId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>1. Topic</FormLabel>
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
                <FormLabel>2. Material</FormLabel>
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
        </div>

        {/* Bước 2: Chọn Capabilities (Hiển thị dựa trên Topic & Material) */}
        <FormField
          control={form.control}
          name="capabilityIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>3. Capabilities</FormLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {capabilities?.length ? capabilities.map((cap) => {
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
                            : field.value?.filter((id: string) => id !== cap.id);
                          field.onChange(updated);
                        }} 
                      />
                      <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${checked ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-transparent'}`}>
                        {checked && <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78748L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>}
                      </div>
                      {cap.name}
                    </label>
                  );
                }) : <span className="text-sm text-muted-foreground italic">Select Topic and Material to load capabilities...</span>}
              </div>
            </FormItem>
          )}
        />

        {/* Bước 3: Chọn Drives & Số lượng (Dựa trên Capabilities đã chọn) */}
        <FormField
          control={form.control}
          name="driveDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>4. Drives & Quantity</FormLabel>
              <div className="flex flex-col gap-3 mt-2 border p-4 rounded-md bg-muted/30">
                {drives?.length ? drives.map((drive) => {
                  // Ép kiểu cho field.value
                  const currentDrives = (field.value as DriveDetail[] | undefined) || [];
                  const activeDrive = currentDrives.find((d) => d.driveId === drive.id);
                  const isChecked = !!activeDrive;

                  return (
                    <div key={drive.id} className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm w-1/3">
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          className="hidden" 
                          onChange={(e) => {
                            let updated: DriveDetail[] = [...currentDrives];
                            if (e.target.checked) {
                              updated.push({ driveId: drive.id, quantity: 1 });
                            } else {
                              updated = updated.filter((d) => d.driveId !== drive.id);
                            }
                            field.onChange(updated);
                          }} 
                        />
                        <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-transparent'}`}>
                          {isChecked && <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78748L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>}
                        </div>
                        {drive.name}
                      </label>
                      {isChecked && (
                        <Input 
                          type="number" 
                          min={1} 
                          placeholder="Quantity" 
                          className="w-24 h-8 text-sm"
                          value={activeDrive?.quantity || 1}
                          onChange={(e) => {
                            const newQty = parseInt(e.target.value) || 1;
                            const updated: DriveDetail[] = currentDrives.map((d) => 
                              d.driveId === drive.id ? { ...d, quantity: newQty } : d
                            );
                            field.onChange(updated);
                          }}
                        />
                      )}
                    </div>
                  );
                }) : <span className="text-sm text-muted-foreground italic">Select Capabilities to load valid drives...</span>}
              </div>
            </FormItem>
          )}
        />

        {/* Bước 4: Chọn Assembly Methods (Dựa trên Caps + Material, có thể chọn nhiều) */}
        <FormField
          control={form.control}
          name="assemblyMethodIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>5. Assembly Methods</FormLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {assemblyMethods?.length ? assemblyMethods.map((method) => {
                  const checked = field.value?.includes(method.id);
                  return (
                    <label key={method.id} className={`flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${checked ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
                      <input 
                        type="checkbox" 
                        checked={checked} 
                        className="hidden" 
                        onChange={(e) => {
                          const updated = e.target.checked 
                            ? [...(field.value || []), method.id] 
                            : field.value?.filter((id: string) => id !== method.id);
                          field.onChange(updated);
                        }} 
                      />
                      <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${checked ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-transparent'}`}>
                        {checked && <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78748L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>}
                      </div>
                      {method.name}
                    </label>
                  );
                }) : <span className="text-sm text-muted-foreground italic">Select Capabilities and Material to load assembly methods...</span>}
              </div>
            </FormItem>
          )}
        />

        {/* Bước 5: Nhập Piece Count (> 4) & Auto tính Toán */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <FormField
            control={form.control}
            name="totalPieceCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>6. Total Piece Count</FormLabel>
                <FormControl>
                  <Input type="number" min={5} placeholder="Must be > 4" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="difficultLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Difficulty Level {isCalculating && <Loader2 className="h-3 w-3 animate-spin" />}
                </FormLabel>
                <FormControl>
                  <Input {...field} readOnly className="bg-muted pointer-events-none" />
                </FormControl>
                <p className="text-[10px] text-muted-foreground">Auto-calculated</p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimatedBuildTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Build Time (min) {isCalculating && <Loader2 className="h-3 w-3 animate-spin" />}
                </FormLabel>
                <FormControl>
                  <Input type="number" {...field} readOnly className="bg-muted pointer-events-none" />
                </FormControl>
                <p className="text-[10px] text-muted-foreground">Auto-calculated</p>
              </FormItem>
            )}
          />
        </div>

      </CardContent>
    </Card>
  );
}