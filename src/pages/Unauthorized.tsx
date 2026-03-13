import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export function Unauthorized() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-muted/40">
      <div className="rounded-full bg-destructive/10 p-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
      <p className="text-muted-foreground">You do not have permission to view this page.</p>
      <Link to="/">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
}
