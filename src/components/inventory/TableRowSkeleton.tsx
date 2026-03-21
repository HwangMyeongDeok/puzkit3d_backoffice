import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function TableRowSkeleton() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="py-3 w-10" />
      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-[150px]" />
            <Skeleton className="h-3 w-[60px]" />
          </div>
        </div>
      </TableCell>
      <TableCell className="py-3"><Skeleton className="h-4 w-[40px] mx-auto" /></TableCell>
      <TableCell className="py-3"><Skeleton className="h-4 w-[60px] mx-auto" /></TableCell>
      <TableCell className="py-3"><Skeleton className="h-5 w-[70px] rounded-full" /></TableCell>
      <TableCell className="py-3 text-right pr-4">
        <div className="flex justify-end gap-1">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  );
}