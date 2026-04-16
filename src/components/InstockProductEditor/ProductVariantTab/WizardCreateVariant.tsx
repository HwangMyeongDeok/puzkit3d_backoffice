'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { Plus, ArrowLeft, ListPlus, ExternalLink, Trash2, Tag, Save, Pencil, X, ImagePlus, AlertCircle, CheckCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { useInstockPrices } from '@/hooks/useInstockPriceQueries';
import { formatCurrency, parseCurrency } from '@/lib/utils';
import type { VariantDraft, VariantPriceDraft } from '@/components/InstockProductEditor/ProductVariantTab/PreviewSummary';
import type { DriveItem } from '@/services/catalogApi';

interface WizardCreateVariantProps {
  isCreateMode?: boolean;

  // Các props dùng cho lúc CREATE
  variantsList?: VariantDraft[];
  setVariantsList?: React.Dispatch<React.SetStateAction<VariantDraft[]>>;
  onBack?: () => void;
  onNext?: () => void;

  // Các props dùng cho lúc EDIT
  initialVariant?: VariantDraft;
  onSaveEdit?: (updatedData: VariantDraft) => Promise<void>;
  onCancelEdit?: () => void;

  // Nhận danh sách Drives từ component cha
  validDrives?: DriveItem[];
  driveDetails?: { driveId: string; quantity: number }[];
}

