import * as z from 'zod';

const dateField = z.union([z.string(), z.date()]).nullable().transform((v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
});

export const priceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  effectiveFrom: dateField,
  effectiveTo: dateField,
  priority: z.number().int().min(0, 'Priority must be 0 or greater'),
  isActive: z.boolean(),
}).refine(
  (data) => {
    // Skip validation if either date is empty
    if (!data.effectiveFrom || !data.effectiveTo) return true;
    // Validate that effectiveTo is strictly after effectiveFrom
    return data.effectiveFrom < data.effectiveTo;
  },
  {
    message: 'Effective To must be after Effective From',
    path: ['effectiveTo'],
  }
);

export type PriceFormValues = z.infer<typeof priceSchema>;
export type PriceFormInput = z.input<typeof priceSchema>;

export const updatePriceSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  effectiveFrom: dateField.optional(),
  effectiveTo: dateField.optional(),
  priority: z.number().int().min(0, 'Priority must be 0 or greater').optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePriceFormValues = z.infer<typeof updatePriceSchema>;

export const priceDetailSchema = z.object({
  priceId: z.string().uuid('Please select a price'),
  variantId: z.string().uuid('Please select a variant'),
  unitPrice: z.number().min(10000, 'Unit price must be at least 10,000'),
  isActive: z.boolean(),
});

export type PriceDetailFormValues = z.infer<typeof priceDetailSchema>;

export const updatePriceDetailSchema = z.object({
  unitPrice: z.number().min(10000, 'Unit price must be at least 10,000'),
  isActive: z.boolean(),
});

export type UpdatePriceDetailFormValues = z.infer<typeof updatePriceDetailSchema>;
