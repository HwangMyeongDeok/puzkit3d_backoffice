'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { useAssemblyMethods, useCapabilities, useMaterials, useTopics } from '@/hooks/useMasterDataQueries';
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
  const { data: topics } = useTopics();
  const { data: materials } = useMaterials();
  const { data: capabilities } = useCapabilities();
  const { data: assemblyMethods } = useAssemblyMethods();

  const thumbnailUrl = productDraftFiles?.thumbnail ? URL.createObjectURL(productDraftFiles.thumbnail) : productDraftData?.thumbnailUrl;
  const existingPreviewUrls = Object.values(productDraftData?.previewAsset || {}).filter(url => typeof url === 'string') as string[];
  const newPreviewUrls = productDraftFiles?.previews?.map(file => URL.createObjectURL(file)) || [];
  const allPreviewUrls = [...existingPreviewUrls, ...newPreviewUrls];

  const topicName = topics?.find(t => t.id === productDraftData?.topicId)?.name || 'Chưa chọn';
  const materialName = materials?.find(m => m.id === productDraftData?.materialId)?.name || 'Chưa chọn';
  const assemblyMethodName = assemblyMethods?.find(a => a.id === productDraftData?.assemblyMethodId)?.name || 'Chưa chọn';

  const capabilityNames = productDraftData?.capabilityIds
    ?.map(id => capabilities?.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join(', ') || 'Chưa chọn';

  return (
    <Card className="animate-in fade-in zoom-in-95 duration-300 border-brand shadow-md">
      <CardHeader className="bg-brand/5 border-b pb-6">
        <CardTitle className="text-2xl text-brand">Xác nhận Lưu Sản Phẩm</CardTitle>
        <CardDescription>Vui lòng kiểm tra lại toàn bộ thông tin sản phẩm và phân loại trước khi chốt tạo.</CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-8">
        {/* --- PHẦN 1: THÔNG TIN CHUNG --- */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">1. Thông tin chung</h3>

          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 bg-slate-50 p-5 rounded-lg border">
            {/* Cột Trái: Hình ảnh */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-500">Ảnh đại diện</p>
              <div className="aspect-square bg-white rounded-md border shadow-sm flex items-center justify-center overflow-hidden">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-400 text-xs">Chưa có ảnh</span>
                )}
              </div>

              {allPreviewUrls.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2 mt-4">Ảnh kèm theo ({allPreviewUrls.length})</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {allPreviewUrls.map((url, idx) => (
                      <img key={idx} src={url} alt={`preview-${idx}`} className="w-12 h-12 rounded border object-cover shrink-0" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cột Phải: Dữ liệu Form */}
            <div className="space-y-5">
              <div>
                <p className="text-sm text-slate-500 mb-1">Tên sản phẩm</p>
                <p className="font-semibold text-xl text-slate-900">{productDraftData?.name || "Chưa nhập"}</p>
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
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase">Method</p>
                  <p className="font-medium text-slate-800 text-sm">{assemblyMethodName}</p>
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
                <div className="col-span-2 sm:col-span-3 pt-2 border-t mt-2">
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase">Capabilities</p>
                  <p className="font-medium text-brand text-sm">{capabilityNames}</p>
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <p className="text-sm text-slate-500 mb-1">Mô tả sản phẩm</p>
                <div className="text-sm bg-white p-3 rounded border text-slate-700 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {productDraftData?.description || "Chưa có mô tả..."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- PHẦN 2: DANH SÁCH PHÂN LOẠI --- */}
        <div className="space-y-3">
          <div className="flex justify-between items-end border-b pb-2">
            <h3 className="font-semibold text-lg text-slate-800">2. Phân loại & Giá bán</h3>
            <p className="font-bold text-brand">{variantsList.length} Variant(s)</p>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead>Phân loại (Màu)</TableHead>
                  <TableHead>Tồn kho</TableHead>
                  <TableHead>Các mức giá áp dụng</TableHead>
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
                              {p.unitPrice ? p.unitPrice.toLocaleString('vi-VN') : 0} đ
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

        {/* --- PHẦN 3: NÚT ACTION --- */}
        <div className="flex justify-end gap-4 pt-6 border-t mt-8">
          <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
            Quay lại chỉnh sửa
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting} className="min-w-[200px]">
            {isSubmitting ? 'Đang tạo...' : 'Chốt Tạo Tất Cả'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}