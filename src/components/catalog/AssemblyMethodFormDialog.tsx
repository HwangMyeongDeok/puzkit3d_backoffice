import React, { useState, useEffect } from 'react';
import { Layers3, Link as LinkIcon, ArrowRight, X, Package } from 'lucide-react';
import { toast } from 'sonner';
import slugify from 'slugify';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import {
  useCatalogList,
  useCreateCatalogItem, useUpdateCatalogItem,
  useAssignedCapabilityMaterials, useAssignCapabilityMaterialToAssembly,
  useUpdateCapabilityMaterialAssemblyStatus, useDeleteCapabilityMaterialFromAssembly
} from '@/hooks/useCatalogQueries';
import { handleErrorToast } from '@/lib/error-handler';
import type { CatalogItem } from '@/services/catalogApi';

interface AssemblyMethodFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: CatalogItem | null;
}

interface AssemblyPair {
  id?: string; // ID of the mapping table (cmcId)
  capabilityId: string;
  materialId: string;
  capabilityName: string;
  materialName: string;
  isActive: boolean;
  isExisting?: boolean;
}

export function AssemblyMethodFormDialog({ isOpen, onClose, editingItem }: AssemblyMethodFormDialogProps) {
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', isActive: true });
  const [assemblyPairs, setAssemblyPairs] = useState<AssemblyPair[]>([]);
  const [selectedCapability, setSelectedCapability] = useState<CatalogItem | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<CatalogItem | null>(null);

  // Queries
  const capabilitiesQuery = useCatalogList('capabilities', 1, 100);
  const materialsQuery = useCatalogList('materials', 1, 100);
  const assignedDataQuery = useAssignedCapabilityMaterials(editingItem?.id || '');

  // Mutations
  const methodMutations = { create: useCreateCatalogItem('assembly-methods'), update: useUpdateCatalogItem('assembly-methods') };
  const assignMutation = useAssignCapabilityMaterialToAssembly();
  const updateStatusMutation = useUpdateCapabilityMaterialAssemblyStatus();
  const deletePairMutation = useDeleteCapabilityMaterialFromAssembly();

  const isSubmitting = methodMutations.create.isPending || methodMutations.update.isPending || assignMutation.isPending || updateStatusMutation.isPending || deletePairMutation.isPending;

  // Initialize Form
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({ name: editingItem.name, slug: editingItem.slug, description: editingItem.description || '', isActive: editingItem.isActive ?? true });
      } else {
        setFormData({ name: '', slug: '', description: '', isActive: true });
        setAssemblyPairs([]);
      }
      setSelectedCapability(null);
      setSelectedMaterial(null);
    }
  }, [isOpen, editingItem]);

  // Sync existing data
  useEffect(() => {
    if (isOpen && editingItem?.id && assignedDataQuery.data) {
      const existingPairs = (assignedDataQuery.data as any[]).map((item) => ({
        id: item.id, // cmcId
        capabilityId: item.capability?.id || item.capabilityId,
        materialId: item.material?.id || item.materialId,
        capabilityName: item.capability?.name || 'Unknown Capability',
        materialName: item.material?.name || 'Unknown Material',
        isActive: item.isActive ?? true,
        isExisting: true
      }));
      setAssemblyPairs(existingPairs.filter(p => p.capabilityId && p.materialId));
    }
  }, [isOpen, editingItem?.id, assignedDataQuery.data]);

  const handleAddPair = () => {
    if (!selectedCapability || !selectedMaterial) return;
    const isDuplicate = assemblyPairs.some(p => p.capabilityId === selectedCapability.id && p.materialId === selectedMaterial.id);
    if (isDuplicate) return toast.error('This combination already exists!');

    setAssemblyPairs(prev => [...prev, {
      capabilityId: selectedCapability.id,
      materialId: selectedMaterial.id,
      capabilityName: selectedCapability.name,
      materialName: selectedMaterial.name,
      isActive: true,
      isExisting: false
    }]);
    setSelectedCapability(null);
    setSelectedMaterial(null);
  };

  const handleTogglePairStatus = (index: number, checked: boolean) => {
    const updatedPairs = [...assemblyPairs];
    updatedPairs[index].isActive = checked;
    setAssemblyPairs(updatedPairs);
  };

  const handleRemovePair = async (index: number) => {
    const pair = assemblyPairs[index];
    if (pair.isExisting && pair.id && editingItem?.id) {
      try {
        await deletePairMutation.mutateAsync({ assemblyId: editingItem.id, cmcId: pair.id });
        toast.success("Assignment removed from Database");
      } catch (error) { return handleErrorToast(error); }
    }
    setAssemblyPairs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let assemblyId = editingItem?.id;
      
      // 1. Save basic info
      if (editingItem) {
        await methodMutations.update.mutateAsync({ id: assemblyId!, payload: formData });
      } else {
        const res: any = await methodMutations.create.mutateAsync(formData);
        assemblyId = typeof res === 'string' ? res : (res?.data || res?.id || res?.result?.id);
      }
      if (!assemblyId) return toast.error("Error: Could not retrieve ID");

      // 2A. USE POST: Create NEW Constraints
      const newPairs = assemblyPairs.filter(p => !p.isExisting);
      if (newPairs.length > 0) {
        await Promise.all(
          newPairs.map(pair => assignMutation.mutateAsync({
            assemblyMethodId: assemblyId!,
            payload: { capabilityId: pair.capabilityId, materialId: pair.materialId, isActive: pair.isActive }
          }))
        );
      }

      // 2B. USE PUT: Update Status of EXISTING Constraints
      const existingPairs = assemblyPairs.filter(p => p.isExisting && p.id);
      if (existingPairs.length > 0) {
        await Promise.all(
          existingPairs.map(pair => updateStatusMutation.mutateAsync({
            assemblyId: assemblyId!,
            cmcId: pair.id!,
            payload: { isActive: pair.isActive }
          }))
        );
      }

      toast.success('Assembly Method saved successfully!');
      onClose();
    } catch (error) { handleErrorToast(error); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col bg-slate-50/50 p-0 overflow-hidden">
        <div className="bg-white px-6 py-5 border-b">
          <DialogTitle className="text-xl font-bold">{editingItem ? 'Update Assembly Method' : 'Create New Assembly Method'}</DialogTitle>
          <DialogDescription className="mt-1">Define master details and assign allowed capabilities & materials.</DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Basic Info */}
          <form id="assemblyForm" onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">1. Basic Information</h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input required value={formData.name} onChange={(e) => {
                  const name = e.target.value;
                  setFormData(prev => ({ ...prev, name, slug: editingItem ? prev.slug : slugify(name, { lower: true, strict: true, locale: 'en' }) }));
                }} />
              </div>
              <div className="space-y-2"><Label>Slug <span className="text-destructive">*</span></Label><Input required value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} /></div>
              <div className="space-y-2 col-span-2"><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
              <div className="space-y-2"><Label>Status</Label><div className="flex items-center space-x-2 h-10"><Switch checked={formData.isActive} onCheckedChange={c => setFormData({ ...formData, isActive: c })} /><span>Active</span></div></div>
            </div>
          </form>

          {/* 2. Capability & Material */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">2. Assign Capability & Material Rules</h3>
            <div className="flex gap-4 h-[250px]">
              <div className="flex-1 border rounded-xl flex flex-col bg-slate-50">
                <div className="p-3 bg-white font-semibold text-sm border-b flex justify-between">
                  <span>Select Capability</span>
                  {selectedCapability && <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-none truncate max-w-[120px]">{selectedCapability.name}</Badge>}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {(capabilitiesQuery.data?.items as CatalogItem[])?.map(c => (
                    <button type="button" key={c.id} onClick={() => setSelectedCapability(c)} className={`w-full text-left px-3 py-2 text-sm rounded-lg ${selectedCapability?.id === c.id ? 'bg-purple-500 text-white' : 'hover:bg-slate-200'}`}>{c.name}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-center px-2">
                <Button type="button" onClick={handleAddPair} disabled={!selectedCapability || !selectedMaterial} className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700"><LinkIcon className="h-5 w-5" /></Button>
              </div>
              <div className="flex-1 border rounded-xl flex flex-col bg-slate-50">
                <div className="p-3 bg-white font-semibold text-sm border-b flex justify-between">
                  <span>Select Material</span>
                  {selectedMaterial && <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-none truncate max-w-[120px]">{selectedMaterial.name}</Badge>}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {(materialsQuery.data?.items as CatalogItem[])?.map(m => (
                    <button type="button" key={m.id} onClick={() => setSelectedMaterial(m)} className={`w-full text-left px-3 py-2 text-sm rounded-lg ${selectedMaterial?.id === m.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-200'}`}>{m.name}</button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Capability</TableHead><TableHead></TableHead><TableHead>Material</TableHead><TableHead className="text-center">Active</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {assignedDataQuery.isLoading && editingItem ? <TableRow><TableCell colSpan={5} className="text-center py-6"><Skeleton className="h-6 w-1/2 mx-auto" /></TableCell></TableRow> : assemblyPairs.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No combinations added yet.</TableCell></TableRow> : assemblyPairs.map((pair, idx) => (
                    <TableRow key={`${pair.capabilityId}-${pair.materialId}`}>
                      <TableCell className="font-medium text-purple-700"><div className="flex items-center gap-2"><Layers3 className="w-4 h-4 text-purple-500" />{pair.capabilityName}</div></TableCell>
                      <TableCell><ArrowRight className="h-4 w-4 text-slate-300" /></TableCell>
                      <TableCell className="font-medium text-blue-700"><div className="flex items-center gap-2"><Package className="w-4 h-4 text-blue-500" />{pair.materialName}</div></TableCell>
                      <TableCell className="text-center"><Switch checked={pair.isActive} onCheckedChange={c => handleTogglePairStatus(idx, c)} /></TableCell>
                      <TableCell className="text-right"><Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePair(idx)}><X className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="bg-white px-6 py-4 border-t flex justify-end gap-3 shadow-sm">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" form="assemblyForm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Assembly Method'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}