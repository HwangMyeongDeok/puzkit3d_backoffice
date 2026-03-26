import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Package, AlertCircle, Puzzle } from 'lucide-react'; // Thêm icon Puzzle
import type { InstockProductDto } from '@/types/types';
import { ProductInfoTab } from './ProductInfoTab';
import { ProductVariantsTab } from './ProductVariantsTab';
import { ProductPartsTab } from './ProductPartsTab'; // Import thêm Tab Parts sắp tạo

interface ProductEditorTabsProps {
  isCreateMode: boolean;
  productId: string | null;
  product?: InstockProductDto;
  onProductSaved?: (id: string) => void;
}

export function ProductEditorTabs({
  isCreateMode,
  productId,
  product,
  onProductSaved,
}: ProductEditorTabsProps) {
  // Variants và Parts tab sẽ bị khóa cho đến khi product được lưu (có ID)
  const isProductSaved = !isCreateMode && productId;
  const [activeTab, setActiveTab] = useState<'info' | 'variants' | 'parts'>('info');

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'info' | 'variants' | 'parts')}>
      {/* Đổi grid-cols-2 thành grid-cols-3 để chứa thêm Tab mới */}
      <TabsList className="grid w-full grid-cols-3 lg:w-auto">
        <TabsTrigger value="info" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">General Info</span>
        </TabsTrigger>

        <TabsTrigger
          value="variants"
          disabled={!isProductSaved}
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Variants</span>
          {isCreateMode && (
            <div className="flex items-center gap-1 ml-2 text-xs text-yellow-600 dark:text-yellow-500">
              <AlertCircle className="h-3 w-3" />
              <span className="hidden sm:inline">Save first</span>
            </div>
          )}
        </TabsTrigger>

        {/* --- TAB PARTS MỚI THÊM --- */}
        <TabsTrigger
          value="parts"
          disabled={!isProductSaved}
          className="gap-2"
        >
          <Puzzle className="h-4 w-4" />
          <span className="hidden sm:inline">Parts</span>
          {isCreateMode && (
            <div className="flex items-center gap-1 ml-2 text-xs text-yellow-600 dark:text-yellow-500">
              <AlertCircle className="h-3 w-3" />
              <span className="hidden sm:inline">Save first</span>
            </div>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Product Info Tab */}
      <TabsContent value="info" className="mt-6">
        <ProductInfoTab
          isCreateMode={isCreateMode}
          productId={productId}
          product={product}
          onProductSaved={(id: string) => {
            onProductSaved?.(id);
            // Sau khi tạo xong, mình có thể cho nó tự nhảy sang tab Parts hoặc Variants tùy ý
            // Ở đây giữ nguyên luồng cũ của ông là nhảy sang Variants
            if (isCreateMode) {
              setActiveTab('variants');
            }
          }}
        />
      </TabsContent>

      {/* Variants Tab */}
      <TabsContent value="variants" className="mt-6">
        {isProductSaved && productId ? (
          <ProductVariantsTab productId={productId} />
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Save the product first to manage variants.
            </p>
          </div>
        )}
      </TabsContent>

      {/* Parts Tab Content MỚI THÊM */}
      <TabsContent value="parts" className="mt-6">
        {isProductSaved && productId ? (
          <ProductPartsTab productId={productId} />
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Save the product first to manage parts.
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}