'use client';

import { useRef, useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import slugify from 'slugify';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2, ArrowRight } from 'lucide-react';

import type { DifficultLevel } from '@/types/types';

// SỬ DỤNG FILE QUERIES MỚI
import {
  useAllTopics,
  useCatalogList,
  useFilteredCapabilities,
  useActiveDrivesByCapabilities,
} from '@/hooks/useCatalogQueries'; 
import * as catalogApi from '@/services/catalogApi'; 
// IMPORT THÊM TYPE TỪ CATALOG API
import type { 
  MaterialItem, 
  FilterBriefItem, 
  CapabilityDriveBriefItem 
} from '@/services/catalogApi';
import { useCalculateFormula } from '@/hooks/useFormulaQueries';

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

  // 3. Load Drives (dựa trên capabilities, có lọc trùng)
  const { data: rawDrives } = useActiveDrivesByCapabilities(watchCapabilityIds);
  // Lọc trùng ID và định nghĩa kiểu rõ ràng
  const drives = Array.from(
    new Map((rawDrives || []).map((d: CapabilityDriveBriefItem) => [d.id, d])).values()
  );

  // 4. Load Assembly Methods (gọi API cho mỗi capability + material, có lọc trùng)
  const [assemblyMethods, setAssemblyMethods] = useState<FilterBriefItem[]>([]);
  const [isAssemblyMethodsLoading, setIsAssemblyMethodsLoading] = useState(false);

  useEffect(() => {
    if (!watchMaterialId || watchCapabilityIds.length === 0) {
      setAssemblyMethods([]);
      return;
    }
    const fetchAssemblyMethods = async () => {
      setIsAssemblyMethodsLoading(true);
      try {
        const promises = watchCapabilityIds.map(capId => 
          catalogApi.getActiveAssemblyMethodsForCapabilityAndMaterial(capId, watchMaterialId)
        );
        const results = await Promise.all(promises);
        
        // Vì API trả về mảng FilterBriefItem[], ta chỉ cần flatMap gộp lại
        const combined = results.flatMap((res) => res);
        
        // Lọc trùng lặp id
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        setAssemblyMethods(unique);
      } catch (error) {
        console.error("Error fetching assembly methods", error);
      } finally {
        setIsAssemblyMethodsLoading(false);
      }
    };
    fetchAssemblyMethods();
  }, [watchMaterialId, JSON.stringify(watchCapabilityIds)]);


  // 5. Tự động tính Difficulty và Build Time
  const calculateMutation = useCalculateFormula();
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const runCalculation = async () => {
      if (watchPieceCount > 4 && watchTopicId && watchMaterialId && watchCapabilityIds.length > 0 && watchAssemblyMethodIds.length > 0) {
        setIsCalculating(true);
        const payload = {
          topicIds: [watchTopicId],
          materialIds: [watchMaterialId],
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
  }, [watchPieceCount, watchTopicId, watchMaterialId, JSON.stringify(watchCapabilityIds), JSON.stringify(watchAssemblyMethodIds)]);


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
  const canAddMorePreviews = totalPreviewCount < 3;
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
            canAddMorePreviews={canAddMorePreviews}
            handlePreviewFilesChange={handlePreviewFilesChange}
            handleRemoveExistingPreview={handleRemoveExistingPreview}
            handleRemoveNewPreview={handleRemoveNewPreview}
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