import { useState } from 'react';
import type { InstockProduct, PartnerProduct, InstockProductVariant } from '@/types/types';
import { instockProducts as initialInstock, partnerProducts as initialPartner } from '@/mock/products';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Pencil, Package, Handshake, AlertTriangle, Hash,
  Mail, Phone, MapPin, Ruler, DollarSign,
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
function InstockEditDialog({ product, open, onClose }: { product: InstockProduct; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<InstockProduct>(product);

  const set = <K extends keyof InstockProduct>(k: K, v: InstockProduct[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const setVariant = (
    vid: string,
    target: 'color' | 'is_active' | 'unit_price' | 'total_quantity' | 'length' | 'width' | 'height',
    value: string | number | boolean,
  ) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v): InstockProductVariant => {
        if (v.id !== vid) return v;
        switch (target) {
          case 'color': return { ...v, color: value as string };
          case 'is_active': return { ...v, is_active: value as boolean };
          case 'total_quantity': return { ...v, inventory: { ...v.inventory, total_quantity: Number(value) } };
          case 'unit_price': return { ...v, price_details: v.price_details.map((pd, i) => i === 0 ? { ...pd, unit_price: Number(value) } : pd) };
          case 'length': return { ...v, assembled_length_mm: Number(value) };
          case 'width': return { ...v, assembled_width_mm: Number(value) };
          case 'height': return { ...v, assembled_height_mm: Number(value) };
          default: return v;
        }
      }),
    }));
  };

  const handleSave = () => { console.log('💾 [Instock Updated]', form); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg"><Package className="h-5 w-5" /> Edit Instock Product</DialogTitle>
          <DialogDescription>Fields from <code className="text-xs">instock.instock_product</code> and related tables. Read-only fields are disabled.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 max-h-[calc(90vh-10rem)]">
          <div className="space-y-6 pb-6">

            {/* ── Identifiers (read-only) ── */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identifiers</legend>
              <div className="grid grid-cols-3 gap-3">
                <ReadOnlyField label="ID (uuid)" value={form.id} />
                <ReadOnlyField label="Code" value={form.code} />
                <ReadOnlyField label="Slug" value={form.slug} />
              </div>
            </fieldset>

            {/* ── General Info ── */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">General Info</legend>
              <div>
                <Label htmlFor="ip-name">Name</Label>
                <Input id="ip-name" value={form.name} className="mt-1" onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ip-desc">Description</Label>
                <Textarea id="ip-desc" value={form.description ?? ''} className="mt-1 min-h-[72px]" onChange={(e) => set('description', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ip-thumb">Thumbnail URL</Label>
                <Input id="ip-thumb" value={form.thumbnail_url} className="mt-1" onChange={(e) => set('thumbnail_url', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="ip-diff">Difficult Level</Label>
                  <Input id="ip-diff" value={form.difficult_level} className="mt-1" onChange={(e) => set('difficult_level', e.target.value as InstockProduct['difficult_level'])} />
                </div>
                <div>
                  <Label htmlFor="ip-time">Build Time (min)</Label>
                  <Input id="ip-time" type="number" value={form.estimated_build_time} className="mt-1" onChange={(e) => set('estimated_build_time', Number(e.target.value))} />
                </div>
                <div>
                  <Label htmlFor="ip-pieces">Total Pieces</Label>
                  <Input id="ip-pieces" type="number" value={form.total_piece_count} className="mt-1" onChange={(e) => set('total_piece_count', Number(e.target.value))} />
                </div>
              </div>

              {/* Catalog refs (read-only) */}
              <div className="grid grid-cols-2 gap-3">
                <ReadOnlyField label="Topic" value={form.topic?.name ?? form.topic_id} />
                <ReadOnlyField label="Assembly Method" value={form.assembly_method?.name ?? form.assembly_method_id} />
                <ReadOnlyField label="Material" value={form.material?.name ?? form.material_id} />
                <ReadOnlyField label="Capability" value={form.capability?.name ?? form.capability_id} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">is_active</p>
                  <p className="text-xs text-muted-foreground">Product visible on storefront</p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
              </div>
            </fieldset>

            {/* ── Variants & Inventory ── */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variants ({form.variants.length})</legend>
              <div className="space-y-4">
                {form.variants.map((v) => {
                  const activePrice = v.price_details.find((pd) => pd.is_active);
                  return (
                    <div key={v.id} className="rounded-lg border p-4 space-y-3 bg-muted/20">
                      {/* Header row */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs"><Hash className="h-3 w-3 mr-0.5" />{v.sku}</Badge>
                          <Badge variant="secondary" className="text-xs">{v.color}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch checked={v.is_active} onCheckedChange={(val) => setVariant(v.id, 'is_active', val)} />
                          <span className="text-xs text-muted-foreground">{v.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>

                      {/* Dimensions */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs flex items-center gap-1"><Ruler className="h-3 w-3" />L (mm)</Label>
                          <Input type="number" value={v.assembled_length_mm} className="mt-1 h-8 text-sm" onChange={(e) => setVariant(v.id, 'length', e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs">W (mm)</Label>
                          <Input type="number" value={v.assembled_width_mm} className="mt-1 h-8 text-sm" onChange={(e) => setVariant(v.id, 'width', e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs">H (mm)</Label>
                          <Input type="number" value={v.assembled_height_mm} className="mt-1 h-8 text-sm" onChange={(e) => setVariant(v.id, 'height', e.target.value)} />
                        </div>
                      </div>

                      {/* Price & Inventory */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs flex items-center gap-1"><DollarSign className="h-3 w-3" />Active Price</Label>
                          <Input type="number" step="0.01" value={activePrice?.unit_price ?? 0} className="mt-1 h-8 text-sm"
                            onChange={(e) => setVariant(v.id, 'unit_price', e.target.value)} />
                          {activePrice?.price_name && <p className="text-[10px] text-muted-foreground mt-0.5">Price list: {activePrice.price_name}</p>}
                        </div>
                        <div>
                          <Label className="text-xs">total_quantity (inventory)</Label>
                          <Input type="number" value={v.inventory.total_quantity} className="mt-1 h-8 text-sm"
                            onChange={(e) => setVariant(v.id, 'total_quantity', e.target.value)} />
                        </div>
                      </div>

                      {/* Other price details (read-only) */}
                      {v.price_details.length > 1 && (
                        <div className="flex flex-wrap gap-1">
                          {v.price_details.filter((pd) => !pd.is_active).map((pd) => (
                            <Badge key={pd.id} variant="outline" className="text-[10px] opacity-60">
                              {pd.price_name}: ${pd.unit_price.toFixed(2)} (inactive)
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
// PARTNER EDIT DIALOG
// ═══════════════════════════════════════════════════════════════════
function PartnerEditDialog({ product, open, onClose }: { product: PartnerProduct; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<PartnerProduct>(product);

  const set = <K extends keyof PartnerProduct>(k: K, v: PartnerProduct[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = () => { console.log('💾 [Partner Product Updated]', form); onClose(); };

  const p = form.partner;
  const isc = p.import_service_config;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg"><Handshake className="h-5 w-5" /> Edit Partner Product</DialogTitle>
          <DialogDescription>Fields from <code className="text-xs">partner.partner_product</code> / <code className="text-xs">partner.partner</code>.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 max-h-[calc(90vh-10rem)]">
          <div className="space-y-5 pb-6">

            {/* Identifiers */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identifiers</legend>
              <div className="grid grid-cols-2 gap-3">
                <ReadOnlyField label="Product ID" value={form.id} />
                <ReadOnlyField label="Slug" value={form.slug} />
              </div>
            </fieldset>

            {/* Partner (read-only) */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Partner</legend>
              <div className="rounded-lg border p-3 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{p.name}</p>
                  <Badge variant="outline" className="font-mono text-[10px]">{p.slug}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.contact_email}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.contact_phone}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.address}</span>
                </div>
                {isc && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="secondary" className="text-[10px]">{isc.country_name} ({isc.country_code})</Badge>
                    <Badge variant="secondary" className="text-[10px]">Ship: ${isc.base_shipping_fee.toFixed(2)}</Badge>
                    <Badge variant="secondary" className="text-[10px]">Tax: {isc.import_tax_percentage}%</Badge>
                  </div>
                )}
              </div>
            </fieldset>

            {/* Product Info (editable) */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Info</legend>
              <div>
                <Label htmlFor="pp-name">Name</Label>
                <Input id="pp-name" value={form.name} className="mt-1" onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pp-desc">Description</Label>
                <Textarea id="pp-desc" value={form.description ?? ''} className="mt-1 min-h-[60px]" onChange={(e) => set('description', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pp-thumb">Thumbnail URL</Label>
                <Input id="pp-thumb" value={form.thumbnail_url} className="mt-1" onChange={(e) => set('thumbnail_url', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pp-price">Reference Price ($)</Label>
                <Input id="pp-price" type="number" step="0.01" value={form.reference_price} className="mt-1" onChange={(e) => set('reference_price', Number(e.target.value))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">is_active</p>
                  <p className="text-xs text-muted-foreground">Partner product visible</p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
              </div>
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
  const [instockData] = useState<InstockProduct[]>(initialInstock);
  const [partnerData] = useState<PartnerProduct[]>(initialPartner);

  const [editInstock, setEditInstock] = useState<InstockProduct | null>(null);
  const [editPartner, setEditPartner] = useState<PartnerProduct | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
        <p className="text-muted-foreground">Manage instock catalog and partner-listed products.</p>
      </div>

      <Tabs defaultValue="instock" className="w-full">
        <TabsList>
          <TabsTrigger value="instock" className="gap-2"><Package className="h-4 w-4" /> Instock Products</TabsTrigger>
          <TabsTrigger value="partner" className="gap-2"><Handshake className="h-4 w-4" /> Partner Products</TabsTrigger>
        </TabsList>

        {/* ── Instock Tab ── */}
        <TabsContent value="instock" className="mt-4">
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
        </TabsContent>

        {/* ── Partner Tab ── */}
        <TabsContent value="partner" className="mt-4">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Product</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Ref. Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partnerData.map((p) => (
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
                    <TableCell>
                      <span className="text-sm">{p.partner.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {p.partner.import_service_config?.country_name ?? '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>${p.reference_price.toFixed(2)}</TableCell>
                    <TableCell>
                      {p.is_active
                        ? <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Active</Badge>
                        : <Badge variant="secondary" className="opacity-60">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditPartner(p)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}
      {editInstock && <InstockEditDialog product={editInstock} open={!!editInstock} onClose={() => setEditInstock(null)} />}
      {editPartner && <PartnerEditDialog product={editPartner} open={!!editPartner} onClose={() => setEditPartner(null)} />}
    </div>
  );
}
