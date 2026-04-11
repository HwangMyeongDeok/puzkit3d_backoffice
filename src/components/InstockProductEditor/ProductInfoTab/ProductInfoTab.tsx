'use client';

import { useRef, useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import slugify from 'slugify';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2, ArrowRight } from 'lucide-react';

import type { DifficultLevel } from '@/types/types';
import {
  useTopics,
  useMaterials,
  useCapabilities,
  useAssemblyMethods,
} from '@/hooks/useMasterDataQueries';
import { productFormSchema, type ProductFormValues } from '@/pages/manager/product-editor/schema';

import { BasicInfoCard } from './BasicInfoCard';
import { ImagesCard } from './ImagesCard';
import { SpecificationsCard } from './SpecificationsCard';


export interface ProductFiles {
  thumbnail: File | null;
  previews: File[];
}

export interface ProductInfoTabProps {
  isCreateMode: boolean;
  initialData?: Partial<ProductFormValues>; 
  initialFiles?: ProductFiles;
  onNextStep: (data: ProductFormValues, files: ProductFiles) => void;
}

export function ProductInfoTab({
  isCreateMode,
  initialData,
  initialFiles,
  onNextStep,
}: ProductInfoTabProps) {
  const { data: topics, isLoading: isTopicsLoading } = useTopics();
  const { data: materials, isLoading: isMaterialsLoading } = useMaterials();
  const { data: capabilities, isLoading: isCapabilitiesLoading } = useCapabilities();
  const { data: assemblyMethods, isLoading: isAssemblyMethodsLoading } = useAssemblyMethods();

  const isMasterDataLoading =
  isTopicsLoading || isMaterialsLoading || isCapabilitiesLoading || isAssemblyMethodsLoading;

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(initialFiles?.thumbnail || null);
  const [thumbnailLocalPreview, setThumbnailLocalPreview] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  
  const [previewFiles, setPreviewFiles] = useState<File[]>(initialFiles?.previews || []);
  const [previewLocalPreviews, setPreviewLocalPreviews] = useState<string[]>([]);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (thumbnailFile) setThumbnailLocalPreview(URL.createObjectURL(thumbnailFile));
    if (previewFiles.length > 0) {
      setPreviewLocalPreviews(previewFiles.map(f => URL.createObjectURL(f)));
    }
    return () => {
      if (thumbnailLocalPreview) URL.revokeObjectURL(thumbnailLocalPreview);
      previewLocalPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const defaultValues: ProductFormValues = {
    slug: initialData?.slug || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    difficultLevel: (initialData?.difficultLevel as DifficultLevel) || 'Basic',
    estimatedBuildTime: initialData?.estimatedBuildTime || 1,
    totalPieceCount: initialData?.totalPieceCount || 1,
    thumbnailUrl: initialData?.thumbnailUrl || '',
    topicId: initialData?.topicId || '',
    materialId: initialData?.materialId || '',
    assemblyMethodId: initialData?.assemblyMethodId || '',
    capabilityIds: initialData?.capabilityIds || [],
    previewAsset: initialData?.previewAsset || {},
    isActive: initialData?.isActive ?? true,
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as unknown as Resolver<ProductFormValues>,
    values: defaultValues,
    mode: 'onTouched',
  });

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
    form.setValue('thumbnailUrl', '');
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

  const onSubmit = (values: ProductFormValues) => {
    if (isCreateMode && !thumbnailFile && !values.thumbnailUrl) {
      setThumbnailError('Thumbnail image is required');
      return;
    }
    setThumbnailError(null);

    const finalSlug = values.slug || slugify(values.name, { lower: true, strict: true, locale: 'vi', trim: true });
    
    const finalData = { ...values, slug: finalSlug };
    const filesToPass = { thumbnail: thumbnailFile, previews: previewFiles };

    onNextStep(finalData, filesToPass);
  };

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
          
          <BasicInfoCard form={form} isCreateMode={isCreateMode} />

          <ImagesCard 
            isCreateMode={isCreateMode}
            thumbnailError={thumbnailError}
            displayThumbnail={displayThumbnail}
            thumbnailInputRef={thumbnailInputRef}
            handleThumbnailChange={handleThumbnailChange}
            handleRemoveThumbnail={handleRemoveThumbnail}
            previewInputRef={previewInputRef}
            existingPreviews={existingPreviews}
            previewLocalPreviews={previewLocalPreviews}
            totalPreviewCount={totalPreviewCount}
            canAddMorePreviews={canAddMorePreviews}
            handlePreviewFilesChange={handlePreviewFilesChange}
            handleRemoveExistingPreview={handleRemoveExistingPreview}
            handleRemoveNewPreview={handleRemoveNewPreview}
          />

          <SpecificationsCard 
            form={form}
            topics={topics}
            materials={materials}
            assemblyMethods={assemblyMethods}
            capabilities={capabilities}
          />

          <div className="flex gap-3 justify-end">
            <Button type="submit" size="lg" className="gap-2 min-w-[180px]">
              <ArrowRight className="h-4 w-4" /> Next to Variants
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}