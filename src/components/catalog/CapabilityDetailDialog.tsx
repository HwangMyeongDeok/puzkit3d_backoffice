import React from 'react';
import { Layers3, Package, Shapes, ArrowRight, Cpu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { useAssignedTopicMaterials, useAssignedCapabilityDrives } from '@/hooks/useCatalogQueries';
import type { CatalogItem, AssignedTopicMaterialItem, AssignedCapabilityDriveItem } from '@/services/catalogApi';

interface CapabilityDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  capability: CatalogItem | null;
}

export function CapabilityDetailDialog({ isOpen, onClose, capability }: CapabilityDetailDialogProps) {
  const assignedDataQuery = useAssignedTopicMaterials(capability?.id || '');
  const assignedDrivesQuery = useAssignedCapabilityDrives(capability?.id || '');

  if (!capability) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Changed bg-slate-50/50 to solid bg-slate-50 */}
      <DialogContent className="sm:max-w-[700px] bg-slate-50 p-0 overflow-hidden border-none shadow-lg">
        <div className="bg-white px-6 py-5 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Layers3 className="h-6 w-6 text-purple-600" />
                {capability.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Detailed capability configurations</p>
            </div>
            <Badge 
              variant={capability.isActive ? 'default' : 'secondary'} 
              className={capability.isActive ? "bg-green-100 text-green-700 border-none" : ""}
            >
              {capability.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-slate-500 uppercase flex items-center gap-2 tracking-wider">
              Basic Information
            </h4>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <span className="text-slate-400 block mb-1">Slug</span>
                <div className="font-mono bg-slate-100 px-2 py-1 rounded inline-block">
                  {capability.slug}
                </div>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Factor Percentage</span>
                <div className="font-semibold text-blue-600 text-lg">
                  {(capability as any).factorPercentage ?? 0}%
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block mb-1">Description</span>
                <div className="text-slate-700 leading-relaxed">
                  {capability.description || <span className="italic text-slate-400">No description provided.</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Drives */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Assigned Drives</h4>
            <div className="flex flex-wrap gap-2">
              {assignedDrivesQuery.isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : !(assignedDrivesQuery.data as AssignedCapabilityDriveItem[])?.length ? (
                <span className="text-sm text-slate-400 italic">No drives assigned.</span>
              ) : (
                (assignedDrivesQuery.data as AssignedCapabilityDriveItem[]).map((assign) => (
                  <Badge 
                    key={assign.id} 
                    variant="outline" 
                    className="bg-indigo-50 text-indigo-700 border-indigo-100 px-3 py-1.5 flex items-center gap-2"
                  >
                    <Cpu className="w-4 h-4" /> {assign.drive?.name}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Topic-Material */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Material Allowances</h4>
            {assignedDataQuery.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : !(assignedDataQuery.data as AssignedTopicMaterialItem[])?.length ? (
              <div className="p-6 text-center border border-dashed rounded-xl text-slate-400 bg-slate-50 text-sm">
                No rules configured.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(assignedDataQuery.data as AssignedTopicMaterialItem[]).map((assign) => (
                  <div 
                    key={assign.id} 
                    className={`p-3 border rounded-lg flex items-center gap-3 text-sm ${
                      assign.isActive ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 opacity-50 border-slate-100'
                    }`}
                  >
                    <div className="font-semibold text-slate-700 flex items-center gap-2">
                      <Shapes className="h-4 w-4 text-purple-500" /> {(assign as any).topic?.name}
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                    <div className="text-slate-600 flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-500" /> {(assign as any).material?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}