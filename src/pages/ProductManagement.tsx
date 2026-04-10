import { useState } from 'react';
import type { InstockProductDto, InstockProductVariantDto } from '@/types/types';
import { instockProducts as initialInstock } from '@/mock/products';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Pencil, Package, AlertTriangle, Hash, Ruler, DollarSign,
} from 'lucide-react';

// ─── Difficulty Badge ────────────────────────────────────────────
const diffStyle: Record<string, string> = {
  EASY:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HARD:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  EXPERT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function DiffBadge({ level }: { level: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${diffStyle[level] ?? ''}`}>{level}</span>;
}

// ─── Read-only Input helper ──────────────────────────────────────
function ReadOnlyField({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} disabled className="mt-1 bg-muted/50 font-mono text-sm" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// INSTOCK EDIT DIALOG
// ═══════════════════════════════════════════════════════════════════
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useInstockProductVariants } from '@/hooks/useInstockProductQueries';
// Nhớ import hook của bạn vào
// import { useInstockProductVariants, type InstockProductVariantDto } from '@/hooks/your-hook-path';

function InstockEditDialog({ product, open, onClose }: { product: InstockProductDto; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<InstockProduct>(product);
  
  // 1. GỌI API NGAY TRONG DIALOG
  const { data: variants, isLoading: isVariantsLoading } = useInstockProductVariants(product.id);

  // 2. KHI API CÓ DATA -> CẬP NHẬT VÀO FORM STATE (HOẶC STATE RIÊNG)
  const [localVariants, setLocalVariants] = useState<InstockProductVariantDto[]>([]);
  const [prevVariants, setPrevVariants] = useState<InstockProductVariantDto[] | undefined>(undefined);;

  // Hàm update riêng cho localVariants
  const handleVariantChange = (vid: string, field: keyof InstockProductVariantDto, value: any) => {
    setLocalVariants(prev => prev.map(v => 
      v.id === vid ? { ...v, [field]: value } : v
    ));
  };

  const handleSave = () => { 
    console.log('💾 [Product Info]', form);
    console.log('💾 [Variants Info]', localVariants);
    onClose(); 
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        {/* ... (Giữ nguyên DialogHeader và phần General Info) ... */}

        <ScrollArea className="flex-1 px-6 max-h-[calc(90vh-10rem)]">
          <div className="space-y-6 pb-6 mt-4">
            
            {/* ... CÁC PHẦN GENERAL INFO Ở ĐÂY ... */}

            {/* ── Variants Section ── */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Variants
              </legend>
              
              {/* TRẠNG THÁI LOADING */}
              {isVariantsLoading ? (
                <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading variants...</span>
                </div>
              ) : localVariants.length === 0 ? (
                <div className="p-4 border rounded-lg text-center text-sm text-muted-foreground bg-muted/10">
                  No variants found for this product.
                </div>
              ) : (
                <div className="space-y-4">
                  {localVariants.map((v) => (
                    <div key={v.id} className="rounded-lg border p-4 space-y-3 bg-muted/20">
                      
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            <Hash className="h-3 w-3 mr-0.5" />{v.sku}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">{v.color}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch 
                            checked={v.isActive} 
                            onCheckedChange={(val) => handleVariantChange(v.id, 'isActive', val)} 
                          />
                          <span className="text-xs text-muted-foreground">{v.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>

                      {/* Dimensions (Khớp với InstockProductVariantDto) */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs flex items-center gap-1"><Ruler className="h-3 w-3" />L (mm)</Label>
                          <Input type="number" value={v.assembledLengthMm} className="mt-1 h-8 text-sm" onChange={(e) => handleVariantChange(v.id, 'assembledLengthMm', Number(e.target.value))} />
                        </div>
                        <div>
                          <Label className="text-xs">W (mm)</Label>
                          <Input type="number" value={v.assembledWidthMm} className="mt-1 h-8 text-sm" onChange={(e) => handleVariantChange(v.id, 'assembledWidthMm', Number(e.target.value))} />
                        </div>
                        <div>
                          <Label className="text-xs">H (mm)</Label>
                          <Input type="number" value={v.assembledHeightMm} className="mt-1 h-8 text-sm" onChange={(e) => handleVariantChange(v.id, 'assembledHeightMm', Number(e.target.value))} />
                        </div>
                      </div>

                      {/* LƯU Ý: Phần Price và Inventory mình đã xóa bỏ vì nó KHÔNG CÓ trong DTO của bạn */}
                      
                    </div>
                  ))}
                </div>
              )}
            </fieldset>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export function ProductManagement() {
  const [instockData] = useState<InstockProductDto[]>(initialInstock);
  const [editInstock, setEditInstock] = useState<InstockProductDto | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Instock Product Management</h1>
        <p className="text-muted-foreground">Manage your instock catalog, variants, and inventory.</p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Product</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Pieces</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instockData.map((p) => {
              const totalStock = p.variants.reduce((s, v) => s + v.inventory.total_quantity, 0);
              const lowStock = totalStock > 0 && totalStock < 20;
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={p.thumbnail_url} alt={p.name} className="h-10 w-10 rounded-md object-cover" />
                      <div>
                        <p className="font-medium leading-tight">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="font-mono">{p.code}</Badge></TableCell>
                  <TableCell><DiffBadge level={p.difficult_level} /></TableCell>
                  <TableCell>{p.total_piece_count}</TableCell>
                  <TableCell><Badge variant="secondary">{p.variants.length}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {lowStock && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                      <span className={lowStock ? 'text-amber-600 font-medium' : ''}>{totalStock}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.is_active
                      ? <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Active</Badge>
                      : <Badge variant="secondary" className="opacity-60">Inactive</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditInstock(p)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ── Dialogs ── */}
      {editInstock && <InstockEditDialog product={editInstock} open={!!editInstock} onClose={() => setEditInstock(null)} />}
    </div>
  );
}