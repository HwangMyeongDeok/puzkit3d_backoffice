import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Package, AlertCircle } from 'lucide-react';
import type { InstockProductDto } from '@/types/types';
import { ProductInfoTab } from './ProductInfoTab';
import { ProductVariantsTab } from './ProductVariantsTab';

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
  // Variants tab is disabled until product is saved (has an ID)
  const canEditVariants = !isCreateMode && productId;
  const [activeTab, setActiveTab] = useState<'info' | 'variants'>('info');

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'info' | 'variants')}>
      <TabsList className="grid w-full grid-cols-2 lg:w-auto">
        <TabsTrigger value="info" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">General Info</span>
        </TabsTrigger>
        <TabsTrigger
          value="variants"
          disabled={!canEditVariants}
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
      </TabsList>

      {/* Product Info Tab */}
      <TabsContent value="info" className="mt-6">
        <ProductInfoTab
          isCreateMode={isCreateMode}
          productId={productId}
          product={product}
          onProductSaved={(id: string) => {
            onProductSaved?.(id);
            // Auto-switch to variants tab after creating product
            if (isCreateMode) {
              setActiveTab('variants');
            }
          }}
        />
      </TabsContent>

      {/* Variants Tab */}
      <TabsContent value="variants" className="mt-6">
        {canEditVariants && productId ? (
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
    </Tabs>
  );
}
