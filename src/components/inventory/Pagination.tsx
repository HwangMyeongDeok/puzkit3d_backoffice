import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, totalCount, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
      <p className="text-xs text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> / {totalPages} 
        <span className="mx-2">—</span> Total {totalCount} products
      </p>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹ Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next ›
        </Button>
      </div>
    </div>
  );
}