'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, ArrowLeft, ListPlus, ExternalLink, Trash2, Tag, Save, Pencil, X } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { useInstockPrices } from '@/hooks/useInstockPriceQueries';
import { formatCurrency, parseCurrency } from '@/lib/utils';
import type { VariantDraft, VariantPriceDraft } from '@/components/InstockProductEditor/ProductVariantTab/PreviewSummary';

interface WizardCreateVariantProps {
  isCreateMode?: boolean; // THÊM PROP NÀY

  // Các props dùng cho lúc CREATE
  variantsList?: VariantDraft[];
  setVariantsList?: React.Dispatch<React.SetStateAction<VariantDraft[]>>;
  onBack?: () => void;
  onNext?: () => void;

  // Các props dùng cho lúc EDIT
  initialVariant?: VariantDraft; 
  onSaveEdit?: (updatedData: VariantDraft) => Promise<void>;
  onCancelEdit?: () => void;
}

export function WizardCreateVariant({ 
  isCreateMode = true, // Mặc định là true để không ảnh hưởng code cũ
  variantsList = [], 
  setVariantsList, 
  onBack, 
  onNext,
  initialVariant,
  onSaveEdit,
  onCancelEdit
}: WizardCreateVariantProps) {
  const { data: priceListData } = useInstockPrices({ pageNumber: 1, pageSize: 100 });

  // Khởi tạo state: Nếu đang EDIT thì lấy data cũ, nếu CREATE thì để rỗng
  const [draftVariant, setDraftVariant] = useState<Partial<VariantDraft>>({
    color: !isCreateMode && initialVariant ? initialVariant.color : '', 
    assembledLengthMm: !isCreateMode && initialVariant ? initialVariant.assembledLengthMm : 0, 
    assembledWidthMm: !isCreateMode && initialVariant ? initialVariant.assembledWidthMm : 0, 
    assembledHeightMm: !isCreateMode && initialVariant ? initialVariant.assembledHeightMm : 0,
    initialStock: !isCreateMode && initialVariant ? initialVariant.initialStock : 0, 
    isActive: !isCreateMode && initialVariant ? initialVariant.isActive : true
  });

  const [draftPrices, setDraftPrices] = useState<VariantPriceDraft[]>(
    !isCreateMode && initialVariant?.prices ? initialVariant.prices : []
  );

  const [tempPriceId, setTempPriceId] = useState('');
  const [tempUnitPrice, setTempUnitPrice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null); // Track price đang được sửa

  // Nếu initialVariant thay đổi (lúc đổi qua lại giữa các variant trong lúc edit), cập nhật lại form
  useEffect(() => {
    if (!isCreateMode && initialVariant) {
      setDraftVariant({
        color: initialVariant.color,
        assembledLengthMm: initialVariant.assembledLengthMm,
        assembledWidthMm: initialVariant.assembledWidthMm,
        assembledHeightMm: initialVariant.assembledHeightMm,
        initialStock: initialVariant.initialStock,
        isActive: initialVariant.isActive,
      });
      setDraftPrices(initialVariant.prices || []);
    }
  }, [isCreateMode, initialVariant]);

  const handleAddPriceToDraft = () => {
    if (!tempPriceId) return toast.error("Please select a price list!");

    const priceNum = parseCurrency(tempUnitPrice);
    if (priceNum < 10000) return toast.error("Selling price must be at least 10,000 VND!");

    if (draftPrices.some(p => p.priceId === tempPriceId)) {
      return toast.error("This price list has already been added for the current variant!");
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

  // Bấm nút Edit trên 1 price row → populate form để sửa
  const handleEditDraftPrice = (price: VariantPriceDraft) => {
    setEditingPriceId(price.priceId);
    setTempPriceId(price.priceId);
    setTempUnitPrice(formatCurrency(price.unitPrice.toString()));
  };

  // Bấm "Update Price" → cập nhật giá trong draft list
  const handleUpdateDraftPrice = () => {
    if (!editingPriceId) return;

    const priceNum = parseCurrency(tempUnitPrice);
    if (priceNum < 10000) return toast.error("Selling price must be at least 10,000 VND!");

    setDraftPrices(draftPrices.map(p =>
      p.priceId === editingPriceId ? { ...p, unitPrice: priceNum } : p
    ));

    toast.success('Price updated!');
    handleCancelEditPrice();
  };

  // Hủy sửa price → reset form
  const handleCancelEditPrice = () => {
    setEditingPriceId(null);
    setTempPriceId('');
    setTempUnitPrice('');
  };

  const handleRemoveDraftPrice = (idToRemove: string) => {
    // Nếu đang edit price này thì cancel luôn
    if (editingPriceId === idToRemove) handleCancelEditPrice();
    setDraftPrices(draftPrices.filter(p => p.priceId !== idToRemove));
  };

  const handleSubmit = async () => {
    if (!draftVariant.color) return toast.error("Please enter a color!");
    if (draftPrices.length === 0) return toast.error("Please configure at least 1 price for this variant!");

    const hasStandardPrice = draftPrices.some(p => p.priceName.toLowerCase().includes('standard'));
    if (!hasStandardPrice) toast.warning("Note: You have not configured a Standard price for this variant!");

    const payload: VariantDraft = {
      localId: !isCreateMode && initialVariant ? initialVariant.localId : Math.random().toString(36).substring(7),
      color: draftVariant.color,
      assembledLengthMm: draftVariant.assembledLengthMm || 0,
      assembledWidthMm: draftVariant.assembledWidthMm || 0,
      assembledHeightMm: draftVariant.assembledHeightMm || 0,
      initialStock: draftVariant.initialStock || 0,
      isActive: draftVariant.isActive ?? true,
      prices: draftPrices,
    };

    if (isCreateMode) {
      // LOGIC CỦA LUỒNG TẠO MỚI (WIZARD)
      if (setVariantsList) {
        setVariantsList([...variantsList, payload]);
        toast.success(`Variant ${draftVariant.color} added to the pending list!`);
        setDraftVariant({
          color: '', assembledLengthMm: 0, assembledWidthMm: 0, assembledHeightMm: 0,
          initialStock: 0, isActive: true
        });
        setDraftPrices([]);
      }
    } else {
      // LOGIC CỦA LUỒNG EDIT
      if (onSaveEdit) {
        setIsSubmitting(true);
        try {
          await onSaveEdit(payload);
          // Toast success thường để ở component cha gọi api, nhưng ông có thể thêm ở đây nếu muốn
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  const handleRemoveDraftVariant = (id: string) => {
    if (setVariantsList) setVariantsList(variantsList.filter(v => v.localId !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* CÁI BẢNG PENDING CHỈ HIỆN LÚC CREATE MODE */}
      {isCreateMode && variantsList.length > 0 && (
        <Card className="border-emerald-200 shadow-sm">
          <CardHeader className="bg-emerald-50/50 pb-3">
            <CardTitle className="text-lg text-emerald-800 flex items-center gap-2">
              <ListPlus className="w-5 h-5" /> Pending Variants List ({variantsList.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Color</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Initial Stock</TableHead>
                  <TableHead>Configured Price Lists</TableHead>
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
                            {p.priceName}: <span className="font-medium ml-1 text-brand">{p.unitPrice.toLocaleString('vi-VN')} VND</span>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDraftVariant(v.localId)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* PHẦN FORM CHUNG */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex items-center gap-3">
            {/* LÚC TẠO DÙNG onBack, LÚC EDIT DÙNG onCancelEdit */}
            {isCreateMode && onBack && <Button variant="outline" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>}
            {!isCreateMode && onCancelEdit && <Button variant="outline" size="icon" onClick={onCancelEdit}><ArrowLeft className="h-4 w-4" /></Button>}
            
            <div>
              <CardTitle className="text-xl">
                {isCreateMode ? 'Step 2: Add Variants & Pricing' : `Edit Variant: ${initialVariant?.color || ''}`}
              </CardTitle>
              <CardDescription>
                {isCreateMode ? 'Configure physical attributes and MULTIPLE prices for each variant.' : 'Update physical attributes, inventory, and prices.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              {/* === BƯỚC 1: PHYSICAL INFO === */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-200 text-sm flex items-center justify-center">1</div> Physical Information</h3>
                <div className="space-y-4 p-4 border rounded-lg bg-white">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Color <span className="text-red-500">*</span></label>
                    <Input value={draftVariant.color} onChange={e => setDraftVariant({ ...draftVariant, color: e.target.value })} placeholder="Ex: Red, Oak Wood..." />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1"><label className="text-xs text-slate-500">Length (mm)</label><Input type="number" value={draftVariant.assembledLengthMm} onChange={e => setDraftVariant({ ...draftVariant, assembledLengthMm: Number(e.target.value) })} /></div>
                    <div className="space-y-1"><label className="text-xs text-slate-500">Width (mm)</label><Input type="number" value={draftVariant.assembledWidthMm} onChange={e => setDraftVariant({ ...draftVariant, assembledWidthMm: Number(e.target.value) })} /></div>
                    <div className="space-y-1"><label className="text-xs text-slate-500">Height (mm)</label><Input type="number" value={draftVariant.assembledHeightMm} onChange={e => setDraftVariant({ ...draftVariant, assembledHeightMm: Number(e.target.value) })} /></div>
                  </div>
                </div>
              </div>

              {/* === BƯỚC 2: INVENTORY === */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-200 text-sm flex items-center justify-center">2</div> Inventory</h3>
                <div className="p-4 border rounded-lg bg-white">
                  <label className="text-sm font-medium block mb-2">{isCreateMode ? 'Initial Quantity' : 'Stock Quantity'}</label>
                  <Input type="number" value={draftVariant.initialStock} onChange={e => setDraftVariant({ ...draftVariant, initialStock: Number(e.target.value) })} />
                </div>
              </div>
            </div>

            {/* === BƯỚC 3: PRICING === */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-200 text-sm flex items-center justify-center">3</div> Price Configuration (Multiple levels)</h3>
                <a href="/price-management" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 hover:underline">
                  <ExternalLink className="w-4 h-4" /> Manage Price Lists
                </a>
              </div>

              <div className="border rounded-lg bg-slate-50 overflow-hidden">
                <div className="p-4 bg-white border-b space-y-3">
                  {editingPriceId && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                      <Pencil className="w-3.5 h-3.5" />
                      Editing price: <strong>{draftPrices.find(p => p.priceId === editingPriceId)?.priceName}</strong>
                    </div>
                  )}
                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price List <span className="text-red-500">*</span></label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed"
                        value={tempPriceId}
                        onChange={(e) => setTempPriceId(e.target.value)}
                        disabled={!!editingPriceId}
                      >
                        <option value="" disabled>-- Select price list --</option>
                        {priceListData?.items?.map(p => (
                          <option key={p.id} value={p.id} disabled={!editingPriceId && draftPrices.some(dp => dp.priceId === p.id)}>
                            {p.name} {!editingPriceId && draftPrices.some(dp => dp.priceId === p.id) ? "(Added)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Selling Price (VND) <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={tempUnitPrice}
                          onChange={(e) => setTempUnitPrice(formatCurrency(e.target.value))}
                          placeholder="Ex: 1,500,000"
                        />
                        <span className="absolute right-3 top-2 text-slate-400 text-sm">VND</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {editingPriceId ? (
                        <>
                          <Button type="button" onClick={handleUpdateDraftPrice} className="w-full xl:w-auto">
                            <Pencil className="w-4 h-4 mr-2" /> Update
                          </Button>
                          <Button type="button" variant="outline" onClick={handleCancelEditPrice} className="w-full xl:w-auto">
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button type="button" variant="secondary" onClick={handleAddPriceToDraft} className="border-slate-200 bg-slate-100 w-full xl:w-auto">
                          <Tag className="w-4 h-4 mr-2" /> Add Price
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {draftPrices.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4 italic">No price lists added yet. You must configure at least 1 price.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {draftPrices.map(price => (
                        <div key={price.priceId} className={`flex items-center justify-between bg-white border rounded-md p-2 px-3 shadow-sm transition-colors ${editingPriceId === price.priceId ? 'border-amber-300 bg-amber-50/50 ring-1 ring-amber-200' : ''}`}>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-slate-50">{price.priceName}</Badge>
                            <span className="font-semibold text-brand">{price.unitPrice.toLocaleString('vi-VN')} VND</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => handleEditDraftPrice(price)}
                              disabled={!!editingPriceId}
                              className="h-7 px-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => handleRemoveDraftPrice(price.priceId)}
                              disabled={!!editingPriceId}
                              className="h-7 px-2 text-rose-500 hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* === FOOTER BUTTONS THAY ĐỔI THEO MODE === */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t mt-8">
            {isCreateMode ? (
              <>
                <Button type="button" variant="outline" className="flex-1 border-brand text-brand hover:bg-brand/5" onClick={handleSubmit}>
                  <Plus className="w-4 h-4 mr-2" /> Save this Variant to pending list
                </Button>

                <Button type="button" className="flex-1" disabled={variantsList.length === 0} onClick={onNext}>
                  Continue & Review ({variantsList.length} Variants) <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </>
            ) : (
              <div className="w-full flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancelEdit} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                  <Save className="w-4 h-4 mr-2" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}