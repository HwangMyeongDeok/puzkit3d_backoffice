import { useEffect, useRef, useState } from "react";
import { Loader2, PackagePlus, RotateCcw, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useCreateInventory,
  useResetInventory,
  useUpdateInventory,
} from "@/hooks/useInventoryMutations";


export interface InventoryDialogVariant {
  id: string;
  sku: string;
  color: string;
  stockQuantity: number | undefined;
  hasNoInventory: boolean;
}

interface EditInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variant: InventoryDialogVariant | null;
}

export function EditInventoryDialog({
  open,
  onOpenChange,
  productId,
  variant,
}: EditInventoryDialogProps) {
const [quantity, setQuantity] = useState<string>(
    variant?.hasNoInventory || variant?.stockQuantity === undefined
      ? ""
      : String(variant.stockQuantity)
  );  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateInventory();
  const updateMutation = useUpdateInventory(productId);
  const resetMutation = useResetInventory(productId);

  const isCreating = variant?.hasNoInventory ?? false;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isResetting = resetMutation.isPending;

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const handleClose = () => {
    if (isSaving || isResetting) return;
    onOpenChange(false);
    setShowResetConfirm(false);
    setQuantity("");
  };

  const handleSave = async () => {
    if (!variant) return;

    const parsed = parseInt(quantity, 10);
    if (isNaN(parsed) || parsed < 0) return;

    if (isCreating) {
      try {
        await createMutation.mutateAsync({
          productId: productId,
          variantId: variant.id,
          quantity: parsed,
        });
        handleClose();
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 409) {
          await updateMutation.mutateAsync({
            variantId: variant.id,
            quantity: parsed,
          });
          handleClose();
        }
      }
    } else {
      await updateMutation.mutateAsync({
        variantId: variant.id,
        quantity: parsed,
      });
      handleClose();
    }
  };

  const handleReset = async () => {
    if (!variant) return;
    await resetMutation.mutateAsync({ variantId: variant.id });
    setShowResetConfirm(false);
    handleClose();
  };

  const parsed = parseInt(quantity, 10);
  const isInvalid = quantity !== "" && (isNaN(parsed) || parsed < 0);
  const isEmpty = quantity.trim() === "";
  const isUnchanged =
    !isCreating &&
    !isEmpty &&
    !isNaN(parsed) &&
    parsed === variant?.stockQuantity;

  if (!variant) return null;

  return (
    <>
      <Dialog open={open && !showResetConfirm} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isCreating ? (
                <>
                  <PackagePlus className="h-4 w-4 text-primary" />
                  Create Inventory
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 text-primary" />
                  Update Inventory
                </>
              )}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-2 pt-1">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                  {variant.sku}
                </code>
                {variant.color && (
                  <span className="text-sm text-muted-foreground">
                    — {variant.color}
                  </span>
                )}
                {isCreating && (
                  <Badge
                    variant="outline"
                    className="ml-auto border-amber-500/40 bg-amber-500/10 text-amber-600 text-xs"
                  >
                    No Inventory
                  </Badge>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-sm">
                Stock Quantity
              </Label>
              <Input
                id="quantity"
                ref={inputRef}
                type="number"
                min={0}
                placeholder={isCreating ? "Nhập số lượng ban đầu..." : "0"}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSaving && !isEmpty && !isInvalid && !isUnchanged) {
                    handleSave();
                  }
                }}
                className={
                  isInvalid ? "border-destructive focus-visible:ring-destructive" : ""
                }
              />
              {isInvalid && (
                <p className="text-xs text-destructive">
                  Quantity must be a non-negative integer.
                </p>
              )}
              {isUnchanged && (
                <p className="text-xs text-muted-foreground">
                  Quantity has not changed.
                </p>
              )}
            </div>

            {!isCreating && variant.stockQuantity !== undefined && (
              <div className="rounded-md border border-border/50 bg-muted/40 px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Current Stock
                </span>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    variant.stockQuantity === 0
                      ? "text-destructive"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {variant.stockQuantity.toLocaleString("vi-VN")}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center gap-2 sm:justify-between">
            {!isCreating && (variant.stockQuantity ?? 0) > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                onClick={() => setShowResetConfirm(true)}
                disabled={isSaving || isResetting}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to 0
              </Button>
            ) : (
              <div /> // spacer để giữ layout
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isSaving || isResetting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || isEmpty || isInvalid || isUnchanged}
                className="min-w-[80px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : isCreating ? (
                  "Create"
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset inventory to 0?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p>
                  This action will set the entire stock quantity of the variant
                </p>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
                  {variant.sku}
                </code>
                <p>{" "}
                  <span className="font-semibold text-destructive">0</span>.
                  Cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={isResetting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground min-w-[80px]"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}