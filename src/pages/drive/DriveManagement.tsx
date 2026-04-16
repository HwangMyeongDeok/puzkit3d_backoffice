import React, { useState } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Pencil, Trash2, Loader2, HardDrive } from 'lucide-react';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
} from '@/components/ui/dialog';
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

// Hooks & Types
import { 
  useDrives, 
  useCreateDrive, 
  useUpdateDrive, 
  useDeleteDrive 
} from '@/hooks/useMasterDataQueries';
import type { Drive } from '@/types/types';

// ─── UPDATED ZOD SCHEMA ───
const driveSchema = z.object({
  name: z.string().min(1, 'Drive name is required'),
  description: z.string().optional().nullable(),
  minVolume: z.number({ message: 'Please enter a valid number' }).min(0, 'Must be greater than or equal to 0'),
  quantityInStock: z.number({ message: 'Please enter a valid number' }).min(0, 'Must be greater than or equal to 0'),
  isActive: z.boolean(), 
});

type DriveFormValues = z.infer<typeof driveSchema>;

export default function DriveManagement() {
  // ─── HOOKS ───
  const { data: drives = [], isLoading: isFetching } = useDrives();
  
  const createMutation = useCreateDrive();
  const updateMutation = useUpdateDrive();
  const deleteMutation = useDeleteDrive();

  // ─── STATE ───
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDrive, setEditingDrive] = useState<Drive | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── FORM SETUP ───
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<DriveFormValues>({
    resolver: zodResolver(driveSchema),
    defaultValues: { 
      name: '', 
      description: '',
      minVolume: 0,
      quantityInStock: 0,
      isActive: true
    },
  });

  // ─── HANDLERS ───
  const openModal = (drive?: Drive): void => {
    if (drive) {
      setEditingDrive(drive);
      reset({ 
        name: drive.name, 
        description: drive.description ?? '',
        minVolume: drive.minVolume ?? 0,
        quantityInStock: drive.quantityInStock ?? 0,
        isActive: drive.isActive ?? true,
      });
    } else {
      setEditingDrive(null);
      reset({ 
        name: '', 
        description: '',
        minVolume: 0,
        quantityInStock: 0,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setEditingDrive(null);
    reset();
  };

  const onSubmit: SubmitHandler<DriveFormValues> = (data) => {
    if (editingDrive) {
      updateMutation.mutate(
        { id: editingDrive.id, data },
        { onSuccess: closeModal }
      );
    } else {
      createMutation.mutate(data, { onSuccess: closeModal });
    }
  };

  const confirmDelete = (): void => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => setDeletingId(null),
      });
    }
  };

  const isMutating: boolean = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">
      {/* ─── HEADER ─── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Drive Management</h1>
          <p className="text-muted-foreground mt-1">Configure and manage system drives.</p>
        </div>
        <Button onClick={() => openModal()} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Drive</span>
        </Button>
      </div>

      {/* ─── TABLE ─── */}
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[20%]">Drive Name</TableHead>
              <TableHead className="w-[30%]">Description</TableHead>
              <TableHead className="w-[15%] text-right">Min Volume</TableHead>
              <TableHead className="w-[15%] text-right">In Stock</TableHead>
              <TableHead className="w-[10%] text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-1/2 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : drives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <HardDrive className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="font-medium text-foreground">No Drives Found</p>
                    <p className="text-sm mt-1">Click "Add Drive" to create your first record.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              drives.map((drive: Drive) => (
                <TableRow key={drive.id} className="group">
                  <TableCell className="font-medium text-foreground">
                    {drive.name}
                  </TableCell>
                  <TableCell 
  className="text-muted-foreground truncate max-w-[200px]" 
  title={drive.description ?? undefined} 
>
  {drive.description || '—'}
</TableCell>
                  <TableCell className="text-right font-medium">
                    {drive.minVolume ?? 0}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {drive.quantityInStock ?? 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={drive.isActive ? 'default' : 'secondary'} 
                      className={drive.isActive ? "bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none" : "shadow-none"}
                    >
                      {drive.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openModal(drive)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setDeletingId(drive.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── CREATE/EDIT MODAL ─── */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingDrive ? 'Update Drive' : 'Create New Drive'}</DialogTitle>
            <DialogDescription>
              {editingDrive ? 'Edit the details of this drive.' : 'Add a new drive to the system catalog.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Drive Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Front Wheel Drive"
                className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.name && <p className="text-sm font-medium text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter detailed description..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minVolume">Min Volume</Label>
                <Input
                  id="minVolume"
                  type="number"
                  min="0"
                  {...register('minVolume', { valueAsNumber: true })}
                  className={errors.minVolume ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.minVolume && <p className="text-sm font-medium text-destructive">{errors.minVolume.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantityInStock">Quantity in Stock</Label>
                <Input
                  id="quantityInStock"
                  type="number"
                  min="0"
                  {...register('quantityInStock', { valueAsNumber: true })}
                  className={errors.quantityInStock ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.quantityInStock && <p className="text-sm font-medium text-destructive">{errors.quantityInStock.message}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg mt-2 bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">Active Status</Label>
                <p className="text-xs text-muted-foreground">Enable to allow using this drive.</p>
              </div>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeModal} disabled={isMutating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingDrive ? 'Save Changes' : 'Create Drive'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE ALERT ─── */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This drive data will be permanently deleted from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Drive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}