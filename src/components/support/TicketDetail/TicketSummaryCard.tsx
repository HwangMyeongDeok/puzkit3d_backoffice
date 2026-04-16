import { FileText, ShoppingBag, User, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MediaViewer } from '@/components/support/MediaViewer';
import { TicketStatusBadge, InfoRow } from '../shared';
import { TICKET_TYPE_LABEL } from '../constants';

// 👉 Import type chuẩn
import type { SupportTicketDto } from '@/services/supportTicketApi'; // Hoặc đường dẫn file type của bạn
import type { InstockCustomerOrderDto } from '@/types/types'; 

interface Props {
  ticket: SupportTicketDto;
  orderData?: InstockCustomerOrderDto | null;
}

export function TicketSummaryCard({ ticket, orderData }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" /> Summary & Evidence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ticket Info */}
        <div className="space-y-2">
          <InfoRow label="Ticket Status" value={<TicketStatusBadge status={ticket.status} />} />
          <InfoRow label="Type" value={<Badge variant="secondary">{TICKET_TYPE_LABEL[ticket.type] ?? ticket.type}</Badge>} />
        </div>

        {/* Order Info */}
        <div className="bg-muted/30 rounded-lg p-3 border space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold mb-2">
            <ShoppingBag className="h-4 w-4" /> Related Order
          </div>
          <InfoRow 
            label="Order Code" 
            value={<span className="font-mono text-xs font-semibold">{orderData?.code || ticket.orderId}</span>} 
          />
          <InfoRow 
            label="Customer" 
            value={
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" />
                {orderData?.customerName || 'N/A'}
              </div>
            } 
          />
          <InfoRow 
            label="Order Status" 
            value={
              orderData?.status ? (
                <Badge variant="outline" className="text-[10px] uppercase">{orderData.status}</Badge>
              ) : 'N/A'
            } 
          />
        </div>
        
        {/* Evidence */}
        <div className="space-y-1">
          <span className="text-muted-foreground text-sm">Reason:</span>
          <p className="text-sm bg-muted/30 p-2 rounded-md border">{ticket.reason}</p>
        </div>
        <div className="space-y-1 mt-4">
          <span className="text-muted-foreground text-sm flex items-center gap-1 font-medium">
            <ImageIcon className="h-4 w-4" /> Customer Provided Evidence:
          </span>
          <MediaViewer proofData={ticket.proof} />
        </div>
      </CardContent>
    </Card>
  );
}