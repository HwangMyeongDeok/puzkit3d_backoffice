import React from 'react';
import { Boxes, Package, Layers3, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { useAssignedCapabilityMaterials } from '@/hooks/useCatalogQueries';
import type { CatalogItem } from '@/services/catalogApi';

interface AssemblyMethodDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  method: CatalogItem | null;
}

export function AssemblyMethodDetailDialog({ isOpen, onClose, method }: AssemblyMethodDetailDialogProps) {
  const assignedDataQuery = useAssignedCapabilityMaterials(method?.id || '');

  if (!method) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Background uses solid bg-slate-50, no transparency */}
      <DialogContent className="sm:max-w-[700px] bg-slate-50 p-0 overflow-hidden shadow-lg border-none">
        <div className="bg-white px-6 py-5 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Boxes className="h-6 w-6 text-blue-600" />
                {method.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Assembly method configuration details</p>
            </div>
            <Badge variant={method.isActive ? 'default' : 'secondary'} className={method.isActive ? "bg-green-100 text-green-700" : ""}>
              {method.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Basic Information</h4>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div><span className="text-slate-400 block mb-1">Slug Identifier</span><div className="font-mono bg-slate-100 px-2 py-1 rounded inline-block">{method.slug}</div></div>
              <div className="col-span-2"><span className="text-slate-400 block mb-1">Description</span><div className="text-slate-700 leading-relaxed">{method.description || <span className="italic text-slate-400">No description provided.</span>}</div></div>
            </div>
          </div>

          {/* Capa - Material Constraints */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Allowed Capabilities & Materials</h4>
            {assignedDataQuery.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : !assignedDataQuery.data?.length ? (
              <div className="p-6 text-center border rounded-xl border-dashed text-slate-400 bg-slate-50 text-sm">No rules configured yet.</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {assignedDataQuery.data.map((assign: any) => (
                  <div key={assign.id} className={`p-3 border rounded-lg flex items-center gap-4 ${assign.isActive ? 'bg-slate-50' : 'bg-slate-50 opacity-50'}`}>
                    <div className="font-semibold text-slate-700 flex items-center gap-2 flex-1">
                      <Layers3 className="h-4 w-4 text-purple-500" /> {assign.capability?.name || 'N/A'}
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                    <div className="text-slate-600 flex items-center gap-2 flex-1">
                      <Package className="h-4 w-4 text-blue-500" /> {assign.material?.name || 'N/A'}
                    </div>
                    {!assign.isActive && <Badge variant="secondary">Disabled</Badge>}
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