import { useState } from "react";
import { toast } from "sonner";

import { useRequirements } from "@/hooks/useCustomDesignRequirementQueries"; 
import { type CustomDesignRequirement } from "@/types/types";

import { RequirementHeader } from "@/components/requirement/RequirementHeader";
import { RequirementTable } from "@/components/requirement/RequirementTable";
import { RequirementFormSheet } from "@/components/requirement/RequirementFormSheet";

const RequirementManagement = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<CustomDesignRequirement | null>(null);

  const { useGetAllRequirements, useDeleteRequirement } = useRequirements();
  const { data: requirements, isLoading } = useGetAllRequirements();
  const deleteMutation = useDeleteRequirement();

  const handleAddNew = () => {
    setSelectedReq(null);
    setIsOpen(true);
  };

  const handleEdit = (req: CustomDesignRequirement) => {
    setSelectedReq(req);
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Xóa mẫu này có thể ảnh hưởng đến các đơn hàng cũ. Tiếp tục?")) return;

    toast.promise(deleteMutation.mutateAsync(id), {
      loading: 'Đang xóa...',
      success: 'Đã gỡ bỏ mẫu thiết kế!',
      error: 'Không thể xóa mẫu này.',
    });
  };

  return (
    <div className="container mx-auto py-10 px-4 space-y-6">
      {/* 1. Header */}
      <RequirementHeader onAddNew={handleAddNew} />

      {/* 2. Table Section */}
      <RequirementTable 
        requirements={requirements} 
        isLoading={isLoading} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      {/* 3. Form Slide-over */}
      <RequirementFormSheet 
        isOpen={isOpen} 
        onOpenChange={setIsOpen} 
        selectedReq={selectedReq} 
      />
    </div>
  );
};

export default RequirementManagement;