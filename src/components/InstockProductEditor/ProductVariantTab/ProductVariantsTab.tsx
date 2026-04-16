'use client';

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Edit, PowerOff, CheckCircle, Loader2, Package, ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import {
  useToggleInstockProductVariantStatus,
  useCreateInstockProductVariant,
  useUpdateInstockProductVariant,
  useCreateInstockProduct
} from '@/hooks/useInstockProductQueries';
import { useVariantsWithInventory, type VariantWithInventory } from '@/hooks/useVariantsWithInventoryQueries';
import { useCreateInventory, useUpdateInventory } from '@/hooks/useInventoryMutations';
import { useCreatePriceDetail, usePriceDetailsByVariantId, useUpdatePriceDetail, useDeletePriceDetail } from '@/hooks/useInstockPriceDetailQueries';

// CHỈ IMPORT HOOK MỚI, KHÔNG CẦN API HAY KEYS NỮA
import { useActiveDrivesByCapabilities } from '@/hooks/useCatalogQueries'; 

import { handleErrorToast } from '@/lib/error-handler';
import { uploadApi } from '@/services/uploadApi';
import type { ProductFormValues } from '@/pages/manager/product-editor/schema';
import type { ProductFiles } from '../ProductInfoTab/ProductInfoTab';

import { PreviewSummary, type VariantDraft, type VariantPriceDraft } from './PreviewSummary';
import { WizardCreateVariant } from './WizardCreateVariant';

export interface ProductVariantsTabProps {
  isCreateMode: boolean;
  productId: string | null;
  productDraftData?: Partial<ProductFormValues>;
  productDraftFiles?: ProductFiles;
  onBack?: () => void;
  wizardVariantsList?: VariantDraft[];
  setWizardVariantsList?: React.Dispatch<React.SetStateAction<VariantDraft[]>>;
}

