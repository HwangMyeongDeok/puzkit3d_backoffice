import { useState } from 'react';
import { Plus, GripVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProductionTemplatePage() {
  // Tạm thời dùng State để lưu id của Milestone đang được chọn
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(1);

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Production Template</h1>
        <p className="text-sm text-muted-foreground">Manage default Milestones and Phases for production workflows.</p>
      </div>

      {/* KHUNG CHIA 2 CỘT */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* ── CỘT TRÁI: MILESTONES (40%) ── */}
        <div className="flex w-2/5 flex-col rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-semibold">Milestones</h2>
            <Button size="sm" className="h-8 gap-1">
              <Plus className="h-4 w-4" /> Add Milestone
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {/* Mock 1 item Milestone */}
            <div 
              onClick={() => setSelectedMilestoneId(1)}
              className={`mb-2 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                selectedMilestoneId === 1 ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50'
              }`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">1. 3D Printing</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">Print the actual model using resin.</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3 w-3" /></Button>
              </div>
            </div>

            {/* Mock 1 item khác chưa được chọn */}
            <div 
              onClick={() => setSelectedMilestoneId(2)}
              className={`mb-2 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                selectedMilestoneId === 2 ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50'
              }`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">2. Painting & Coating</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">Apply base colors and clear coat.</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── CỘT PHẢI: PHASES (60%) ── */}
        <div className="flex w-3/5 flex-col rounded-xl border bg-card shadow-sm">
          {selectedMilestoneId ? (
            <>
              <div className="flex items-center justify-between border-b p-4 bg-muted/20">
                <div>
                  <h2 className="font-semibold">Phases for "3D Printing"</h2>
                  <p className="text-xs text-muted-foreground">Define sub-tasks for this milestone.</p>
                </div>
                <Button size="sm" variant="secondary" className="h-8 gap-1">
                  <Plus className="h-4 w-4" /> Add Phase
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                 {/* Mock 1 item Phase */}
                 <div className="mb-3 flex items-center gap-3 rounded-lg border bg-background p-3 shadow-sm">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">1.1. File Preparation</h3>
                      <p className="text-xs text-muted-foreground mt-1">Slice the .glb file and add supports.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8">Edit</Button>
                      <Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                 </div>
                 
                 <div className="mb-3 flex items-center gap-3 rounded-lg border bg-background p-3 shadow-sm">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">1.2. Resin Printing</h3>
                      <p className="text-xs text-muted-foreground mt-1">Run the 3D printer for 5 hours.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8">Edit</Button>
                      <Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                 </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
               <p>Please select a Milestone on the left to manage its Phases.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}