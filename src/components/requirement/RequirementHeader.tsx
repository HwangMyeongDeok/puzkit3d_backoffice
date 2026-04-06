import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RequirementHeaderProps {
  onAddNew: () => void;
}

export const RequirementHeader = ({ onAddNew }: RequirementHeaderProps) => {
  return (
    <div className="flex justify-between items-end">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Requirement Management</h1>
        <p className="text-muted-foreground">Thiết lập danh mục kỹ thuật cho khách hàng đặt hàng.</p>
      </div>
      <Button onClick={onAddNew} className="gap-2">
        <Plus className="w-4 h-4" /> Tạo mẫu mới
      </Button>
    </div>
  );
};