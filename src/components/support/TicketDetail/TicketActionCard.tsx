import { ShieldAlert, PlayCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type TicketStatus } from '@/services/supportTicketApi';

interface Props {
  currentStatus: TicketStatus;
  isUpdating: boolean;
  onStatusChange: (status: TicketStatus) => void;
}

export function TicketActionCard({ currentStatus, isUpdating, onStatusChange }: Props) {
  if (currentStatus === 'Resolved' || currentStatus === 'Rejected') {
    return null; 
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20 mb-4">
      <CardHeader className="py-4 px-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-semibold text-sm">
            <ShieldAlert className="h-4 w-4" /> 
            {currentStatus === 'Open' ? 'Staff Actions (New Ticket)' : 'Staff Actions (In Progress)'}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {currentStatus === 'Open' && (
              <>
                <Button
                  size="sm"
                  onClick={() => onStatusChange('Processing')}
                  disabled={isUpdating}
                  className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                >
                  <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                  Start Processing
                </Button>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onStatusChange('Rejected')}
                  disabled={isUpdating}
                  className="h-8 text-xs shadow-sm"
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Reject Ticket
                </Button>
              </>
            )}

            {currentStatus === 'Processing' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5 bg-blue-100/50 dark:bg-blue-900/30 px-2.5 py-1.5 rounded-md border border-blue-200 dark:border-blue-800">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Waiting for Customer to mark as Resolved
                </span>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange('Rejected')}
                  disabled={isUpdating}
                  className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 transition-colors"
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            )}

          </div>
        </div>
      </CardHeader>
    </Card>
  );
}