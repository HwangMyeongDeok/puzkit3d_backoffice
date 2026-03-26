import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Loader2, Search } from 'lucide-react'; // Thêm icon Search
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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

import { useParts, useCreatePart, useUpdatePart, useDeletePart } from '@/hooks/usePartQueries';
import type { Part, PartType, PartRequest } from '@/types/types';

interface ProductPartsTabProps {
  productId: string;
}

const PART_TYPES: PartType[] = ['Structural', 'Mechanical', 'Decorative'];

export function ProductPartsTab({ productId }: ProductPartsTabProps) {
  // --- HOOKS ---
  const { data: parts = [], isLoading } = useParts(productId);
  const createMutation = useCreatePart(productId);
  const updateMutation = useUpdatePart(productId);
  const deleteMutation = useDeletePart(productId);

  // --- STATES ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [partToDelete, setPartToDelete] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<PartType | 'All'>('All');

  // Form States
  const [name, setName] = useState('');
  const [partType, setPartType] = useState<PartType>('Structural');
  const [quantity, setQuantity] = useState<number>(1);

  // --- FILTER LOGIC (Client-side) ---
  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      // 1. Lọc theo tên hoặc mã code
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        part.name.toLowerCase().includes(searchLower) ||
        part.code.toLowerCase().includes(searchLower);

      // 2. Lọc theo loại (Type)
      const matchesType = filterType === 'All' || part.partType === filterType;

      return matchesSearch && matchesType;
    });
  }, [parts, searchQuery, filterType]);

  // --- HANDLERS ---
  const handleOpenDialog = (part?: Part) => {
    if (part) {
      setEditingPart(part);
      setName(part.name);
      setPartType(part.partType);
      setQuantity(part.quantity);
    } else {
      setEditingPart(null);
      setName('');
      setPartType('Structural');
      setQuantity(1);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPart(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: PartRequest = { name, partType, quantity };

    if (editingPart) {
      updateMutation.mutate(
        { partId: editingPart.id, payload },
        { onSuccess: handleCloseDialog }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: handleCloseDialog });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // --- RENDER ---
  return (
    <div className="space-y-4">
      {/* Header & Nút Add */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Product Parts</h3>
          <p className="text-sm text-muted-foreground">
            Manage components and pieces that make up this product.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Part
        </Button>
      </div>

      {/* --- THANH CÔNG CỤ FILTER --- */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/50 p-3 rounded-lg border">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or code..."
            className="pl-8 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as PartType | 'All')}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              {PART_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Danh Sách Parts */}
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : parts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No parts found. Click "Add Part" to create one.
                </TableCell>
              </TableRow>
            ) : filteredParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No parts match your filter criteria. Try adjusting your search.
                </TableCell>
              </TableRow>
            ) : (
              // Chỗ này map qua mảng filteredParts thay vì parts
              filteredParts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell className="font-medium">{part.code}</TableCell>
                  <TableCell>{part.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{part.partType}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{part.quantity}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(part)}
                      disabled={deleteMutation.isPending}
                    >
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPartToDelete(part.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingPart ? 'Edit Part' : 'Add New Part'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Part Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Red Wheel 40mm"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Part Type</Label>
                <Select
                  value={partType}
                  onValueChange={(value) => setPartType(value as PartType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PART_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPart ? 'Save Changes' : 'Create Part'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Xác Nhận Xóa */}
      <AlertDialog open={!!partToDelete} onOpenChange={(open) => !open && setPartToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the part from this product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (partToDelete) {
                  deleteMutation.mutate(partToDelete, {
                    onSettled: () => setPartToDelete(null),
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}