export function WizardCreateVariant({
  isCreateMode = true,
  variantsList = [],
  setVariantsList,
  onBack,
  onNext,
  initialVariant,
  onSaveEdit,
  onCancelEdit,
  validDrives = [],
  driveDetails = []
}: WizardCreateVariantProps) {
  const { data: priceListData } = useInstockPrices({ pageNumber: 1, pageSize: 100 });

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

  const [previewImages, setPreviewImages] = useState<File[]>(
    !isCreateMode && initialVariant?.previewImages ? initialVariant.previewImages : []
  );
  const [previewLocalUrls, setPreviewLocalUrls] = useState<string[]>([]);
  const previewInputRef = useRef<HTMLInputElement>(null);

  const [tempPriceId, setTempPriceId] = useState('');
  const [tempUnitPrice, setTempUnitPrice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);

  // =====================================================================
  // CHUẨN HÓA DRIVES (Bóc lớp vỏ JSON từ API để lấy đúng data)
  // =====================================================================
  const normalizedDrives = useMemo(() => {
    if (!validDrives || validDrives.length === 0) return [];
    // Tự động kiểm tra nếu có thuộc tính .drive bọc ngoài thì lôi nó ra
    return validDrives.map((d: any) => {
      const driveNode = d.drive ? d.drive : d;
      const detail = driveDetails?.find(dd => dd.driveId === driveNode.id);
      return {
        ...driveNode,
        quantity: detail ? detail.quantity : 0 // Nếu người dùng không tích thì quantity là 0, hoặc có thể coi là chưa chọn
      };
    }).filter(Boolean);
  }, [validDrives, driveDetails]);

  // =====================================================================
  // LOGIC TÍNH TOÁN VÀ KIỂM TRA VOLUME
  // =====================================================================
  const calculatedVolume = useMemo(() => {
    const l = draftVariant.assembledLengthMm || 0;
    const w = draftVariant.assembledWidthMm || 0;
    const h = draftVariant.assembledHeightMm || 0;
    return l * w * h;
  }, [draftVariant.assembledLengthMm, draftVariant.assembledWidthMm, draftVariant.assembledHeightMm]);

  // Kiểm tra xem user đã bắt đầu nhập kích thước chưa
  const hasDimensions = calculatedVolume > 0;

  // Lọc ra các drive không đạt yêu cầu
  const failingDrives = useMemo(() => {
    if (normalizedDrives.length === 0) return [];
    return normalizedDrives.filter(d => calculatedVolume < (d.minVolume || 0));
  }, [normalizedDrives, calculatedVolume]);

  const isVolumeValid = normalizedDrives.length === 0 ? hasDimensions : (hasDimensions && failingDrives.length === 0);

  // Cleanup Image URLs
  useEffect(() => {
    const urls = previewImages.map(file => URL.createObjectURL(file));
    setPreviewLocalUrls(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [previewImages]);

  // Reset form khi initialVariant thay đổi
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
      setPreviewImages(initialVariant.previewImages || []);
    }
  }, [isCreateMode, initialVariant]);

  // Handle Image Upload
  const handlePreviewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPreviewImages(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const handleRemovePreviewImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // Pricing Logic
  const handleAddPriceToDraft = () => {
    if (!tempPriceId) return toast.error("Please select a price list!");
    const priceNum = parseCurrency(tempUnitPrice);
    if (priceNum < 10000) return toast.error("Selling price must be at least 10,000 VND!");
    if (draftPrices.some(p => p.priceId === tempPriceId)) return toast.error("This price list has already been added!");
    const selectedPrice = priceListData?.items.find(p => p.id === tempPriceId);
    setDraftPrices([...draftPrices, { priceId: tempPriceId, priceName: selectedPrice?.name || 'Unknown', unitPrice: priceNum }]);
    setTempPriceId(''); setTempUnitPrice('');
  };

  const handleEditDraftPrice = (price: VariantPriceDraft) => {
    setEditingPriceId(price.priceId); setTempPriceId(price.priceId); setTempUnitPrice(formatCurrency(price.unitPrice.toString()));
  };

  const handleUpdateDraftPrice = () => {
    if (!editingPriceId) return;
    const priceNum = parseCurrency(tempUnitPrice);
    if (priceNum < 10000) return toast.error("Selling price must be at least 10,000 VND!");
    setDraftPrices(draftPrices.map(p => p.priceId === editingPriceId ? { ...p, unitPrice: priceNum } : p));
    toast.success('Price updated!'); handleCancelEditPrice();
  };

  const handleCancelEditPrice = () => { setEditingPriceId(null); setTempPriceId(''); setTempUnitPrice(''); };
  const handleRemoveDraftPrice = (idToRemove: string) => {
    if (editingPriceId === idToRemove) handleCancelEditPrice();
    setDraftPrices(draftPrices.filter(p => p.priceId !== idToRemove));
  };

  // Submit Logic
  const handleSubmit = async () => {
    if (!draftVariant.color) return toast.error("Please enter a color!");

    if (!isVolumeValid) {
      if (!hasDimensions) {
        return toast.error("Please enter valid dimensions > 0!");
      }
      if (failingDrives.length > 0) {
        return toast.error(`Dimensions invalid for Drive: ${failingDrives[0].name}.`);
      }
    }

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
      previewImages: previewImages,
    };

    if (isCreateMode) {
      if (setVariantsList) {
        setVariantsList([...variantsList, payload]);
        toast.success(`Variant ${draftVariant.color} added to the pending list!`);
        setDraftVariant({ color: '', assembledLengthMm: 0, assembledWidthMm: 0, assembledHeightMm: 0, initialStock: 0, isActive: true });
        setDraftPrices([]);
        setPreviewImages([]);
      }
    } else {
      if (onSaveEdit) {
        setIsSubmitting(true);
        try { await onSaveEdit(payload); } finally { setIsSubmitting(false); }
      }
    }
  };

  const handleRemoveDraftVariant = (id: string) => {
    if (setVariantsList) setVariantsList(variantsList.filter(v => v.localId !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* PENDING LIST */}
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
                  <TableHead>Images</TableHead>
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
                    <TableCell className="text-slate-500 text-sm">{v.previewImages?.length || 0} files</TableCell>
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

      {/* CHÍNH: FORM */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex items-center gap-3">
            {isCreateMode && onBack && <Button variant="outline" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>}
            {!isCreateMode && onCancelEdit && <Button variant="outline" size="icon" onClick={onCancelEdit}><ArrowLeft className="h-4 w-4" /></Button>}
            <div>
              <CardTitle className="text-xl">
                {isCreateMode ? 'Step 2: Add Variants & Pricing' : `Edit Variant: ${initialVariant?.color || ''}`}
              </CardTitle>
              <CardDescription>
                Configure physical attributes, images, and multiple prices.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-8">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* ================= CỘT TRÁI ================= */}
            <div className="space-y-8">
              {/* === BƯỚC 1: PHYSICAL INFO === */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-200 text-sm flex items-center justify-center">1</div> Physical Information</h3>
                <div className="space-y-6 p-4 border rounded-lg bg-white">

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Color <span className="text-red-500">*</span></label>
                    <Input value={draftVariant.color} onChange={e => setDraftVariant({ ...draftVariant, color: e.target.value })} placeholder="Ex: Red, Oak Wood..." />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-sm font-medium">Dimensions (mm) <span className="text-red-500">*</span></label>
                      <span className="text-xs text-slate-500">
                        Thể tích hiện tại: <strong className="text-slate-800">{calculatedVolume.toLocaleString()} mm³</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1"><label className="text-xs text-slate-500">Length</label><Input type="number" min={0} value={draftVariant.assembledLengthMm} onChange={e => setDraftVariant({ ...draftVariant, assembledLengthMm: Number(e.target.value) })} /></div>
                      <div className="space-y-1"><label className="text-xs text-slate-500">Width</label><Input type="number" min={0} value={draftVariant.assembledWidthMm} onChange={e => setDraftVariant({ ...draftVariant, assembledWidthMm: Number(e.target.value) })} /></div>
                      <div className="space-y-1"><label className="text-xs text-slate-500">Height</label><Input type="number" min={0} value={draftVariant.assembledHeightMm} onChange={e => setDraftVariant({ ...draftVariant, assembledHeightMm: Number(e.target.value) })} /></div>
                    </div>

                    {/* KHU VỰC HIỂN THỊ DRIVE REQUIREMENTS CHI TIẾT */}
                    <div className="mt-4 pt-4 border-t">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 block">
                        Yêu cầu không gian từ Capabilities:
                      </label>

                      {normalizedDrives.length === 0 ? (
                        <div className="p-3 text-sm rounded-md border bg-amber-50 text-amber-700 border-amber-200 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>Chưa có Drive nào yêu cầu thể tích tối thiểu.</span>
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {/* 1. HIỂN THỊ CHI TIẾT TỪNG DRIVE KÈM PHÉP TÍNH */}
                          {normalizedDrives.map((d: any) => {
                            const qty = d.quantity && d.quantity > 0 ? d.quantity : 1;
                            const singleMinV = d.minVolume || 0; 
                            const minV = singleMinV * qty;       
                            const isPass = hasDimensions && calculatedVolume >= minV;

                            return (
                              <div key={d.id} className={`flex flex-col p-3 rounded-md border text-sm transition-colors duration-200 ${!hasDimensions ? 'bg-slate-50 border-slate-200 text-slate-700' :
                                  isPass ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                    'bg-rose-50 border-rose-200 text-rose-800'
                                }`}>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-sm">{d.name || "Unknown Drive"}</span>
                                    <span className="text-xs font-mono font-medium opacity-70">
                                      x {qty} - Min: {singleMinV.toLocaleString()}
                                    </span>
                                    <span className="text-xs opacity-50">➔</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="rounded-md text-[11px] font-mono tracking-wider font-semibold border-current bg-transparent py-0.5 opacity-90">
                                      Total: {minV.toLocaleString()} mm³
                                    </Badge>
                                    {hasDimensions && (
                                      isPass ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                    )}
                                  </div>
                                </div>

                                {normalizedDrives.length === 1 && hasDimensions && calculatedVolume < minV && (
                                  <div className="text-xs font-medium text-rose-600 mt-2 pt-2 border-t border-rose-200/60">
                                    Thể tích nhập vào không đủ. Yêu cầu <strong>{minV.toLocaleString()} mm³</strong>.
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* 2. HIỂN THỊ TỔNG CỦA CÁC TOTAL MIN VOLUME */}
                          {normalizedDrives.length > 1 && (() => {
                            const totalRequiredVolume = normalizedDrives.reduce((sum: number, d: any) => {
                              const qty = d.quantity && d.quantity > 0 ? d.quantity : 1;
                              return sum + (d.minVolume || 0) * qty;
                            }, 0);

                            const isTotalPass = hasDimensions && calculatedVolume >= totalRequiredVolume;
                            const isTotalFail = hasDimensions && calculatedVolume < totalRequiredVolume;

                            return (
                              <div className="mt-2">
                                <div className="flex items-center gap-3 mb-3 opacity-60">
                                  <div className="h-px bg-slate-300 flex-1"></div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Tổng kết</span>
                                  <div className="h-px bg-slate-300 flex-1"></div>
                                </div>

                                <div className={`flex flex-col p-3 rounded-md border-2 text-sm transition-colors duration-200 shadow-sm ${!hasDimensions ? 'bg-slate-100 border-slate-300 text-slate-800' :
                                    isTotalPass ? 'bg-emerald-50 border-emerald-400 text-emerald-900' :
                                      'bg-rose-50 border-rose-400 text-rose-900'
                                  }`}>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-bold text-sm uppercase tracking-wide">Tổng yêu cầu không gian:</span>
                                    <Badge className={`rounded-md text-[12px] font-mono tracking-wider py-1 px-2 ${!hasDimensions ? 'bg-slate-600' :
                                        isTotalPass ? 'bg-emerald-600' : 'bg-rose-600'
                                      } text-white`}>
                                      {totalRequiredVolume.toLocaleString()} mm³
                                    </Badge>
                                  </div>

                                  {isTotalFail && (
                                    <div className="text-xs font-medium text-rose-700 mt-2 pt-2 border-t border-rose-200">
                                      ⚠️ Thể tích hiện tại (<strong>{calculatedVolume.toLocaleString()} mm³</strong>) thấp hơn tổng yêu cầu. Sản phẩm không đủ chỗ chứa linh kiện!
                                    </div>
                                  )}
                                  {isTotalPass && (
                                    <div className="text-xs font-medium text-emerald-700 mt-2 pt-2 border-t border-emerald-200 flex items-center gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5" /> Không gian rộng rãi, đủ chứa toàn bộ linh kiện.
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <label className="text-sm font-medium flex justify-between">
                      Variant Images
                      <span className="text-slate-400 font-normal">{previewImages.length} selected</span>
                    </label>
                    <input ref={previewInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePreviewImagesChange} />

                    <div className="flex flex-wrap gap-3">
                      {previewLocalUrls.map((url, i) => (
                        <div key={i} className="relative group w-20 h-20 rounded-md overflow-hidden border bg-muted shadow-sm">
                          <img src={url} alt={`preview-${i}`} className="object-cover w-full h-full" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => handleRemovePreviewImage(i)} className="bg-white/90 rounded-full p-1.5 text-rose-600 hover:bg-white"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => previewInputRef.current?.click()} className="w-20 h-20 rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-1 text-slate-500 hover:border-brand hover:text-brand transition-colors bg-slate-50">
                        <ImagePlus className="h-5 w-5" /> <span className="text-[10px] font-medium">Add</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* ================= CỘT PHẢI ================= */}
            <div className="space-y-8">
              
              {/* === BƯỚC 2: INVENTORY === */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-200 text-sm flex items-center justify-center">2</div> Inventory</h3>
                <div className="p-4 border rounded-lg bg-white">
                  <label className="text-sm font-medium block mb-2">{isCreateMode ? 'Initial Quantity' : 'Stock Quantity'}</label>
                  <Input type="number" min={0} value={draftVariant.initialStock} onChange={e => setDraftVariant({ ...draftVariant, initialStock: Number(e.target.value) })} />
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
          </div>

          {/* === FOOTER BUTTONS === */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t mt-8">
            {isCreateMode ? (
              <>
                <Button type="button" variant="outline" className="flex-1 border-brand text-brand hover:bg-brand/5" onClick={handleSubmit} disabled={!isVolumeValid}>
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
                <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !isVolumeValid}>
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