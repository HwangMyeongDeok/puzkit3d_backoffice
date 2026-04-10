import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Package } from 'lucide-react';
import type { InstockProductDto } from '@/types/types';

import { ProductInfoTab, type ProductFiles } from './ProductInfoTab/ProductInfoTab';
import { ProductVariantsTab } from './ProductVariantTab/ProductVariantsTab';
import type { ProductFormValues } from '@/pages/manager/product-editor/schema';
import type { VariantDraft } from './ProductVariantTab/PreviewSummary';

interface ProductEditorTabsProps {
  isCreateMode: boolean;
  productId: string | null;
  product?: InstockProductDto;
}

export function ProductEditorTabs({
  isCreateMode,
  productId,
  product,
}: ProductEditorTabsProps) {
  // ── State quản lý Tab ──
  const [activeTab, setActiveTab] = useState<'info' | 'variants'>('info');

  // ── State lưu trữ nháp (Draft) cho toàn bộ form BƯỚC 1 ──
  const [productDraftData, setProductDraftData] = useState<Partial<ProductFormValues>>(() => {
    if (!isCreateMode && product) {
      return {
        slug: product.slug,
        name: product.name,
        // FIX LỖI TYPE Ở ĐÂY: Ép null về undefined hoặc chuỗi rỗng
        description: product.description ?? undefined, 
        difficultLevel: product.difficultLevel as ProductFormValues['difficultLevel'],
        estimatedBuildTime: product.estimatedBuildTime,
        totalPieceCount: product.totalPieceCount,
        thumbnailUrl: product.thumbnailUrl ?? undefined,
        topicId: product.topicId ?? undefined,
        materialId: product.materialId ?? undefined,
        assemblyMethodId: product.assemblyMethodId ?? undefined,
        capabilityIds: product.capabilityIds || [],
        previewAsset: typeof product.previewAsset === 'object' && !Array.isArray(product.previewAsset) ? product.previewAsset : {},
        isActive: product.isActive,
      };
    }
    return {};
  });

  const [productDraftFiles, setProductDraftFiles] = useState<ProductFiles>({ thumbnail: null, previews: [] });

  // ── State lưu trữ danh sách biến thể (Variant List) BƯỚC 2 ──
  const [wizardVariantsList, setWizardVariantsList] = useState<VariantDraft[]>([]);

  // Điều kiện để cho phép click sang tab variants
  const isInfoCompleted = Object.keys(productDraftData).length > 0 || !isCreateMode;

  // --- CÁC HÀM XỬ LÝ CHUYỂN BƯỚC ---
  const handleInfoNext = (data: ProductFormValues, files: ProductFiles) => {
    setProductDraftData(data);
    setProductDraftFiles(files);
    
    // Nếu là Edit Mode, bạn có thể cân nhắc gọi API Update Product ở ngay đây thay vì chỉ chuyển tab
    // ... logic mutate update product ...

    setActiveTab('variants');
  };

  const handleVariantsBack = () => {
    setActiveTab('info');
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as 'info' | 'variants')}
    >
      <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
        <TabsTrigger value="info" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">General Info</span>
        </TabsTrigger>

        <TabsTrigger
          value="variants"
          disabled={isCreateMode && !isInfoCompleted}
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Variants</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-6">
        <ProductInfoTab
          isCreateMode={isCreateMode}
          initialData={productDraftData}
          initialFiles={productDraftFiles}
          onNextStep={handleInfoNext}
        />
      </TabsContent>

      <TabsContent value="variants" className="mt-6">
        <ProductVariantsTab
          isCreateMode={isCreateMode}
          productId={productId}
          productDraftData={productDraftData}
          productDraftFiles={productDraftFiles}
          onBack={handleVariantsBack}
          wizardVariantsList={wizardVariantsList}
          setWizardVariantsList={setWizardVariantsList}
        />
      </TabsContent>
    </Tabs>
  );
}