import { useState, useCallback } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useInstockProducts } from "@/hooks/useInstockProductQueries";
import { ProductRow } from "@/components/inventory/ProductRow";
import { Pagination } from "@/components/inventory/Pagination"; 
import { TableRowSkeleton } from "@/components/inventory/TableRowSkeleton";

const PAGE_SIZE = 10;

export function InventoryManagementPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading } = useInstockProducts({
    pageNumber: page, 
    pageSize: PAGE_SIZE,
    searchTerm: search,
  });

  const handleToggle = useCallback((productId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">View variants and real-time stock</p>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search SKU or name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <Select value={difficulty} onValueChange={(val) => { setDifficulty(val); setPage(1); }}>
          <SelectTrigger className="h-8 w-[160px] text-sm">
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="Basic">Basic</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-10 pl-4" />
              <TableHead className="text-xs font-semibold uppercase">Product</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-center">Pieces</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-center">Assembly Time</TableHead>
              <TableHead className="text-xs font-semibold uppercase">Difficulty</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
            ) : data?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isExpanded={expandedRows.has(product.id)}
                  onToggle={handleToggle}
                />
              ))
            )}
          </TableBody>
        </Table>

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          totalCount={data?.totalCount || 0}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}