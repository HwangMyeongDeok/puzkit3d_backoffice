import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Upload, X, ImagePlus } from 'lucide-react';

import type { InstockProductDto } from '@/types/types';
import {
  useCreateInstockProduct,
  useUpdateInstockProduct,
} from '@/hooks/useInstockProductQueries';
import {
  useTopics,
  useMaterials,
  useCapabilities,
  useAssemblyMethods,
} from '@/hooks/useMasterDataQueries';

// Import external Schema and Upload API
import { productFormSchema, type ProductFormValues } from '@/pages/manager/product-editor/schema';
import { uploadApi } from '@/services/uploadApi';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function generateSlug(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────
interface ProductInfoTabProps {
  isCreateMode: boolean;
  productId: string | null;
  product?: InstockProductDto;
  onProductSaved: (id: string) => void;
}

type SubmitStep = 'idle' | 'uploading' | 'saving';

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export function ProductInfoTab({
  isCreateMode,
  productId,
  product,
  onProductSaved,
}: ProductInfoTabProps) {
  const navigate = useNavigate();

  // ── Master data ──
  const { data: topics, isLoading: isTopicsLoading } = useTopics();
  const { data: materials, isLoading: isMaterialsLoading } = useMaterials();
  const { data: capabilities, isLoading: isCapabilitiesLoading } = useCapabilities();
  const { data: assemblyMethods, isLoading: isAssemblyMethodsLoading } = useAssemblyMethods();

  // ── Mutations ──
  const createMutation = useCreateInstockProduct();
  const updateMutation = useUpdateInstockProduct();

  const isMasterDataLoading =
    isTopicsLoading || isMaterialsLoading || isCapabilitiesLoading || isAssemblyMethodsLoading;

  // ── File state (outside RHF) ──
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailLocalPreview, setThumbnailLocalPreview] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [previewLocalPreviews, setPreviewLocalPreviews] = useState<string[]>([]);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  // ── Submit step ──
  const [submitStep, setSubmitStep] = useState<SubmitStep>('idle');

  // ── Form Setup ──
  const defaultValues: ProductFormValues = isCreateMode
    ? {
        slug: '',
        name: '',
        description: '',
        difficultLevel: 'Basic',
        estimatedBuildTime: 1,
        totalPieceCount: 1,
        thumbnailUrl: '',
        topicId: '',
        assemblyMethodId: '',
        capabilityIds: [],
        materialId: '',
        previewAsset: {}, // Default empty object
        isActive: true,
      }
    : {
        slug: product?.slug ?? '',
        name: product?.name || '',
        description: product?.description || '',
        difficultLevel: product?.difficultLevel || 'Basic',
        estimatedBuildTime: product?.estimatedBuildTime || 1,
        totalPieceCount: product?.totalPieceCount || 1,
        thumbnailUrl: product?.thumbnailUrl || '',
        topicId: product?.topicId || '',
        materialId: product?.materialId || '',
        assemblyMethodId: product?.assemblyMethodId || '',
        capabilityIds: product?.capabilityIds || [],
        // Safe parsing to ensure it's an object
        previewAsset: Array.isArray(product?.previewAsset)
          ? product.previewAsset.reduce((acc: Record<string, string>, url: string, idx: number) => {
              acc[`preview_${idx + 1}`] = url;
              return acc;
            }, {})
          : (typeof product?.previewAsset === 'object' && product?.previewAsset !== null
              ? product.previewAsset
              : {}),
              
        isActive: product?.isActive ?? true,
      };

  const form = useForm<ProductFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productFormSchema) as any,
    values: defaultValues,
    mode: 'onChange',
  });

  // ── File handlers ──
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailError(null);
    setThumbnailFile(file);
    setThumbnailLocalPreview(URL.createObjectURL(file));
    form.setValue('thumbnailUrl', '');
  };

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailLocalPreview(null);
    form.setValue('thumbnailUrl', product?.thumbnailUrl || '');
  };

  const handlePreviewFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const existingCount = Object.keys(form.getValues('previewAsset') || {}).length;
    const currentNewCount = previewFiles.length;
    const totalExisting = existingCount + currentNewCount;
    const remaining = Math.max(0, 3 - totalExisting);
    const toAdd = files.slice(0, remaining);

    setPreviewFiles((prev) => [...prev, ...toAdd]);
    setPreviewLocalPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const handleRemoveNewPreview = (index: number) => {
    setPreviewFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewLocalPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingPreview = (key: string) => {
    const current = { ...(form.getValues('previewAsset') || {}) } as Record<string, string>;
    delete current[key];
    form.setValue('previewAsset', current);
  };

  // ── Submit Logic ──
  const onSubmit = async (values: ProductFormValues) => {
    if (isCreateMode && !thumbnailFile) {
      setThumbnailError('Thumbnail image is required');
      return;
    }
    setThumbnailError(null);

    try {
      const slug = values.slug || generateSlug(values.name);
      let finalThumbnailUrl = values.thumbnailUrl;
      const finalPreviewAsset = { ...(values.previewAsset || {}) } as Record<string, string>;

      const hasNewUploads = thumbnailFile || previewFiles.length > 0;

      if (hasNewUploads) {
        setSubmitStep('uploading');

        const uploadTasks: Promise<string>[] = [];

        // Call S3 Upload API
        if (thumbnailFile) {
          uploadTasks.push(
            uploadApi.uploadFileToS3(thumbnailFile, 'instock-products', `${slug}/thumbnail_${Date.now()}`)
          );
        }
        previewFiles.forEach((file, i) => {
          const existingCount = Object.keys(finalPreviewAsset).length;
          uploadTasks.push(
            uploadApi.uploadFileToS3(file, 'instock-products', `${slug}/preview_${existingCount + i + 1}_${Date.now()}`)
          );
        });

        const uploadedPaths = await Promise.all(uploadTasks);
        let cursor = 0;

        if (thumbnailFile) {
          finalThumbnailUrl = uploadedPaths[cursor++];
        }
        previewFiles.forEach((_, i) => {
          const existingCount = Object.keys(finalPreviewAsset).length;
          finalPreviewAsset[`preview_${existingCount + i + 1}`] = uploadedPaths[cursor++];
        });
      }

      setSubmitStep('saving');
      const apiData = {
        ...values,
        slug,
        description: values.description || '',
        thumbnailUrl: finalThumbnailUrl,
        previewAsset: Object.values(finalPreviewAsset),
      };

      if (isCreateMode) {
        const result = await createMutation.mutateAsync(apiData);
        toast.success('Product created successfully!');
        onProductSaved(result);
        navigate(`/products/${result}/edit`);
      } else {
        await updateMutation.mutateAsync({ id: productId || '', data: apiData });
        toast.success('Product updated successfully!');
        onProductSaved(productId || '');

        // Reset local files after successful update
        setThumbnailFile(null);
        setThumbnailLocalPreview(null);
        setPreviewFiles([]);
        setPreviewLocalPreviews([]);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isCreateMode ? 'Failed to create product' : 'Failed to update product'
      );
    } finally {
      setSubmitStep('idle');
    }
  };

  const isSaving = submitStep !== 'idle';
  const submitLabel = {
    idle: isCreateMode ? 'Create Product' : 'Update Product',
    uploading: 'Uploading images...',
    saving: isCreateMode ? 'Creating...' : 'Updating...',
  }[submitStep];

  const existingPreviewAsset = form.watch('previewAsset') as Record<string, string> | undefined;
  const existingPreviews = Object.entries(existingPreviewAsset || {}).filter(
    ([, v]) => typeof v === 'string' && (v.startsWith('http') || v.includes('/'))
  );

  const totalPreviewCount = existingPreviews.length + previewFiles.length;
  const canAddMorePreviews = totalPreviewCount < 3;
  const displayThumbnail = thumbnailLocalPreview || form.watch('thumbnailUrl') || null;

  if (isMasterDataLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Basic Info ── */}
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
                            if (!form.getValues('slug')) {
                              form.setValue('slug', generateSlug(e.target.value));
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
                      <FormControl>
                        <Input placeholder="my-product" {...field} />
                      </FormControl>
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

          {/* ── Images ── */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Thumbnail */}
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Thumbnail {isCreateMode && <span className="text-destructive">*</span>}
                </p>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
                {displayThumbnail ? (
                  <div className="relative group w-40 h-40 rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={displayThumbnail}
                      alt="Thumbnail"
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => thumbnailInputRef.current?.click()}
                        className="bg-white/90 rounded-full p-1.5 text-foreground hover:bg-white transition-colors"
                        title="Replace"
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveThumbnail}
                        className="bg-white/90 rounded-full p-1.5 text-destructive hover:bg-white transition-colors"
                        title="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {thumbnailFile && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                        New
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className={`w-40 h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors
                      ${thumbnailError
                        ? 'border-destructive text-destructive'
                        : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                      }`}
                  >
                    <Upload className="h-6 w-6" />
                    <span className="text-xs font-medium">Upload thumbnail</span>
                  </button>
                )}
                {thumbnailError && (
                  <p className="text-[0.8rem] font-medium text-destructive">{thumbnailError}</p>
                )}
              </div>

              {/* Preview Images */}
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Preview Images
                  <span className="text-muted-foreground font-normal ml-1">
                    ({totalPreviewCount}/3)
                  </span>
                </p>
                <input
                  ref={previewInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePreviewFilesChange}
                />
                <div className="flex flex-wrap gap-3">
                  {/* Existing S3 previews (edit mode) */}
                  {existingPreviews.map(([key, url]) => (
                    <div key={key} className="relative group w-28 h-28 rounded-lg overflow-hidden border bg-muted">
                      <img src={url} alt={key} className="object-cover w-full h-full" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingPreview(key)}
                          className="bg-white/90 rounded-full p-1.5 text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded truncate max-w-[90%]">
                        {key}
                      </span>
                    </div>
                  ))}

                  {/* New local file previews */}
                  {previewLocalPreviews.map((src, i) => (
                    <div key={`new-${i}`} className="relative group w-28 h-28 rounded-lg overflow-hidden border bg-muted">
                      <img src={src} alt={`New preview ${i + 1}`} className="object-cover w-full h-full" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveNewPreview(i)}
                          className="bg-white/90 rounded-full p-1.5 text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded">
                        New
                      </span>
                    </div>
                  ))}

                  {/* Add more button */}
                  {canAddMorePreviews && (
                    <button
                      type="button"
                      onClick={() => previewInputRef.current?.click()}
                      className="w-28 h-28 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-xs font-medium">Add</span>
                    </button>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* ── Specifications ── */}
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
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
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
                      <FormControl>
                        <Input type="number" min={1} placeholder="30" {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input type="number" min={1} placeholder="100" {...field} />
                      </FormControl>
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
                      <Select value={field.value} onValueChange={field.onChange} disabled={isTopicsLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select topic" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {topics?.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
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
                      <Select value={field.value} onValueChange={field.onChange} disabled={isMaterialsLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {materials?.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
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
                      <Select value={field.value} onValueChange={field.onChange} disabled={isAssemblyMethodsLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assemblyMethods?.map((a) => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
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
                        const checked = field.value?.includes(cap.id) || false;
                        return (
                          <label
                            key={cap.id}
                            className={`flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors select-none
                              ${checked
                                ? 'border-primary bg-primary/5 text-primary font-medium'
                                : 'border-border hover:border-muted-foreground/50 text-muted-foreground'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...(field.value || []), cap.id]
                                  : field.value?.filter((id) => id !== cap.id) || [];
                                field.onChange(updated);
                              }}
                              className="hidden"
                            />
                            {cap.name}
                          </label>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── Actions ── */}
          <div className="flex gap-3 justify-end">
            <Button type="submit" disabled={isSaving} size="lg" className="gap-2 min-w-[160px]">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {submitLabel}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}