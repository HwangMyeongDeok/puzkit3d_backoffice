'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// SỬ DỤNG HOOK MỚI
import { useAllTopics, useCatalogList } from '@/hooks/useCatalogQueries';
import type {MaterialItem, DriveItem, CatalogItemBase } from '@/services/catalogApi';

import type { ProductFormValues } from '@/pages/manager/product-editor/schema';
import type { ProductFiles } from '@/components/InstockProductEditor/ProductInfoTab/ProductInfoTab';
import type { VariantFormValues } from '@/pages/manager/product-editor/schema';

export interface VariantPriceDraft {
  priceId: string;
  priceName: string;
  unitPrice: number;
}

export interface VariantDraft extends Omit<VariantFormValues, 'initialStock'> {
  localId: string;
  initialStock: number;
  previewImages?: File[]; // Thêm trường này để lưu file ảnh preview mới upload cho mỗi variant
  prices: VariantPriceDraft[];
}

interface PreviewSummaryProps {
  productDraftData?: Partial<ProductFormValues>;
  productDraftFiles?: ProductFiles;
  variantsList: VariantDraft[];
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function PreviewSummary({
  productDraftData,
  productDraftFiles,
  variantsList,
  onBack,
  onSubmit,
  isSubmitting,
}: PreviewSummaryProps) {
  // --- FETCH MASTER DATA ĐỂ MAP ID SANG NAME ---
  const { data: topicsData } = useAllTopics(true);
  const topics = topicsData?.items || [];

  const { data: materialsData } = useCatalogList('materials', 1, 100, '', true);
  const materials = (Array.isArray(materialsData) ? materialsData : materialsData?.items || []) as MaterialItem[];

  const { data: capsData } = useCatalogList('capabilities', 1, 100, '', true);
  const capabilities = (Array.isArray(capsData) ? capsData : capsData?.items || []) as CatalogItemBase[];

  const { data: methodsData } = useCatalogList('assembly-methods', 1, 100, '', true);
  const assemblyMethods = (Array.isArray(methodsData) ? methodsData : methodsData?.items || []) as CatalogItemBase[];

  const { data: drivesData } = useCatalogList('drives', 1, 100, '', true);
  const drivesList = (Array.isArray(drivesData) ? drivesData : drivesData?.items || []) as DriveItem[];

  // --- XỬ LÝ HÌNH ẢNH ---
  const thumbnailUrl = productDraftFiles?.thumbnail ? URL.createObjectURL(productDraftFiles.thumbnail) : productDraftData?.thumbnailUrl;
  const existingPreviewUrls = Object.values(productDraftData?.previewAsset || {}).filter(url => typeof url === 'string') as string[];
  const newPreviewUrls = productDraftFiles?.previews?.map(file => URL.createObjectURL(file)) || [];
  const allPreviewUrls = [...existingPreviewUrls, ...newPreviewUrls];

  // --- XỬ LÝ MAP ID SANG NAME ---
  const topicName = topics.find(t => t.id === productDraftData?.topicId)?.name || 'Not selected';
  const materialName = materials.find(m => m.id === productDraftData?.materialId)?.name || 'Not selected';

  // Cập nhật: Map mảng assemblyMethodIds thay vì 1 string
  const assemblyMethodNames = productDraftData?.assemblyMethodIds
    ?.map(id => assemblyMethods.find(a => a.id === id)?.name)
    .filter(Boolean)
    .join(', ') || 'Not selected';

  const capabilityNames = productDraftData?.capabilityIds
    ?.map(id => capabilities.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join(', ') || 'Not selected';

  // Thêm: Hiển thị Drive kèm Quantity
  const driveDetailsDisplay = productDraftData?.driveDetails
    ?.map(d => {
      const driveName = drivesList.find(drv => drv.id === d.driveId)?.name || 'Unknown Drive';
      return `${driveName} (x${d.quantity})`;
    })
    .join(', ') || 'None';

  return (
    <Card className="animate-in fade-in zoom-in-95 duration-300 border-brand shadow-md">
      <CardHeader className="bg-brand/5 border-b pb-6">
        <CardTitle className="text-2xl text-brand">Confirm Save Product</CardTitle>
        <CardDescription>Please review all product details and variants before final submission.</CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-8">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">1. General Information</h3>

          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 bg-slate-50 p-5 rounded-lg border">
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-500">Thumbnail Image</p>
              <div className="aspect-square bg-white rounded-md border shadow-sm flex items-center justify-center overflow-hidden">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-400 text-xs">No image</span>
                )}
              </div>

              {allPreviewUrls.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2 mt-4">Preview Images ({allPreviewUrls.length})</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {allPreviewUrls.map((url, idx) => (
                      <img key={idx} src={url} alt={`preview-${idx}`} className="w-12 h-12 rounded border object-cover shrink-0" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm text-slate-500 mb-1">Product Name</p>
                <p className="font-semibold text-xl text-slate-900">{productDraftData?.name || "Not entered"}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 bg-white p-4 rounded border">
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase">Topic</p>
                  <p className="font-medium text-slate-800 text-sm">{topicName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase">Material</p>
                  <p className="font-medium text-slate-800 text-sm">{materialName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase">Difficulty</p>
                  <p className="font-medium text-slate-800 text-sm">{productDraftData?.difficultLevel || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase">Build Time</p>
                  <p className="font-medium text-slate-800 text-sm">{productDraftData?.estimatedBuildTime} min</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase">Piece Count</p>
                  <p className="font-medium text-slate-800 text-sm">{productDraftData?.totalPieceCount}</p>
                </div>
                
                {/* Dàn layout lại cho các mảng nhiều phần tử ở bên dưới */}
                <div className="col-span-2 sm:col-span-3 pt-2 border-t mt-2">
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase">Methods</p>
                  <p className="font-medium text-slate-800 text-sm">{assemblyMethodNames}</p>
                </div>
                
                <div className="col-span-2 sm:col-span-3 pt-2 border-t mt-2">
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase">Capabilities</p>
                  <p className="font-medium text-brand text-sm">{capabilityNames}</p>
                </div>

                <div className="col-span-2 sm:col-span-3 pt-2 border-t mt-2">
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase">Drives</p>
                  <p className="font-medium text-slate-800 text-sm">{driveDetailsDisplay}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Product Description</p>
                <div className="text-sm bg-white p-3 rounded border text-slate-700 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {productDraftData?.description || "No description provided..."}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end border-b pb-2">
            <h3 className="font-semibold text-lg text-slate-800">2. Variants & Pricing</h3>
            <p className="font-bold text-brand">{variantsList.length} Variant(s)</p>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead>Variant (Color)</TableHead>
                  <TableHead>Initial Stock</TableHead>
                  <TableHead>Applicable Prices</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variantsList.map(v => (
                  <TableRow key={v.localId}>
                    <TableCell className="font-medium">{v.color}</TableCell>
                    <TableCell>
                      <span className="bg-slate-100 px-2 py-1 rounded-md font-semibold">
                        {v.initialStock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {v.prices.map(p => (
                          <div key={p.priceId} className="flex justify-between items-center text-sm border-b border-slate-100 pb-1 last:border-0">
                            <span className="text-slate-600">{p.priceName}:</span>
                            <span className="font-medium text-brand">
                              {p.unitPrice ? p.unitPrice.toLocaleString('vi-VN') : 0} VND
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t mt-8">
          <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
            Back to Edit
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting} className="min-w-[200px]">
            {isSubmitting ? 'Creating...' : 'Confirm & Create All'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}