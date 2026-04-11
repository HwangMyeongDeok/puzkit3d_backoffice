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
    if (!confirm("Deleting this template may affect old orders. Continue?")) return;

    toast.promise(deleteMutation.mutateAsync(id), {
      loading: 'Deleting...',
      success: 'Deleted successfully!',
      error: 'Failed to delete.',
    });
  };

  return (
    <div className="container mx-auto py-10 px-4 space-y-6">
      <RequirementHeader onAddNew={handleAddNew} />

      <RequirementTable 
        requirements={requirements} 
        isLoading={isLoading} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      <RequirementFormSheet 
        isOpen={isOpen} 
        onOpenChange={setIsOpen} 
        selectedReq={selectedReq} 
      />
    </div>
  );
};

export default RequirementManagement;