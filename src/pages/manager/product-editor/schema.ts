import { z } from 'zod';

export const productFormSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().min(0),
  difficultLevel: z.enum(['Basic', 'Intermediate', 'Advanced', 'Expert'], { message: 'Difficult level is required' }),
  estimatedBuildTime: z.coerce.number().min(1, { message: 'Estimated build time must be a positive number' }),
  totalPieceCount: z.coerce.number().min(1, { message: 'Total piece count must be a positive number' }),
  thumbnailUrl: z.string().url({ message: 'Must be a valid URL' }).or(z.literal('')),
  topicId: z.string().min(1, { message: 'Topic is required' }),
  assemblyMethodIds: z.array(z.string()).min(1, { message: 'At least one assembly method is required' }),
  capabilityIds: z.array(z.string()).min(1, { message: 'At least one capability is required' }),
  driveDetails: z.array(z.object({
    driveId: z.string().min(1, 'Drive is required'),
    quantity: z.coerce.number().min(1, 'Quantity must be a positive number'),
  })).min(1, 'At least one drive detail is required'),
  materialId: z.string().min(1, 'Material is required'),
  previewAsset: z.record(z.string(), z.string().or(z.number()).or(z.boolean())).optional(),
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const variantFormSchema = z.object({
  color: z.string().min(1, 'Color is required'),
  assembledLengthMm: z.coerce.number().min(0, 'Length must be positive'),
  assembledWidthMm: z.coerce.number().min(0, 'Width must be positive'),
  assembledHeightMm: z.coerce.number().min(0, 'Height must be positive'),
  isActive: z.boolean(),
  initialStock: z.coerce.number().min(0, 'Stock cannot be negative').default(0),
});

export type VariantFormValues = z.infer<typeof variantFormSchema>;

export const priceDetailFormSchema = z.object({
  minQuantity: z.coerce.number().min(1),
  maxQuantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
  currency: z.enum(['USD', 'VND', 'EUR']),
  isActive: z.boolean(),
});
export const masterProductSchema = productFormSchema.extend({
  variants: z.array(variantFormSchema).default([]), 
});

export type PriceDetailFormValues = z.infer<typeof priceDetailFormSchema>;
export type MasterProductFormValues = z.infer<typeof masterProductSchema>;