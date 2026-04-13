import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, ArrowRight, X, Cpu, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import slugify from 'slugify';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import {
  useTopics, useCatalogList, useDrives,
  useCreateCatalogItem, useUpdateCatalogItem,
  useAssignedTopicMaterials, useAssignTopicMaterialToCapability,
  useAssignedCapabilityDrives, useAssignDriveToCapability,
  useUpdateTopicMaterialCapabilityStatus,
  useDeleteTopicMaterialFromCapability, useDeleteDriveFromCapability
} from '@/hooks/useCatalogQueries';
import { handleErrorToast } from '@/lib/error-handler';
import type { CatalogItem, TopicItem, DriveItem } from '@/services/catalogApi';

interface CapabilityFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: CatalogItem | null;
}

export function CapabilityFormDialog({ isOpen, onClose, editingItem }: CapabilityFormDialogProps) {
  const [formData, setFormData] = useState<{ name: string; slug: string; description: string; isActive: boolean; factorPercentage: number | '' }>({ name: '', slug: '', description: '', isActive: true, factorPercentage: 0 });
  const [capaPairs, setCapaPairs] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<CatalogItem | null>(null);
  const [capaDrives, setCapaDrives] = useState<any[]>([]);

  // Queries
  const topicsQuery = useTopics(1, 100);
  const materialsQuery = useCatalogList('materials', 1, 100);
  const drivesQuery = useDrives(1, 100);
  const assignedDataQuery = useAssignedTopicMaterials(editingItem?.id || '');
  const assignedDrivesQuery = useAssignedCapabilityDrives(editingItem?.id || '');

  // Mutations
  const capabilityMutations = { create: useCreateCatalogItem('capabilities'), update: useUpdateCatalogItem('capabilities') };
  const assignMutation = useAssignTopicMaterialToCapability();
  const updateTmcStatusMutation = useUpdateTopicMaterialCapabilityStatus();
  const deletePairMutation = useDeleteTopicMaterialFromCapability();
  const assignDriveMutation = useAssignDriveToCapability();
  const deleteDriveMutation = useDeleteDriveFromCapability();

  const isSubmitting = capabilityMutations.create.isPending || capabilityMutations.update.isPending || assignMutation.isPending || assignDriveMutation.isPending || updateTmcStatusMutation.isPending;

  // Initialize Data
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({ name: editingItem.name, slug: editingItem.slug, description: editingItem.description, isActive: editingItem.isActive, factorPercentage: (editingItem as any).factorPercentage ?? 0 });
      } else {
        setFormData({ name: '', slug: '', description: '', isActive: true, factorPercentage: 0 });
        setCapaPairs([]);
        setCapaDrives([]);
      }
      setSelectedTopic(null);
      setSelectedMaterial(null);
    }
  }, [isOpen, editingItem]);

  // Sync Existing Assignments
  useEffect(() => {
    if (isOpen && editingItem?.id && assignedDataQuery.data) {
      setCapaPairs((assignedDataQuery.data as any[]).map(item => ({
        id: item.id, topicId: item.topic?.id || item.topicId, materialId: item.material?.id || item.materialId,
        topicName: item.topic?.name || 'Unknown', materialName: item.material?.name || 'Unknown',
        isActive: item.isActive ?? true, isExisting: true
      })).filter(p => p.topicId && p.materialId));
    }
    if (isOpen && editingItem?.id && assignedDrivesQuery.data) {
      setCapaDrives((assignedDrivesQuery.data as any[]).map(item => ({
        id: item.id, driveId: item.drive?.id || item.driveId, driveName: item.drive?.name || 'Unknown', isExisting: true
      })).filter(d => d.driveId));
    }
  }, [isOpen, editingItem?.id, assignedDataQuery.data, assignedDrivesQuery.data]);

  const handleAddPair = () => {
    if (!selectedTopic || !selectedMaterial) return;
    if (capaPairs.some(p => p.topicId === selectedTopic.id && p.materialId === selectedMaterial.id)) return toast.error('Combination exists!');
    setCapaPairs(prev => [...prev, { topicId: selectedTopic.id, materialId: selectedMaterial.id, topicName: selectedTopic.name, materialName: selectedMaterial.name, isActive: true, isExisting: false }]);
    setSelectedTopic(null); setSelectedMaterial(null);
  };

  const handleRemovePair = async (index: number) => {
    const pair = capaPairs[index];
    if (pair.isExisting && pair.id && editingItem?.id) {
      try {
        await deletePairMutation.mutateAsync({ capabilityId: editingItem.id, tmcId: pair.id });
        toast.success("Assignment removed");
      } catch (error) { return handleErrorToast(error); }
    }
    setCapaPairs(prev => prev.filter((_, i) => i !== index));
  };

  const toggleDrive = async (drive: DriveItem) => {
    const existingIdx = capaDrives.findIndex(d => d.driveId === drive.id);
    if (existingIdx >= 0) {
      const d = capaDrives[existingIdx];
      if (d.isExisting && editingItem?.id) {
        try {
          await deleteDriveMutation.mutateAsync({ capabilityId: editingItem.id, driveId: d.driveId });
          toast.success("Drive unlinked");
        } catch (error) { return handleErrorToast(error); }
      }
      setCapaDrives(prev => prev.filter((_, i) => i !== existingIdx));
    } else {
      setCapaDrives(prev => [...prev, { driveId: drive.id, driveName: drive.name, isExisting: false }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let capaId = editingItem?.id;
      const payload = { ...formData, factorPercentage: Number(formData.factorPercentage) || 0 };
      
      if (editingItem) {
        await capabilityMutations.update.mutateAsync({ id: capaId!, payload });
      } else {
        const res: any = await capabilityMutations.create.mutateAsync(payload);
        capaId = typeof res === 'string' ? res : (res?.data || res?.id || res?.result?.id);
      }
      if (!capaId) return toast.error("Error: Missing ID");

      // Pairs
      const newPairs = capaPairs.filter(p => !p.isExisting);
      if (newPairs.length) await Promise.all(newPairs.map(p => assignMutation.mutateAsync({ capabilityId: capaId!, payload: { topicId: p.topicId, materialId: p.materialId, isActive: p.isActive } })));
      
      const existingPairs = capaPairs.filter(p => p.isExisting && p.id);
      if (existingPairs.length) await Promise.all(existingPairs.map(p => updateTmcStatusMutation.mutateAsync({ capabilityId: capaId!, tmcId: p.id, payload: { isActive: p.isActive } })));

      // Drives
      const newDrives = capaDrives.filter(d => !d.isExisting);
      if (newDrives.length) await Promise.all(newDrives.map(d => assignDriveMutation.mutateAsync({ capabilityId: capaId!, payload: { driveId: d.driveId } })));

      toast.success('Capability saved!');
      onClose();
    } catch (error) { handleErrorToast(error); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col bg-slate-50/50 p-0 overflow-hidden">
        <div className="bg-white px-6 py-5 border-b">
          <DialogTitle className="text-xl font-bold">{editingItem ? 'Update Capability' : 'Create New Capability'}</DialogTitle>
          <DialogDescription className="mt-1">Define master details and assign allowed combinations & drives.</DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Basic Info */}
          <form id="capaForm" onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
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
              <div className="space-y-2"><Label>Factor Percentage <span className="text-destructive">*</span></Label><Input type="number" step="0.1" required value={formData.factorPercentage} onChange={e => setFormData({ ...formData, factorPercentage: e.target.value === '' ? '' : Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Status</Label><div className="flex items-center space-x-2 h-10"><Switch checked={formData.isActive} onCheckedChange={c => setFormData({ ...formData, isActive: c })} /><span>Active</span></div></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
          </form>

          {/* 2. Drives */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center"><h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">2. Assign Drives</h3><span className="text-xs text-muted-foreground">{capaDrives.length} drives selected</span></div>
            {drivesQuery.isLoading ? <Skeleton className="h-20 w-full" /> : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {(drivesQuery?.data?.items as DriveItem[])?.map(drive => {
                  const isSelected = capaDrives.some(d => d.driveId === drive.id);
                  return (
                    <div key={drive.id} onClick={() => toggleDrive(drive)} className={`cursor-pointer transition-all border rounded-xl p-3 flex items-center gap-3 relative ${isSelected ? 'border-indigo-500 bg-indigo-50/80 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}><Cpu className="w-4 h-4" /></div>
                      <span className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{drive.name}</span>
                      {isSelected && <div className="absolute top-0 right-0 p-1"><CheckCircle2 className="w-4 h-4 text-indigo-500" /></div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 3. Topic & Material */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">3. Assign Rules</h3>
            <div className="flex gap-4 h-[250px]">
              <div className="flex-1 border rounded-xl flex flex-col bg-slate-50"><div className="p-3 bg-white font-semibold text-sm border-b">Select Topic</div><div className="flex-1 overflow-y-auto p-2 space-y-1">{(topicsQuery.data?.items as TopicItem[])?.map(t => <button type="button" key={t.id} onClick={() => setSelectedTopic(t)} className={`w-full text-left px-3 py-2 text-sm rounded-lg ${selectedTopic?.id === t.id ? 'bg-purple-500 text-white' : 'hover:bg-slate-200'}`}>{t.name}</button>)}</div></div>
              <div className="flex flex-col justify-center px-2"><Button type="button" onClick={handleAddPair} disabled={!selectedTopic || !selectedMaterial} className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700"><LinkIcon className="h-5 w-5" /></Button></div>
              <div className="flex-1 border rounded-xl flex flex-col bg-slate-50"><div className="p-3 bg-white font-semibold text-sm border-b">Select Material</div><div className="flex-1 overflow-y-auto p-2 space-y-1">{(materialsQuery.data?.items as CatalogItem[])?.map(m => <button type="button" key={m.id} onClick={() => setSelectedMaterial(m)} className={`w-full text-left px-3 py-2 text-sm rounded-lg ${selectedMaterial?.id === m.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-200'}`}>{m.name}</button>)}</div></div>
            </div>
            <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>Topic</TableHead><TableHead></TableHead><TableHead>Material</TableHead><TableHead className="text-center">Active</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {assignedDataQuery.isLoading && editingItem ? <TableRow><TableCell colSpan={5} className="text-center py-6"><Skeleton className="h-6 w-1/2 mx-auto" /></TableCell></TableRow> : capaPairs.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No combinations added yet.</TableCell></TableRow> : capaPairs.map((pair, idx) => (
                    <TableRow key={`${pair.topicId}-${pair.materialId}`}>
                      <TableCell className="font-medium text-purple-700">{pair.topicName}</TableCell>
                      <TableCell><ArrowRight className="h-4 w-4 text-slate-300" /></TableCell>
                      <TableCell className="font-medium text-blue-700">{pair.materialName}</TableCell>
                      <TableCell className="text-center"><Switch checked={pair.isActive} onCheckedChange={c => { const newPairs=[...capaPairs]; newPairs[idx].isActive=c; setCapaPairs(newPairs); }} /></TableCell>
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
          <Button type="submit" form="capaForm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Capability'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}