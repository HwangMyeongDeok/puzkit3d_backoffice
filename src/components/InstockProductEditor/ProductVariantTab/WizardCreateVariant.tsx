'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, ArrowLeft, ListPlus, ExternalLink, Trash2, Tag } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { useInstockPrices } from '@/hooks/useInstockPriceQueries';
import { formatCurrency, parseCurrency } from '@/lib/utils';
import type { VariantDraft, VariantPriceDraft } from '@/components/InstockProductEditor/ProductVariantTab/PreviewSummary';

interface WizardCreateVariantProps {
  variantsList: VariantDraft[];
  setVariantsList: React.Dispatch<React.SetStateAction<VariantDraft[]>>;
  onBack?: () => void;
  onNext: () => void;
}

export function WizardCreateVariant({ variantsList, setVariantsList, onBack, onNext }: WizardCreateVariantProps) {
  const { data: priceListData } = useInstockPrices({ pageNumber: 1, pageSize: 100 });

  const [draftVariant, setDraftVariant] = useState<Partial<VariantDraft>>({
    color: '', assembledLengthMm: 0, assembledWidthMm: 0, assembledHeightMm: 0,
    initialStock: 0, isActive: true
  });

  const [draftPrices, setDraftPrices] = useState<VariantPriceDraft[]>([]);
  const [tempPriceId, setTempPriceId] = useState('');
  const [tempUnitPrice, setTempUnitPrice] = useState<string>('');

  const handleAddPriceToDraft = () => {
    if (!tempPriceId) return toast.error("Vui lòng chọn bảng giá!");

    const priceNum = parseCurrency(tempUnitPrice);
    if (priceNum < 10000) return toast.error("Giá bán phải từ 10,000 VND trở lên!");

    if (draftPrices.some(p => p.priceId === tempPriceId)) {
      return toast.error("Bảng giá này đã được thêm cho phân loại hiện tại!");
    }

    const selectedPrice = priceListData?.items.find(p => p.id === tempPriceId);

    setDraftPrices([...draftPrices, {
      priceId: tempPriceId,
      priceName: selectedPrice?.name || 'Unknown',
      unitPrice: priceNum
    }]);

    setTempPriceId('');
    setTempUnitPrice('');
  };

  const handleRemoveDraftPrice = (idToRemove: string) => {
    setDraftPrices(draftPrices.filter(p => p.priceId !== idToRemove));
  };

  const handleAddDraftVariant = () => {
    if (!draftVariant.color) return toast.error("Vui lòng nhập màu sắc!");
    if (draftPrices.length === 0) return toast.error("Vui lòng cấu hình ít nhất 1 mức giá cho phân loại này!");

    const hasStandardPrice = draftPrices.some(p =>
      p.priceName.toLowerCase().includes('standard') ||
      p.priceName.toLowerCase().includes('chuẩn')
    );
    if (!hasStandardPrice) {
      toast.warning("Lưu ý: Bạn chưa cấu hình giá Standard cho phân loại này!");
    }

    const newVariant: VariantDraft = {
      localId: Math.random().toString(36).substring(7),
      color: draftVariant.color,
      assembledLengthMm: draftVariant.assembledLengthMm || 0,
      assembledWidthMm: draftVariant.assembledWidthMm || 0,
      assembledHeightMm: draftVariant.assembledHeightMm || 0,
      initialStock: draftVariant.initialStock || 0,
      isActive: draftVariant.isActive ?? true,
      prices: draftPrices,
    };

    setVariantsList([...variantsList, newVariant]);
    toast.success(`Đã thêm phân loại ${draftVariant.color} vào danh sách chờ!`);

    setDraftVariant({
      color: '', assembledLengthMm: 0, assembledWidthMm: 0, assembledHeightMm: 0,
      initialStock: 0, isActive: true
    });
    setDraftPrices([]);
  };

  const handleRemoveDraftVariant = (id: string) => {
    setVariantsList(variantsList.filter(v => v.localId !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {variantsList.length > 0 && (
        <Card className="border-emerald-200 shadow-sm">
          <CardHeader className="bg-emerald-50/50 pb-3">
            <CardTitle className="text-lg text-emerald-800 flex items-center gap-2">
              <ListPlus className="w-5 h-5" /> Danh sách Phân loại chờ tạo ({variantsList.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Màu sắc</TableHead>
                  <TableHead>Kích thước</TableHead>
                  <TableHead>Kho ban đầu</TableHead>
                  <TableHead>Bảng giá đã cấu hình</TableHead>
                  <TableHead className="text-right pr-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variantsList.map((v) => (
                  <TableRow key={v.localId}>
                    <TableCell className="pl-4 font-medium">{v.color}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{v.assembledLengthMm}x{v.assembledWidthMm}x{v.assembledHeightMm}</TableCell>
                    <TableCell>{v.initialStock}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {v.prices.map(p => (
                          <Badge key={p.priceId} variant="secondary" className="font-normal text-xs bg-slate-100">
                            {p.priceName}: <span className="font-medium ml-1 text-brand">{p.unitPrice.toLocaleString()}đ</span>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDraftVariant(v.localId)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex items-center gap-3">
            {onBack && <Button variant="outline" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>}
            <div>
              <CardTitle className="text-xl">Bước 2: Thêm Phân Loại & Giá</CardTitle>
              <CardDescription>Cấu hình thuộc tính vật lý và NHIỀU mức giá cho từng phân loại.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-200 text-sm flex items-center justify-center">1</div> Thông tin vật lý</h3>
                <div className="space-y-4 p-4 border rounded-lg bg-white">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Màu sắc <span className="text-red-500">*</span></label>
                    <Input value={draftVariant.color} onChange={e => setDraftVariant({ ...draftVariant, color: e.target.value })} placeholder="VD: Đỏ, Gỗ sồi..." />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1"><label className="text-xs text-slate-500">Dài (mm)</label><Input type="number" value={draftVariant.assembledLengthMm} onChange={e => setDraftVariant({ ...draftVariant, assembledLengthMm: Number(e.target.value) })} /></div>
                    <div className="space-y-1"><label className="text-xs text-slate-500">Rộng (mm)</label><Input type="number" value={draftVariant.assembledWidthMm} onChange={e => setDraftVariant({ ...draftVariant, assembledWidthMm: Number(e.target.value) })} /></div>
                    <div className="space-y-1"><label className="text-xs text-slate-500">Cao (mm)</label><Input type="number" value={draftVariant.assembledHeightMm} onChange={e => setDraftVariant({ ...draftVariant, assembledHeightMm: Number(e.target.value) })} /></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-200 text-sm flex items-center justify-center">2</div> Tồn kho</h3>
                <div className="p-4 border rounded-lg bg-white">
                  <label className="text-sm font-medium block mb-2">Số lượng ban đầu</label>
                  <Input type="number" value={draftVariant.initialStock} onChange={e => setDraftVariant({ ...draftVariant, initialStock: Number(e.target.value) })} />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-200 text-sm flex items-center justify-center">3</div> Cấu hình giá (Nhiều mức)</h3>
                <a href="/price-management" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 hover:underline">
                  <ExternalLink className="w-4 h-4" /> Quản lý Bảng Giá
                </a>
              </div>

              <div className="border rounded-lg bg-slate-50 overflow-hidden">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_auto] gap-3 p-4 bg-white border-b items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bảng Giá <span className="text-red-500">*</span></label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={tempPriceId} onChange={(e) => setTempPriceId(e.target.value)}
                    >
                      <option value="" disabled>-- Chọn bảng giá --</option>
                      {priceListData?.items?.map(p => (
                        <option key={p.id} value={p.id} disabled={draftPrices.some(dp => dp.priceId === p.id)}>
                          {p.name} {draftPrices.some(dp => dp.priceId === p.id) ? "(Đã thêm)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Giá bán (VND) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={tempUnitPrice}
                        onChange={(e) => setTempUnitPrice(formatCurrency(e.target.value))}
                        placeholder="VD: 1,500,000"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 text-sm">đ</span>
                    </div>
                  </div>
                  <Button type="button" variant="secondary" onClick={handleAddPriceToDraft} className="border-slate-200 bg-slate-100 w-full xl:w-auto">
                    <Tag className="w-4 h-4 mr-2" /> Thêm Giá
                  </Button>
                </div>

                <div className="p-4">
                  {draftPrices.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4 italic">Chưa có bảng giá nào. Bạn phải cấu hình ít nhất 1 mức giá.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {draftPrices.map(price => (
                        <div key={price.priceId} className="flex items-center justify-between bg-white border rounded-md p-2 px-3 shadow-sm">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-slate-50">{price.priceName}</Badge>
                            <span className="font-semibold text-brand">{price.unitPrice.toLocaleString('vi-VN')} đ</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveDraftPrice(price.priceId)} className="h-7 px-2 text-rose-500 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t mt-8">
            <Button type="button" variant="outline" className="flex-1 border-brand text-brand hover:bg-brand/5" onClick={handleAddDraftVariant}>
              <Plus className="w-4 h-4 mr-2" /> Lưu Variant này xuống danh sách chờ
            </Button>

            <Button type="button" className="flex-1" disabled={variantsList.length === 0} onClick={onNext}>
              Tiếp tục & Kiểm tra ({variantsList.length} Phân loại) <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}