import { Pencil, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type CustomDesignRequirement } from "@/types/types";

interface RequirementTableProps {
  requirements?: CustomDesignRequirement[];
  isLoading: boolean;
  onEdit: (req: CustomDesignRequirement) => void;
  onDelete: (id: string) => void;
}

const getDifficultyColor = (diff: string) => {
  switch (diff) {
    case "Basic": return "bg-sky-50 text-sky-700 border-sky-200";
    case "Intermediate": return "bg-amber-50 text-amber-700 border-amber-200";
    case "Advanced": return "bg-orange-50 text-orange-700 border-orange-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getDifficultyLabel = (diff: string) => {
  switch (diff) {
    case "Basic": return "Cơ bản";
    case "Intermediate": return "Trung cấp";
    case "Advanced": return "Nâng cao";
    default: return diff;
  }
};

export const RequirementTable = ({ requirements, isLoading, onEdit, onDelete }: RequirementTableProps) => {
  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Mã Code</TableHead>
            <TableHead>Độ khó</TableHead>
            <TableHead>Số lượng Part</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : requirements?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Chưa có dữ liệu. Hãy tạo mẫu đầu tiên!
              </TableCell>
            </TableRow>
          ) : (
            requirements?.map((req) => (
              <TableRow key={req.id} className="group">
                <TableCell className="font-mono font-bold text-primary">{req.code}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getDifficultyColor(req.difficulty)}>
                    {getDifficultyLabel(req.difficulty)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {req.minPartQuantity} - {req.maxPartQuantity} đơn vị
                </TableCell>
                <TableCell>
                  {req.isActive ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1 border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 opacity-60">
                      <XCircle className="w-3 h-3" /> Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(req)}>
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(req.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};