'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import slugify from 'slugify';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2, ArrowRight } from 'lucide-react';

import type { DifficultLevel, DriveDetailDto } from '@/types/types';

// SỬ DỤNG FILE QUERIES MỚI
import {
  useAllTopics,
  useCatalogList,
  useFilteredCapabilities,
  useActiveDrivesByCapabilities,
  useFilteredAssemblyMethods,
} from '@/hooks/useCatalogQueries';
// IMPORT THÊM TYPE TỪ CATALOG API
import type { MaterialItem } from '@/services/catalogApi';
import { useCalculateFormula } from '@/hooks/useFormulaQueries';

import { productFormSchema, type ProductFormValues } from '@/pages/manager/product-editor/schema';
import { BasicInfoCard } from './BasicInfoCard';
import { RichTextEditor } from './BasicInfoCard';
import { ImagesCard } from './ImagesCard';
import { SpecificationsCard } from './SpecificationsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

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
  // 1. Data tĩnh (Luôn load) - SỬ DỤNG HOOK MỚI
  const { data: topicsData, isLoading: isTopicsLoading } = useAllTopics(true);
  const topics = topicsData?.items || [];

  // Dùng useCatalogList cho material (Giả sử lấy 100 item không phân trang)
  const { data: materialsData, isLoading: isMaterialsLoading } = useCatalogList('materials', 1, 100, '', true);

  // Trích xuất mảng dữ liệu và định nghĩa kiểu rõ ràng là MaterialItem[]
  const materials = (Array.isArray(materialsData) ? materialsData : materialsData?.items || []) as MaterialItem[];

  const defaultValues: ProductFormValues = {
    slug: initialData?.slug || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    difficultLevel: (initialData?.difficultLevel as DifficultLevel) || 'Basic',
    estimatedBuildTime: initialData?.estimatedBuildTime || 0,
    totalPieceCount: initialData?.totalPieceCount || 0,
    thumbnailUrl: initialData?.thumbnailUrl || '',
    topicId: initialData?.topicId || '',
    materialId: initialData?.materialId || '',
    capabilityIds: initialData?.capabilityIds || [],
    driveDetails: initialData?.driveDetails || [],
    assemblyMethodIds: initialData?.assemblyMethodIds || [],
    previewAsset: initialData?.previewAsset || {},
    isActive: initialData?.isActive ?? true,
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as unknown as Resolver<ProductFormValues>,
    values: defaultValues,
    mode: 'onTouched',
  });

  // Quan sát các giá trị form để trigger API tuần tự
  const watchTopicId = form.watch('topicId');
  const watchMaterialId = form.watch('materialId');
  const watchCapabilityIds = form.watch('capabilityIds') || [];
  const watchAssemblyMethodIds = form.watch('assemblyMethodIds') || [];
  const watchPieceCount = form.watch('totalPieceCount');

  // 2. Load Capabilities (dựa trên topic & material)
  const { data: rawCapabilities } = useFilteredCapabilities(
    watchTopicId || '',
    watchMaterialId || ''
  );

  // 3. Load Drives (dựa trên capabilities, có lọc trùng và bóc vỏ JSON)
  const { data: rawDrives } = useActiveDrivesByCapabilities(watchCapabilityIds);

  const drives = useMemo(() => {
    if (!rawDrives || !Array.isArray(rawDrives)) return [];

    const uniqueMap = new Map();
    rawDrives.forEach((item: any) => {
      // Tự động bóc vỏ nếu API bọc object bên trong thuộc tính .drive
      const drive = item.drive || item;
      if (drive && drive.id) {
        uniqueMap.set(drive.id, drive);
      }
    });

    return Array.from(uniqueMap.values());
  }, [rawDrives]);

  // 4. Load Assembly Methods (dựa trên capabilities + material, 1 API call duy nhất)
  const { data: assemblyMethods = [], isLoading: isAssemblyMethodsLoading } = useFilteredAssemblyMethods(
    watchCapabilityIds,
    watchMaterialId || ''
  );


  // 5. Tự động tính Difficulty và Build Time
  const calculateMutation = useCalculateFormula();
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const runCalculation = async () => {
      // Đảm bảo đã điền/chọn đủ cả 5 trường mới gọi API
      if (
        watchPieceCount > 4 &&
        watchTopicId &&
        watchMaterialId &&
        watchCapabilityIds.length > 0 &&
        watchAssemblyMethodIds.length > 0
      ) {
        setIsCalculating(true);

        // Truyền full 5 trường, topicId và materialId là string
        const payload = {
          topicId: watchTopicId,
          materialId: watchMaterialId,
          capabilityIds: watchCapabilityIds,
          assemblyMethodIds: watchAssemblyMethodIds,
          pieceCount: Number(watchPieceCount)
        };

        try {
          // Gọi song song 2 API tính toán
          const [diffRes, timeRes] = await Promise.all([
            calculateMutation.mutateAsync({ formulaCode: 'DIFFICULTY_CALCULATION', payload }),
            calculateMutation.mutateAsync({ formulaCode: 'BUILD_TIME_CALCULATION', payload })
          ]);

          // 1. Difficulty thì lấy chữ (validationOutput)
          form.setValue('difficultLevel', diffRes.validationOutput as DifficultLevel);

          // 2. Build Time thì LUÔN LUÔN lấy số (rawValue)
          form.setValue('estimatedBuildTime', timeRes.rawValue);

        } catch (error) {
          console.error("Calculate error:", error);
        } finally {
          setIsCalculating(false);
        }
      }
    };

    // Debounce 500ms để tránh call API liên tục khi gõ pieceCount
    const timeoutId = setTimeout(runCalculation, 500);
    return () => clearTimeout(timeoutId);

    // Đưa capabilityIds và assemblyMethodIds trở lại dependency array
  }, [
    watchPieceCount,
    watchTopicId,
    watchMaterialId,
    JSON.stringify(watchCapabilityIds),
    JSON.stringify(watchAssemblyMethodIds)
  ]);

  // --- Logic Hình ảnh ---
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(initialFiles?.thumbnail || null);
  const [thumbnailLocalPreview, setThumbnailLocalPreview] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [previewFiles, setPreviewFiles] = useState<File[]>(initialFiles?.previews || []);
  const [previewLocalPreviews, setPreviewLocalPreviews] = useState<string[]>([]);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (thumbnailFile) setThumbnailLocalPreview(URL.createObjectURL(thumbnailFile));
    if (previewFiles.length > 0) setPreviewLocalPreviews(previewFiles.map(f => URL.createObjectURL(f)));
    return () => {
      if (thumbnailLocalPreview) URL.revokeObjectURL(thumbnailLocalPreview);
      previewLocalPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

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

    setPreviewFiles((prev) => [...prev, ...files]);
    setPreviewLocalPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
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

  const isMasterDataLoading = isTopicsLoading || isMaterialsLoading;

  if (isMasterDataLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const existingPreviewAsset = form.watch('previewAsset') as Record<string, string> | undefined;
  const existingPreviews = Object.entries(existingPreviewAsset || {}).filter(
    ([, v]) => typeof v === 'string' && (v.startsWith('http') || v.includes('/'))
  );
  const totalPreviewCount = existingPreviews.length + previewFiles.length;
  const displayThumbnail = thumbnailLocalPreview || form.watch('thumbnailUrl') || null;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          <BasicInfoCard form={form} isCreateMode={isCreateMode} />

          <SpecificationsCard
            form={form}
            topics={topics}
            materials={materials}
            capabilities={rawCapabilities}
            drives={drives}
            assemblyMethods={assemblyMethods}
            isCalculating={isCalculating || isAssemblyMethodsLoading}
          />

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
            handlePreviewFilesChange={handlePreviewFilesChange}
            handleRemoveExistingPreview={handleRemoveExistingPreview}
            handleRemoveNewPreview={handleRemoveNewPreview}
          />

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Description</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

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