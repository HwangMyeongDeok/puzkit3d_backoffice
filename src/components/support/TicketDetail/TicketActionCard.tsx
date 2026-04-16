import { 
  PlayCircle, 
  XCircle, 
  Loader2, 
  Clock, 
  Wrench 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
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

  const isOpen = currentStatus === 'Open';

  return (
    <Card className="mb-6 overflow-hidden border-border bg-card shadow-sm transition-all">
      <div className="flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
        
        {/* --- KHU VỰC THÔNG TIN (TRÁI) --- */}
        <div className="flex items-center gap-4">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border ${
            isOpen 
              ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400' 
              : 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400'
          }`}>
            {isOpen ? <Wrench className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {isOpen ? 'New Ticket Request' : 'Ticket is Processing'}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isOpen 
                ? 'Review the details below and start processing to handle shipments.' 
                : 'Shipments are being handled. Waiting for the customer to confirm resolution.'}
            </p>
          </div>
        </div>

        {/* --- KHU VỰC HÀNH ĐỘNG (PHẢI) --- */}
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
          
          {isOpen && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange('Rejected')}
                disabled={isUpdating}
                className="h-9 w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
              >
                {isUpdating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}
                Reject
              </Button>
              
              <Button
                size="sm"
                onClick={() => onStatusChange('Processing')}
                disabled={isUpdating}
                className="h-9 w-full bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:w-auto"
              >
                {isUpdating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-1.5 h-4 w-4" />}
                Start Processing
              </Button>
            </>
          )}

          {currentStatus === 'Processing' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange('Rejected')}
              disabled={isUpdating}
              className="h-9 w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
            >
              {isUpdating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}
              Force Reject
            </Button>
          )}

        </div>
      </div>
    </Card>
  );
}