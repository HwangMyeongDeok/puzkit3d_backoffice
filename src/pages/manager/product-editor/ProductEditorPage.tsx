import { useParams, useNavigate } from 'react-router-dom';
import { useInstockProductById } from '@/hooks/useInstockProductQueries';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductEditorTabs } from '@/components/InstockProductEditor/ProductEditorTabs';

export function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreateMode = !id || id === 'new';

  // Fetch product data only if editing (not creating)
  const {
    data: product,
    isLoading: isProductLoading,
    error: productError,
  } = useInstockProductById(isCreateMode ? '' : id || '');

  if (!isCreateMode && isProductLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  } 

  if (!isCreateMode && productError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <p className="text-muted-foreground mt-2">
            The product you're looking for doesn't exist.
          </p>
        </div>
        <Button onClick={() => navigate('/instock-products')} variant="outline">
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/instock-products')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isCreateMode ? 'Create New Product' : product?.name || 'Edit Product'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isCreateMode
                ? 'Add a new instock product to your catalog'
                : product?.slug && `ID: ${product.slug}`}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8">
        {isCreateMode ? (
          <ProductEditorTabs 
            isCreateMode={true} 
            productId={null} 
          />
        ) : product ? (
          <ProductEditorTabs 
            isCreateMode={false} 
            productId={id || ''} 
            product={product} 
          />
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
