import { z } from 'zod';

export const productFormSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().min(0),
  difficultLevel: z.enum(['Basic', 'Intermediate', 'Advanced']),
  estimatedBuildTime: z.coerce.number().min(1),
  totalPieceCount: z.coerce.number().min(1),
  thumbnailUrl: z.string().url('Must be a valid URL').or(z.literal('')),
  topicId: z.string().min(1, 'Topic is required'),
  assemblyMethodId: z.string().min(1, 'Assembly method is required'),
  capabilityIds: z.array(z.string()).min(1, 'At least one capability is required'),
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
});

export type VariantFormValues = z.infer<typeof variantFormSchema>;

export const priceDetailFormSchema = z.object({
  minQuantity: z.coerce.number().min(1),
  maxQuantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
  currency: z.enum(['USD', 'VND', 'EUR']),
  isActive: z.boolean(),
});

export type PriceDetailFormValues = z.infer<typeof priceDetailFormSchema>;
