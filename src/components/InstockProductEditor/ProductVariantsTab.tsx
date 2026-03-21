'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, PowerOff, CheckCircle, Loader2 } from 'lucide-react';
import type { InstockProductVariantDto } from '@/types/types';
import {
  useInstockProductVariants,
  useToggleInstockProductVariantStatus,
} from '@/hooks/useInstockProductQueries';
import { VariantSheet } from './VariantSheet';

interface ProductVariantsTabProps {
  productId: string;
}

export function ProductVariantsTab({ productId }: ProductVariantsTabProps) {
  const [variantSheetOpen, setVariantSheetOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<InstockProductVariantDto | null>(null);
  const [variantToDeactivate, setVariantToDeactivate] = useState<InstockProductVariantDto | null>(null);

  const { data: variants, isLoading } = useInstockProductVariants(productId);
  const toggleMutation = useToggleInstockProductVariantStatus();

  const handleCreateVariant = () => {
    setEditingVariant(null);
    setVariantSheetOpen(true);
  };

  const handleEditVariant = (variant: InstockProductVariantDto) => {
    setEditingVariant(variant);
    setVariantSheetOpen(true);
  };

  // Deactivate requires confirm; activate does not
  const handleConfirmDeactivate = async () => {
    if (!variantToDeactivate) return;
    try {
      await toggleMutation.mutateAsync({
        productId,
        variantId: variantToDeactivate.id,
        isActive: variantToDeactivate.isActive,
      });
      toast.success('Variant deactivated');
    } catch {
      toast.error('Failed to deactivate variant');
    } finally {
      setVariantToDeactivate(null);
    }
  };

  const handleActivate = async (variant: InstockProductVariantDto) => {
    try {
      await toggleMutation.mutateAsync({
        productId,
        variantId: variant.id,
        isActive: variant.isActive,
      });
      toast.success('Variant activated');
    } catch {
      toast.error('Failed to activate variant');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Product Variants</h2>
          <p className="text-sm text-muted-foreground">
            Manage colors, dimensions, and status for this product
          </p>
        </div>
        <Button onClick={handleCreateVariant} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Variant
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !variants || variants.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground mb-4">No variants yet</p>
              <Button onClick={handleCreateVariant} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Variant
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Dimensions (mm)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                      <TableCell>{variant.color}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {variant.assembledLengthMm} × {variant.assembledWidthMm} × {variant.assembledHeightMm}
                      </TableCell>
                      <TableCell>
                        <Badge variant={variant.isActive ? 'default' : 'secondary'}>
                          {variant.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditVariant(variant)}
                            title="Edit variant"
                            disabled={toggleMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {variant.isActive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setVariantToDeactivate(variant)}
                              title="Deactivate variant"
                              disabled={toggleMutation.isPending}
                              className="text-destructive hover:text-destructive"
                            >
                              <PowerOff className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActivate(variant)}
                              title="Activate variant"
                              disabled={toggleMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variant Sheet (Create / Edit) */}
      <VariantSheet
        open={variantSheetOpen}
        onOpenChange={setVariantSheetOpen}
        productId={productId}
        variant={editingVariant}
      />

      {/* Deactivate Confirm Dialog */}
      <AlertDialog
        open={!!variantToDeactivate}
        onOpenChange={(open) => !open && setVariantToDeactivate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate variant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate variant <strong>{variantToDeactivate?.sku}</strong>.
              You can reactivate it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDeactivate(); }}
              disabled={toggleMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {toggleMutation.isPending ? 'Processing...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}