export function ProductVariantsTab({
  isCreateMode,
  productId,
  productDraftData,
  productDraftFiles,
  onBack,
  wizardVariantsList,
  setWizardVariantsList
}: ProductVariantsTabProps) {
  const navigate = useNavigate();

  const { data: variants, isLoading } = useVariantsWithInventory(productId || '', !isCreateMode);
  const createProductMutation = useCreateInstockProduct();
  const createVariantMutation = useCreateInstockProductVariant();
  const updateVariantMutation = useUpdateInstockProductVariant();
  const createInventoryMutation = useCreateInventory();
  const toggleMutation = useToggleInstockProductVariantStatus();
  const createPriceDetailMutation = useCreatePriceDetail();
  const updateInventoryMutation = useUpdateInventory(productId || '');

  const [localVariantsList, setLocalVariantsList] = useState<VariantDraft[]>([]);
  const variantsList = wizardVariantsList ?? localVariantsList;
  const setVariantsList = setWizardVariantsList ?? setLocalVariantsList;

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isWizardSubmitting, setIsWizardSubmitting] = useState(false);

  const [showEditor, setShowEditor] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantWithInventory | null>(null);
  const [variantToDeactivate, setVariantToDeactivate] = useState<VariantWithInventory | null>(null);

  // === State quản lý dòng mở rộng trong bảng ===
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const { data: editingPriceDetails } = usePriceDetailsByVariantId(editingVariant?.id);
  const updatePriceDetailMutation = useUpdatePriceDetail();
  const deletePriceDetailMutation = useDeletePriceDetail();

  // =====================================================================
  // LẤY VÀ LỌC TRÙNG LẶP DRIVES BẰNG HOOK MỚI (CHỈ 1 DÒNG)
  // =====================================================================
  const capabilityIds = productDraftData?.capabilityIds || [];
  const { data: validDrives = [] } = useActiveDrivesByCapabilities(capabilityIds);
  // =====================================================================

  const editingVariantDraft = useMemo<VariantDraft | undefined>(() => {
    if (!editingVariant) return undefined;
    const prices: VariantPriceDraft[] = (editingPriceDetails || []).map(pd => ({
      priceId: pd.priceId,
      priceName: pd.priceName,
      unitPrice: pd.unitPrice,
    }));
    return {
      localId: editingVariant.id,
      color: editingVariant.color,
      assembledLengthMm: editingVariant.assembledLengthMm,
      assembledWidthMm: editingVariant.assembledWidthMm,
      assembledHeightMm: editingVariant.assembledHeightMm,
      initialStock: editingVariant.stockQuantity ?? 0,
      isActive: editingVariant.isActive,
      prices,
      previewImages: [], // Handle existing images if needed for Edit mode
    };
  }, [editingVariant, editingPriceDetails]);

  const handleFinalSubmit = async () => {
    setIsWizardSubmitting(true);
    const toastId = toast.loading('Creating product...');

    try {
      if (!productDraftData) throw new Error("Missing product data from Step 1");
      const slug = productDraftData.slug || "default-slug";
      let finalThumbnailUrl = productDraftData.thumbnailUrl || "";

      const finalPreviewAsset = { ...(productDraftData.previewAsset || {}) } as Record<string, string>;

      if (productDraftFiles) {
        toast.loading('Uploading main product images...', { id: toastId });
        const uploadTasks: Promise<string>[] = [];

        if (productDraftFiles.thumbnail) {
          uploadTasks.push(uploadApi.uploadFileToS3(productDraftFiles.thumbnail, 'instock-products', `${slug}/thumbnail_${Date.now()}`));
        }
        if (productDraftFiles.previews?.length > 0) {
          productDraftFiles.previews.forEach((file: File, i: number) => {
            uploadTasks.push(uploadApi.uploadFileToS3(file, 'instock-products', `${slug}/preview_${i}_${Date.now()}`));
          });
        }

        if (uploadTasks.length > 0) {
          const uploadedPaths = await Promise.all(uploadTasks);
          let cursor = 0;
          if (productDraftFiles.thumbnail) finalThumbnailUrl = uploadedPaths[cursor++];
          if (productDraftFiles.previews?.length > 0) {
            productDraftFiles.previews.forEach((_: any, i: number) => {
              finalPreviewAsset[`preview_${i + 1}`] = uploadedPaths[cursor++];
            });
          }
        }
      }

      toast.loading('Saving product base data...', { id: toastId });
      const newProductId = await createProductMutation.mutateAsync({
        ...productDraftData,
        thumbnailUrl: finalThumbnailUrl,
        previewAsset: Object.values(finalPreviewAsset),
      } as any);

      toast.loading('Creating variants and uploading variant images...', { id: toastId });

      for (const v of variantsList) {
        let variantPreviewUrls: string[] = [];

        if (v.previewImages && v.previewImages.length > 0) {
          const variantUploadTasks = v.previewImages.map((file: File, i: number) => 
            uploadApi.uploadFileToS3(file, 'instock-products', `${slug}/variant_${v.color}_${i}_${Date.now()}`)
          );
          variantPreviewUrls = await Promise.all(variantUploadTasks);
        }

        const newVariantId = await createVariantMutation.mutateAsync({
          productId: newProductId,
          data: {
            color: v.color,
            assembledLengthMm: v.assembledLengthMm,
            assembledWidthMm: v.assembledWidthMm,
            assembledHeightMm: v.assembledHeightMm,
            previewImages: variantPreviewUrls, 
            isActive: v.isActive
          },
        });

        if (v.initialStock > 0 && newVariantId) {
          await createInventoryMutation.mutateAsync({ productId: newProductId, variantId: newVariantId, quantity: v.initialStock });
        }

        if (newVariantId && v.prices.length > 0) {
          for (const price of v.prices) {
            await createPriceDetailMutation.mutateAsync({
              variantId: newVariantId,
              priceId: price.priceId,
              unitPrice: price.unitPrice,
              isActive: true
            });
          }
        }
      }

      toast.success('Successfully created product & variants.', { id: toastId });
      navigate('/instock-products');

    } catch (error) {
      handleErrorToast(error, 'Error creating product.');
      toast.dismiss(toastId);
    } finally {
      setIsWizardSubmitting(false);
    }
  };

  const handleWizardEditSave = async (updatedData: VariantDraft) => {
    if (!productId || !editingVariant) return;
    try {
      const variantUpdatePayload: Record<string, any> = {};
      if (updatedData.color !== editingVariant.color) variantUpdatePayload.color = updatedData.color;
      if (updatedData.assembledLengthMm !== editingVariant.assembledLengthMm) variantUpdatePayload.assembledLengthMm = updatedData.assembledLengthMm;
      if (updatedData.assembledWidthMm !== editingVariant.assembledWidthMm) variantUpdatePayload.assembledWidthMm = updatedData.assembledWidthMm;
      if (updatedData.assembledHeightMm !== editingVariant.assembledHeightMm) variantUpdatePayload.assembledHeightMm = updatedData.assembledHeightMm;
      if (updatedData.isActive !== editingVariant.isActive) variantUpdatePayload.isActive = updatedData.isActive;

      if (Object.keys(variantUpdatePayload).length > 0) {
        await updateVariantMutation.mutateAsync({
          productId,
          variantId: editingVariant.id,
          data: variantUpdatePayload,
        });
      }

      const currentStock = editingVariant.stockQuantity ?? 0;
      const newStock = updatedData.initialStock;
      if (newStock !== currentStock) {
        if (editingVariant.hasNoInventory) {
          await createInventoryMutation.mutateAsync({ productId, variantId: editingVariant.id, quantity: newStock });
        } else {
          await updateInventoryMutation.mutateAsync({ variantId: editingVariant.id, quantity: newStock });
        }
      }

      const existingPrices = editingPriceDetails || [];
      const draftPrices = updatedData.prices;

      const pricesToDelete = existingPrices.filter(ep => !draftPrices.some(dp => dp.priceId === ep.priceId));
      for (const pd of pricesToDelete) { await deletePriceDetailMutation.mutateAsync(pd.id); }

      const pricesToCreate = draftPrices.filter(dp => !existingPrices.some(ep => ep.priceId === dp.priceId));
      for (const dp of pricesToCreate) {
        await createPriceDetailMutation.mutateAsync({ variantId: editingVariant.id, priceId: dp.priceId, unitPrice: dp.unitPrice, isActive: true });
      }

      const pricesToUpdate = draftPrices.filter(dp => {
        const existing = existingPrices.find(ep => ep.priceId === dp.priceId);
        return existing && existing.unitPrice !== dp.unitPrice;
      });
      for (const dp of pricesToUpdate) {
        const existing = existingPrices.find(ep => ep.priceId === dp.priceId);
        if (existing) { await updatePriceDetailMutation.mutateAsync({ id: existing.id, data: { unitPrice: dp.unitPrice } }); }
      }

      toast.success('Variant updated successfully!');
      setShowEditor(false);
      setEditingVariant(null);
    } catch (error) {
      handleErrorToast(error, 'Failed to update variant');
    }
  };

  const handleActivate = async (variant: VariantWithInventory) => {
    try {
      await toggleMutation.mutateAsync({ productId: productId!, variantId: variant.id, isActive: variant.isActive });
      toast.success('Variant activated successfully.');
    } catch (error) { handleErrorToast(error, 'Failed to activate variant.'); }
  };

  if (isCreateMode && isPreviewMode) {
    return (
      <PreviewSummary
        productDraftData={productDraftData}
        productDraftFiles={productDraftFiles}
        variantsList={variantsList}
        onBack={() => setIsPreviewMode(false)}
        onSubmit={handleFinalSubmit}
        isSubmitting={isWizardSubmitting}
      />
    );
  }

  if (isCreateMode) {
    return (
      <WizardCreateVariant
        variantsList={variantsList}
        setVariantsList={setVariantsList}
        onBack={onBack}
        onNext={() => setIsPreviewMode(true)}
        validDrives={validDrives} 
        driveDetails={productDraftData?.driveDetails}
      />
    );
  }

  if (showEditor) {
    return (
      <WizardCreateVariant
        isCreateMode={false}
        initialVariant={editingVariantDraft}
        onSaveEdit={handleWizardEditSave}
        onCancelEdit={() => { setShowEditor(false); setEditingVariant(null); }}
        validDrives={validDrives} 
        driveDetails={productDraftData?.driveDetails}
      />
    );
  }

  return (
   <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Product Variants & Inventory</h2>
          <p className="text-sm text-muted-foreground">Manage colors, dimensions, status, and initial stock levels.</p>
        </div>
        <Button onClick={() => setShowEditor(true)} className="gap-2 shadow-sm"><Plus className="h-4 w-4" /> Add Variant</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
          ) : !variants || variants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-slate-200 mb-4" />
              <h3 className="text-lg font-medium text-slate-800">No variants found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">This product doesn't have any variants. Create the first one to start selling.</p>
              <Button onClick={() => setShowEditor(true)} variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add Variant</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-10 pl-6"></TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead>In Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant) => {
                    const isExpanded = expandedRows[variant.id];
                    
                    return (
                      <React.Fragment key={variant.id}>
                        {/* DÒNG CHÍNH */}
                        <TableRow className={`group transition-colors ${isExpanded ? "bg-slate-50 border-b-0 hover:bg-slate-50" : "hover:bg-slate-50/80"}`}>
                          <TableCell className="pl-6">
                            <button 
                              onClick={() => toggleRow(variant.id)}
                              className="p-1 rounded-md hover:bg-slate-200 transition-colors text-slate-500 flex items-center justify-center"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </TableCell>
                          <TableCell className="font-mono text-sm font-medium text-slate-700">{variant.sku}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {variant.color}
                              {variant.previewImages && variant.previewImages.length > 0 && (
                                <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full" title={`${variant.previewImages.length} images`}>
                                  <ImageIcon className="w-3 h-3" /> {variant.previewImages.length}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{variant.assembledLengthMm} × {variant.assembledWidthMm} × {variant.assembledHeightMm} mm</TableCell>
                          <TableCell>
                            {variant.hasNoInventory ? (
                              <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-600">Uninitialized</Badge>
                            ) : (
                              <div className="flex items-center gap-1.5 font-medium text-slate-800"><Package className="h-3.5 w-3.5 text-slate-400" />{variant.stockQuantity ?? 0}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={variant.isActive ? 'default' : 'secondary'} className={variant.isActive ? "bg-emerald-100 text-emerald-700" : ""}>{variant.isActive ? 'Active' : 'Inactive'}</Badge>
                          </TableCell>
                          <TableCell className="pr-6">
                            <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="outline" size="sm" onClick={() => { setEditingVariant(variant); setShowEditor(true); }} disabled={toggleMutation.isPending}><Edit className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Edit</Button>
                              {variant.isActive ? (
                                <Button variant="outline" size="sm" onClick={() => setVariantToDeactivate(variant)} disabled={toggleMutation.isPending} className="border-rose-200 text-rose-600 hover:bg-rose-50"><PowerOff className="h-3.5 w-3.5" /></Button>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => handleActivate(variant)} disabled={toggleMutation.isPending} className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"><CheckCircle className="h-3.5 w-3.5" /></Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* DÒNG MỞ RỘNG (HIỂN THỊ HÌNH ẢNH) */}
                        {isExpanded && (
                          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableCell colSpan={7} className="p-0 border-b">
                              <div className="px-14 py-4 animate-in slide-in-from-top-2 fade-in duration-200">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                  <ImageIcon className="w-4 h-4 text-slate-400" /> Variant Images
                                </h4>
                                
                                {!variant.previewImages || variant.previewImages.length === 0 ? (
                                  <p className="text-sm text-slate-500 italic bg-white p-3 rounded border shadow-sm inline-block">No images uploaded for this variant.</p>
                                ) : (
                                  <div className="flex flex-wrap gap-3">
                                    {variant.previewImages.map((imgStr: string, idx: number) => (
                                      <div key={idx} className="relative group w-24 h-24 rounded-md overflow-hidden border shadow-sm bg-white hover:ring-2 hover:ring-brand hover:ring-offset-1 transition-all cursor-zoom-in">
                                        <img src={imgStr} alt={`${variant.sku}-${idx}`} className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!variantToDeactivate} onOpenChange={(open) => !open && setVariantToDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Variant?</AlertDialogTitle>
            <AlertDialogDescription>This will hide variant <strong className="text-slate-800">{variantToDeactivate?.sku}</strong> from customers.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); if (variantToDeactivate) { toggleMutation.mutateAsync({ productId: productId!, variantId: variantToDeactivate.id, isActive: true }).then(() => { toast.success('Variant deactivated.'); setVariantToDeactivate(null); }).catch((err) => handleErrorToast(err, 'Failed to deactivate.')); } }} disabled={toggleMutation.isPending} className="bg-rose-600 hover:bg-rose-700">Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}