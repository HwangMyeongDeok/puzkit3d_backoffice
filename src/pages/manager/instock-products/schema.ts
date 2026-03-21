import * as z from 'zod';

export const productSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),

  difficultLevel: z.enum(['Basic', 'Intermediate', 'Advanced', 'Expert'] as const, {
    message: 'Please select a valid difficulty level',
  }),
  estimatedBuildTime: z.coerce
    .number()
    .int('Must be an integer')
    .min(1, 'Build time must be at least 1 min'),

  totalPieceCount: z.coerce
    .number()
    .int('Must be an integer')
    .min(1, 'Piece count must be at least 1'),

  thumbnailUrl: z.string().min(1, 'Thumbnail is required').optional(),

  topicId: z.string().uuid('Please select a topic'),
  assemblyMethodId: z.string().uuid('Please select an assembly method'),
  materialId: z.string().uuid('Please select a material'),
  capabilityIds: z.array(z.string().uuid()).min(1, 'Select at least one capability'),

  previewAsset: z.record(z.string(), z.string()).optional(),

  isActive: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;