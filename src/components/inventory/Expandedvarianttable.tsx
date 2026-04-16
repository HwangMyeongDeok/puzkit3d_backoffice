import { useState } from "react";
import { Pencil, PackagePlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageX } from "lucide-react";
import { useVariantsWithInventory } from "@/hooks/useVariantsWithInventoryQueries";
import {
  EditInventoryDialog,
  type InventoryDialogVariant,
} from "@/components/inventory/Editinventorydialog";

interface InstockProductVariant {
  id: string;
  sku: string;
  color: string;
  assembledLengthMm: number;
  assembledWidthMm: number;
  assembledHeightMm: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VariantWithInventory extends InstockProductVariant {
  stockQuantity: number | undefined;
  hasNoInventory: boolean;
}

interface ExpandedVariantTableProps {
  productId: string;
}

function VariantTableSkeleton() {
  return (
    <div className="px-4 py-3 space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-[140px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-5 w-[70px] rounded-full" />
          <Skeleton className="h-7 w-7 rounded-md ml-auto" />
        </div>
      ))}
    </div>
  );
}

function EmptyVariants() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
      <PackageX className="h-8 w-8 opacity-40" />
      <p className="text-sm">This product has no variants yet.</p>
    </div>
  );
}

function StockBadge({
  quantity,
  hasNoInventory,
}: {
  quantity: number | undefined;
  hasNoInventory: boolean;
}) {
  if (hasNoInventory || quantity === undefined) {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs gap-1"
      >
        Not set
      </Badge>
    );
  }
  if (quantity === 0) {
    return (
      <Badge variant="destructive" className="font-semibold text-xs">
        Out of stock
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold tabular-nums text-xs">
      {quantity.toLocaleString("vi-VN")}
    </Badge>
  );
}

export function ExpandedVariantTable({ productId }: ExpandedVariantTableProps) {
  const { data: variants, isLoading } = useVariantsWithInventory(
    productId,
    true
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] =
    useState<InventoryDialogVariant | null>(null);

  const handleOpenEdit = (variant: VariantWithInventory) => {
    setSelectedVariant({
      id: variant.id,
      sku: variant.sku,
      color: variant.color,
      stockQuantity: variant.stockQuantity,
      hasNoInventory: variant.hasNoInventory,
    });
    setDialogOpen(true);
  };

  if (isLoading) return <VariantTableSkeleton />;

  if (!variants || variants.length === 0) return <EmptyVariants />;

  return (
    <>
      <div className="border-t border-dashed border-border/60 bg-muted/30">
        <div className="px-3 py-2 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Variants &amp; Inventory
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">
            {variants.length}
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="pl-6 text-xs font-semibold text-muted-foreground">
                Color
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                SKU
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Dimensions (L × W × H)
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Stock
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground text-right pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {(variants as VariantWithInventory[]).map((variant) => (
              <TableRow
                key={variant.id}
                className="hover:bg-muted/50 border-border/30 transition-colors"
              >
                <TableCell className="pl-6 py-2.5">
                  <span className="text-sm font-medium text-foreground">
                    {variant.color || (
                      <span className="italic text-muted-foreground">—</span>
                    )}
                  </span>
                </TableCell>

                <TableCell className="py-2.5">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                    {variant.sku}
                  </code>
                </TableCell>

                <TableCell className="py-2.5">
                  <span className="text-sm text-foreground tabular-nums">
                    {variant.assembledLengthMm} × {variant.assembledWidthMm} ×{" "}
                    {variant.assembledHeightMm}
                    <span className="ml-1 text-xs text-muted-foreground">
                      mm
                    </span>
                  </span>
                </TableCell>

                <TableCell className="py-2.5">
                  {variant.isActive ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-muted-foreground/30 bg-muted/30 text-muted-foreground text-xs"
                    >
                      Inactive
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="py-2.5">
                  <StockBadge
                    quantity={variant.stockQuantity}
                    hasNoInventory={variant.hasNoInventory}
                  />
                </TableCell>

                <TableCell className="py-2.5 text-right pr-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => handleOpenEdit(variant)}
                    aria-label={
                      variant.hasNoInventory
                        ? "Create inventory for this variant"
                        : "Edit inventory"
                    }
                  >
                    {variant.hasNoInventory ? (
                      <PackagePlus className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <Pencil className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditInventoryDialog
        key={selectedVariant?.id || "empty"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productId={productId}
        variant={selectedVariant}
      />
    </>
  );
}