import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useInstockProducts,
} from '@/hooks/useInstockProductQueries';

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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, CheckCircle, XCircle, Edit, PowerOff } from 'lucide-react';
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
import { toast } from 'sonner';
import { useToggleInstockProductStatus } from '@/hooks/useInstockProductQueries';

export function InstockProductsPage() {
  const navigate = useNavigate();

  // --- States cho Filter & Pagination ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Tách riêng input và term để khi enter mới search
  const [pageNumber, setPageNumber] = useState(1);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);

  // --- Fetch Data bằng TanStack Query (Đồng bộ với 2 file trước) ---
  const { data, isLoading, error } = useInstockProducts({
    pageNumber,
    pageSize: 10,
    searchTerm: searchTerm || undefined,
    isActive: isActiveFilter,
  });

  const toggleMutation = useToggleInstockProductStatus();
  
  const [productToToggle, setProductToToggle] = useState<{ id: string; name: string; isActive: boolean } | null>(null);

  // --- Handlers ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setPageNumber(1);
  };

  const handleEditClick = (productId: string) => {
    navigate(`/instock-products/${productId}/edit`);
  };

  const handleCreateNew = () => {
    navigate('/instock-products/new');
  };

  const handleConfirmToggle = async () => {
    if (!productToToggle) return;
    try {
      await toggleMutation.mutateAsync({
        id: productToToggle.id,
        isActive: productToToggle.isActive,
      });
      toast.success(`Product ${productToToggle.isActive ? 'deactivated' : 'activated'} successfully.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product status');
    } finally {
      setProductToToggle(null);
    }
  };


  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instock Products</h1>
          <p className="text-muted-foreground">Manage your instock product catalog and variants.</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border">
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-1/2">
          <Input
            placeholder="Search by name, code..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-background"
          />
          <Button type="submit" variant="secondary" className="gap-2">
            <Search className="h-4 w-4" /> Search
          </Button>
        </form>

        <div className="flex gap-2">
          <Button
            variant={isActiveFilter === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => { setIsActiveFilter(undefined); setPageNumber(1); }}
          >
            All
          </Button>
          <Button
            variant={isActiveFilter === true ? "default" : "outline"}
            size="sm"
            onClick={() => { setIsActiveFilter(true); setPageNumber(1); }}
          >
            Active
          </Button>
          <Button
            variant={isActiveFilter === false ? "default" : "outline"}
            size="sm"
            onClick={() => { setIsActiveFilter(false); setPageNumber(1); }}
          >
            Inactive
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          Error loading products: {(error as Error).message}
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Code</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Level & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-md" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : !data?.items || data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.code || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {p.thumbnailUrl ? (
                        <img src={p.thumbnailUrl} alt={p.name} className="h-10 w-10 rounded-md object-cover border" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs">No img</div>
                      )}
                      <div>
                        <p className="font-medium leading-tight">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.description || 'No description'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <p className="font-medium">{p.difficultLevel}</p>
                      <p className="text-muted-foreground">{p.estimatedBuildTime} min</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.isActive ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 flex w-fit items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="opacity-70 flex w-fit items-center gap-1">
                        <XCircle className="h-3 w-3" /> Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="default" size="sm" onClick={() => handleEditClick(p.id)} disabled={toggleMutation.isPending}>
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button 
                        variant={p.isActive ? "destructive" : "secondary"}
                        size="sm" 
                        onClick={() => setProductToToggle({ id: p.id, name: p.name, isActive: p.isActive })}
                        disabled={toggleMutation.isPending}
                        title={p.isActive ? "Deactivate Product" : "Activate Product"}
                      >
                        {p.isActive ? <PowerOff className="h-4 w-4 mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                        {p.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {!isLoading && data && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {data.pageNumber} of {data.totalPages || 1} ({data.totalCount} items)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.hasPreviousPage}
                onClick={() => setPageNumber(prev => prev - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.hasNextPage}
                onClick={() => setPageNumber(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!productToToggle} onOpenChange={(open) => !open && setProductToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will {productToToggle?.isActive ? 'deactivate' : 'activate'} the product <strong>{productToToggle?.name}</strong>. 
              {productToToggle?.isActive && ' It will no longer be visible on the store.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleConfirmToggle(); }} 
              disabled={toggleMutation.isPending}
              className={productToToggle?.isActive ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : 'bg-primary hover:bg-primary/90'}
            >
              {toggleMutation.isPending ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}