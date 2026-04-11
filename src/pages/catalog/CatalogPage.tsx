import React, { useState, useMemo } from 'react';
import { Boxes, Layers3, Package, Shapes, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import {
  useTopics, useCreateTopic, useUpdateTopic, useDeleteTopic,
  useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial,
  useCapabilities, useCreateCapability, useUpdateCapability, useDeleteCapability,
  useAssemblyMethods, useCreateAssemblyMethod, useUpdateAssemblyMethod, useDeleteAssemblyMethod
} from '@/hooks/useMasterDataQueries';
import { handleErrorToast } from '@/lib/error-handler';

type TabKey = 'topics' | 'materials' | 'capabilities' | 'assembly-methods';

const CATALOG_TABS = [
  { id: 'assembly-methods', label: 'Assembly Methods', icon: Boxes, description: 'Manage system assembly techniques' },
  { id: 'capabilities', label: 'Capabilities', icon: Layers3, description: 'Manage manufacturing capabilities' },
  { id: 'materials', label: 'Materials', icon: Package, description: 'Manage product materials' },
  { id: 'topics', label: 'Topics', icon: Shapes, description: 'Manage categorical topics and hierarchy' },
] as const;

const INITIAL_FORM_STATE = { name: '', slug: '', description: '', isActive: true, parentId: '' };

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('assembly-methods');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const topicsQuery = useTopics();
  const materialsQuery = useMaterials();
  const capabilitiesQuery = useCapabilities();
  const assemblyMethodsQuery = useAssemblyMethods();

  const topicMutations = { create: useCreateTopic(), update: useUpdateTopic(), remove: useDeleteTopic() };
  const materialMutations = { create: useCreateMaterial(), update: useUpdateMaterial(), remove: useDeleteMaterial() };
  const capabilityMutations = { create: useCreateCapability(), update: useUpdateCapability(), remove: useDeleteCapability() };
  const assemblyMutations = { create: useCreateAssemblyMethod(), update: useUpdateAssemblyMethod(), remove: useDeleteAssemblyMethod() };

  const { data: items, isLoading } = useMemo(() => {
    switch (activeTab) {
      case 'topics': return { data: topicsQuery.data, isLoading: topicsQuery.isLoading };
      case 'materials': return { data: materialsQuery.data, isLoading: materialsQuery.isLoading };
      case 'capabilities': return { data: capabilitiesQuery.data, isLoading: capabilitiesQuery.isLoading };
      case 'assembly-methods': return { data: assemblyMethodsQuery.data, isLoading: assemblyMethodsQuery.isLoading };
      default: return { data: [], isLoading: false };
    }
  }, [activeTab, topicsQuery.data, materialsQuery.data, capabilitiesQuery.data, assemblyMethodsQuery.data]);

  const activeTabConfig = CATALOG_TABS.find(t => t.id === activeTab);
  const isEditing = !!editingItem;

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        slug: item.slug || '',
        description: item.description || '',
        isActive: item.isActive ?? true,
        parentId: item.parentId || '',
      });
    } else {
      setEditingItem(null);
      setFormData(INITIAL_FORM_STATE);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData(INITIAL_FORM_STATE);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { 
      name: formData.name, 
      slug: formData.slug, 
      description: formData.description, 
      isActive: formData.isActive 
    };

    if (activeTab === 'topics') payload.parentId = formData.parentId || null;

    try {
      if (activeTab === 'topics') {
        isEditing ? await topicMutations.update.mutateAsync({ id: editingItem.id, data: payload }) 
                  : await topicMutations.create.mutateAsync(payload);
      } else if (activeTab === 'materials') {
        isEditing ? await materialMutations.update.mutateAsync({ id: editingItem.id, data: payload }) 
                  : await materialMutations.create.mutateAsync(payload);
      } else if (activeTab === 'capabilities') {
        isEditing ? await capabilityMutations.update.mutateAsync({ id: editingItem.id, data: payload }) 
                  : await capabilityMutations.create.mutateAsync(payload);
      } else if (activeTab === 'assembly-methods') {
        isEditing ? await assemblyMutations.update.mutateAsync({ id: editingItem.id, data: payload }) 
                  : await assemblyMutations.create.mutateAsync(payload);
      }
      toast.success(isEditing ? 'Record updated successfully' : 'Record created successfully');
      handleCloseDialog();
    } catch (error) {
      handleErrorToast(error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      switch (activeTab) {
        case 'topics': await topicMutations.remove.mutateAsync(deletingId); break;
        case 'materials': await materialMutations.remove.mutateAsync(deletingId); break;
        case 'capabilities': await capabilityMutations.remove.mutateAsync(deletingId); break;
        case 'assembly-methods': await assemblyMutations.remove.mutateAsync(deletingId); break;
      }
      toast.success('Record deleted successfully');
      setDeletingId(null);
    } catch (error) {
      handleErrorToast(error);
    }
  };

  const isSubmitting = 
    topicMutations.create.isPending || topicMutations.update.isPending ||
    materialMutations.create.isPending || materialMutations.update.isPending ||
    capabilityMutations.create.isPending || capabilityMutations.update.isPending ||
    assemblyMutations.create.isPending || assemblyMutations.update.isPending;

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catalog Management</h1>
        <p className="text-muted-foreground mt-1">Configure and manage master data entities.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabKey)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl">
          {CATALOG_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{activeTabConfig?.label}</h2>
            <p className="text-sm text-muted-foreground">{activeTabConfig?.description}</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add New Record
          </Button>
        </div>

        <TabsContent value={activeTab} className="mt-4 border rounded-xl bg-card shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !items?.length ? (
            <div className="p-12 text-center text-muted-foreground">
              No records found. Click "Add New Record" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[30%]">Name & Slug</TableHead>
                  <TableHead className="w-[40%]">Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.slug}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'} className={item.isActive ? "bg-green-100 text-green-700 hover:bg-green-100 border-none" : ""}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingId(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* FORM DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Record' : 'Create New Record'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the details of this catalog item.' : 'Add a new item to the catalog.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input 
                id="name" 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Injection Molding"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
              <Input 
                id="slug" 
                required 
                value={formData.slug} 
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. injection-molding"
              />
            </div>

            {activeTab === 'topics' && (
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Topic</Label>
                <select
                  id="parentId"
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">-- Root Level --</option>
                  {topicsQuery.data
                    ?.filter((t: any) => t.id !== editingItem?.id)
                    .map((topic: any) => (
                      <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide details..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch 
                id="isActive" 
                checked={formData.isActive} 
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active Status</Label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG FOR DELETION */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this record from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}