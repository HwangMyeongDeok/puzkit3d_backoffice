import React, { useState, useEffect } from 'react';
import slugify from 'slugify';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { useCreateTopic, useCreateCatalogItem, useUpdateCatalogItem } from '@/hooks/useCatalogQueries';
import { handleErrorToast } from '@/lib/error-handler';
import type { CatalogItem, TopicItem } from '@/services/catalogApi';

interface BaseItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'topics' | 'materials' | 'assembly-methods' | 'capabilities' | string;
  editingItem: CatalogItem | null;
  topicsList?: TopicItem[]; // Passed down to avoid re-fetching inside dialog if not needed
}

export function BaseItemDialog({ isOpen, onClose, activeTab, editingItem, topicsList = [] }: BaseItemDialogProps) {
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', isActive: true, parentId: '' });

  const topicMutations = { create: useCreateTopic(), update: useUpdateCatalogItem('topics') };
  const materialMutations = { create: useCreateCatalogItem('materials'), update: useUpdateCatalogItem('materials') };
  const assemblyMutations = { create: useCreateCatalogItem('assembly-methods'), update: useUpdateCatalogItem('assembly-methods') };

  const isSubmitting = topicMutations.create.isPending || topicMutations.update.isPending || 
                       materialMutations.create.isPending || materialMutations.update.isPending || 
                       assemblyMutations.create.isPending || assemblyMutations.update.isPending;

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({ name: editingItem.name, slug: editingItem.slug, description: editingItem.description, isActive: editingItem.isActive, parentId: (editingItem as TopicItem).parentId || '' });
      } else {
        setFormData({ name: '', slug: '', description: '', isActive: true, parentId: '' });
      }
    }
  }, [isOpen, editingItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: formData.name, slug: formData.slug, description: formData.description, isActive: formData.isActive };
    try {
      if (activeTab === 'topics') {
        const topicPayload = { ...payload, parentId: formData.parentId || null };
        editingItem ? await topicMutations.update.mutateAsync({ id: editingItem.id, payload: topicPayload }) : await topicMutations.create.mutateAsync(topicPayload);
      } else if (activeTab === 'materials') {
        editingItem ? await materialMutations.update.mutateAsync({ id: editingItem.id, payload }) : await materialMutations.create.mutateAsync(payload);
      } else if (activeTab === 'assembly-methods') {
        editingItem ? await assemblyMutations.update.mutateAsync({ id: editingItem.id, payload }) : await assemblyMutations.create.mutateAsync(payload);
      }
      toast.success('Saved successfully!');
      onClose();
    } catch (error) { handleErrorToast(error); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Record' : 'Create New Record'}</DialogTitle>
          <DialogDescription>Update details for this catalog item.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input required value={formData.name} onChange={(e) => {
              const name = e.target.value;
              setFormData(prev => ({ ...prev, name, slug: editingItem ? prev.slug : slugify(name, { lower: true, strict: true, locale: 'en' }) }));
            }} />
          </div>
          <div className="space-y-2"><Label>Slug <span className="text-destructive">*</span></Label><Input required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} /></div>
          
          {activeTab === 'topics' && (
            <div className="space-y-2">
              <Label>Parent Topic</Label>
              <select value={formData.parentId} onChange={(e) => setFormData({ ...formData, parentId: e.target.value })} className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">-- Root Level --</option>
                {topicsList.filter(t => t.id !== editingItem?.id).map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
          <div className="flex items-center space-x-2 pt-2"><Switch checked={formData.isActive} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} /><Label>Active Status</Label></div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}