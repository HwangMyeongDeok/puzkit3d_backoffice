import React, { useState, useMemo } from 'react';
import { Boxes, Layers3, Package, Shapes, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Hooks
import { useTopics, useCatalogList, useDeleteCatalogItem } from '@/hooks/useCatalogQueries';
import { handleErrorToast } from '@/lib/error-handler';
import type { CatalogItem, TopicItem } from '@/services/catalogApi';

// Components
import { BaseItemDialog } from '@/components/catalog/BaseItemDialog';
import { CapabilityFormDialog } from '@/components/catalog/CapabilityFormDialog';
import { CapabilityDetailDialog } from '@/components/catalog/CapabilityDetailDialog';
import { AssemblyMethodFormDialog } from '@/components/catalog/AssemblyMethodFormDialog';
import { AssemblyMethodDetailDialog } from '@/components/catalog/AssemblyMethodDetailDialog';

type TabKey = 'topics' | 'materials' | 'capabilities' | 'assembly-methods';

const CATALOG_TABS = [
  { id: 'topics', label: 'Topics', icon: Shapes, description: 'Manage system topics and hierarchy' },
  { id: 'materials', label: 'Materials', icon: Package, description: 'Manage product materials catalog' },
  { id: 'capabilities', label: 'Capabilities', icon: Layers3, description: 'Manage manufacturing capabilities' },
  { id: 'assembly-methods', label: 'Assembly Methods', icon: Boxes, description: 'Manage system assembly techniques' },
] as const;

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('topics');

  const [isBaseDialogOpen, setIsBaseDialogOpen] = useState(false);
  const [isCapaFormOpen, setIsCapaFormOpen] = useState(false);
  const [isCapaDetailOpen, setIsCapaDetailOpen] = useState(false);
  const [isAssemblyFormOpen, setIsAssemblyFormOpen] = useState(false);
  const [isAssemblyDetailOpen, setIsAssemblyDetailOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const topicsQuery = useTopics(1, 100);
  const materialsQuery = useCatalogList('materials', 1, 100);
  const capabilitiesQuery = useCatalogList('capabilities', 1, 100);
  const assemblyMethodsQuery = useCatalogList('assembly-methods', 1, 100);

  const topicRemove = useDeleteCatalogItem('topics');
  const materialRemove = useDeleteCatalogItem('materials');
  const capabilityRemove = useDeleteCatalogItem('capabilities');
  const assemblyRemove = useDeleteCatalogItem('assembly-methods');

  const { data: pageData, isLoading } = useMemo(() => {
    switch (activeTab) {
      case 'topics': return { data: topicsQuery.data, isLoading: topicsQuery.isLoading };
      case 'materials': return { data: materialsQuery.data, isLoading: materialsQuery.isLoading };
      case 'capabilities': return { data: capabilitiesQuery.data, isLoading: capabilitiesQuery.isLoading };
      case 'assembly-methods': return { data: assemblyMethodsQuery.data, isLoading: assemblyMethodsQuery.isLoading };
      default: return { data: null, isLoading: false };
    }
  }, [activeTab, topicsQuery.data, materialsQuery.data, capabilitiesQuery.data, assemblyMethodsQuery.data]);

  const items = (pageData?.items || []) as CatalogItem[];
  const activeTabConfig = CATALOG_TABS.find(t => t.id === activeTab);

  const openForm = (item: CatalogItem | null = null) => {
    setEditingItem(item);
    if (activeTab === 'capabilities') setIsCapaFormOpen(true);
    else if (activeTab === 'assembly-methods') setIsAssemblyFormOpen(true);
    else setIsBaseDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      switch (activeTab) {
        case 'topics': await topicRemove.mutateAsync(deletingId); break;
        case 'materials': await materialRemove.mutateAsync(deletingId); break;
        case 'capabilities': await capabilityRemove.mutateAsync(deletingId); break;
        case 'assembly-methods': await assemblyRemove.mutateAsync(deletingId); break;
      }
      setDeletingId(null);
      toast.success('Record deleted successfully');
    } catch (error) { handleErrorToast(error); }
  };

  const isComplex = activeTab === 'capabilities' || activeTab === 'assembly-methods';

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catalog Management</h1>
        <p className="text-muted-foreground mt-1">Configure and manage master data entities.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabKey)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-slate-100 rounded-xl">
          {CATALOG_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-8 flex items-center justify-between">
          <div><h2 className="text-xl font-semibold">{activeTabConfig?.label}</h2><p className="text-sm text-muted-foreground">{activeTabConfig?.description}</p></div>
          <Button onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" /> Add New {activeTabConfig?.label}</Button>
        </div>

        <TabsContent value={activeTab} className="mt-4 border rounded-xl bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
          ) : !items.length ? (
            <div className="p-12 text-center text-muted-foreground">No records found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-[30%] font-bold">Name & Slug</TableHead>
                  <TableHead className="w-[40%] font-bold">Description</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell><div className="font-medium text-foreground">{item.name}</div><div className="text-xs text-muted-foreground mt-0.5">{item.slug}</div></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.description || '-'}</TableCell>
                    <TableCell><Badge variant={item.isActive ? 'default' : 'secondary'} className={item.isActive ? "bg-green-100 text-green-700 border-none" : ""}>{item.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isComplex && (
                          <Button variant="outline" size="sm" onClick={() => {
                            setEditingItem(item);
                            if (activeTab === 'capabilities') setIsCapaDetailOpen(true);
                            else setIsAssemblyDetailOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2 text-purple-600" /> Detail
                          </Button>
                        )}
                        <Button variant={isComplex ? 'outline' : 'ghost'} size={isComplex ? 'sm' : 'icon'} onClick={() => openForm(item)}>
                          <Pencil className="h-4 w-4 text-blue-600" /> {isComplex && <span className="ml-2">Update</span>}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingId(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {isBaseDialogOpen && (
        <BaseItemDialog
          isOpen={isBaseDialogOpen}
          onClose={() => setIsBaseDialogOpen(false)}
          activeTab={activeTab as any}
          editingItem={editingItem}
          topicsList={topicsQuery.data?.items as TopicItem[]}
        />
      )}
      {isCapaFormOpen && (
        <CapabilityFormDialog
          isOpen={isCapaFormOpen}
          onClose={() => setIsCapaFormOpen(false)}
          editingItem={editingItem}
        />
      )}
            {isCapaDetailOpen && (
        <CapabilityDetailDialog
          isOpen={isCapaDetailOpen}
          onClose={() => setIsCapaDetailOpen(false)}
          capability={editingItem}
        />
      )}
      {isAssemblyFormOpen && (
        <AssemblyMethodFormDialog 
          isOpen={isAssemblyFormOpen} 
          onClose={() => setIsAssemblyFormOpen(false)} 
          editingItem={editingItem} 
        />
      )}

      {isAssemblyDetailOpen && (
        <AssemblyMethodDetailDialog
          isOpen={isAssemblyDetailOpen}
          onClose={() => setIsAssemblyDetailOpen(false)}
          method={editingItem}
        />
      )}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}