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
  const [activeTab, setActiveTab] = useState<'info' | 'variants'>('info');

  const [productDraftData, setProductDraftData] = useState<Partial<ProductFormValues>>(() => {
    if (!isCreateMode && product) {
      return {
        slug: product.slug,
        name: product.name,
        description: product.description ?? undefined, 
        difficultLevel: product.difficultLevel as ProductFormValues['difficultLevel'],
        estimatedBuildTime: product.estimatedBuildTime,
        totalPieceCount: product.totalPieceCount,
        thumbnailUrl: product.thumbnailUrl ?? undefined,
        topicId: product.topicId ?? undefined,
        materialId: product.materialId ?? undefined,
        // Cập nhật mảng thay vì string số ít
        capabilityIds: product.capabilityIds || [],
        assemblyMethodIds: product.assemblyMethodIds || [],
        driveDetails: product.driveDetails || [],
        previewAsset: typeof product.previewAsset === 'object' && !Array.isArray(product.previewAsset) ? product.previewAsset : {},
        isActive: product.isActive,
      };
    }
    return {};
  });

  const [productDraftFiles, setProductDraftFiles] = useState<ProductFiles>({ thumbnail: null, previews: [] });

  const [wizardVariantsList, setWizardVariantsList] = useState<VariantDraft[]>([]);

  const isInfoCompleted = Object.keys(productDraftData).length > 0 || !isCreateMode;

  const handleInfoNext = (data: ProductFormValues, files: ProductFiles) => {
    setProductDraftData(data);
    setProductDraftFiles(files);
    setActiveTab('variants');
  };

  const handleVariantsBack = () => {
    setActiveTab('info');
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'info' | 'variants')}>
      {/* ... Phần render TabsList giữ nguyên ... */}
      <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
        <TabsTrigger value="info" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">General Info</span>
        </TabsTrigger>
        <TabsTrigger value="variants" disabled={isCreateMode && !isInfoCompleted} className="gap-2">
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