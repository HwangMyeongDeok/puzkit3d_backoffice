import { Truck, CheckCircle2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InfoRow } from '../shared';

import { PrintWaybillButton } from '@/components/order/PrintWaybillButton'; 

interface Props {
  ticket: any;
  supportShipment: any;
  isCreating: boolean;
  onCreateShipment: () => void;
  onHandOverClick: (trackingId: string) => void;
}

export function TicketShipmentCard({ ticket, supportShipment, isCreating, onCreateShipment, onHandOverClick }: Props) {
  const showCreateBtn = !supportShipment && 
                        (ticket.type === 'ReplacePart' || ticket.type === 'Exchange') && 
                        ticket.status === 'Processing';

  const isReadyToPick = supportShipment && supportShipment.status === "ReadyToPick";
  
  const hasHandOverImage = !!supportShipment?.handOverImageUrl;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          {/* CỘT TRÁI: TIÊU ĐỀ VÀ NÚT IN VẬN ĐƠN */}
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4" /> Support Delivery
            </CardTitle>
            
            {/* 👉 BƯỚC 2: ĐẶT NÚT IN Ở ĐÂY. 
                Chỉ hiện khi đã có mã vận đơn (deliveryOrderCode) */}
            {supportShipment?.deliveryOrderCode && (
              <PrintWaybillButton deliveryTrackingId={supportShipment.id} />
            )}
          </div>

          {/* CỘT PHẢI: CÁC NÚT THAO TÁC CREATE/HAND OVER */}
          <div className="flex items-center gap-2">
            
            {showCreateBtn && (
              <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onCreateShipment} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Shipment'}
              </Button>
            )}

            {isReadyToPick && (
              <Button 
                size="sm" 
                className={`h-7 px-3 text-xs shadow-sm transition-all ${
                  hasHandOverImage 
                    ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none" 
                    : "bg-amber-600 hover:bg-amber-700 text-white active:scale-95"
                }`}
                onClick={() => onHandOverClick(supportShipment.id)}
                disabled={hasHandOverImage}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> 
                {hasHandOverImage ? "Handed Over" : "Hand Over"}
              </Button>
            )}

          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {supportShipment ? (
          <>
            <InfoRow label="Tracking Code" value={<span className="font-mono">{supportShipment.deliveryOrderCode || 'Pending Sync'}</span>} />
            <InfoRow label="Status" value={<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 uppercase text-[10px]">{supportShipment.status}</Badge>} />
            <InfoRow label="Expected Date" value={supportShipment.expectedDeliveryDate ? new Date(supportShipment.expectedDeliveryDate).toLocaleString() : 'N/A'} />
            
            {hasHandOverImage && (
              <div className="mt-4 space-y-1">
                <span className="text-muted-foreground text-sm flex items-center gap-1 font-medium">
                  <MapPin className="h-3.5 w-3.5" /> Proof of Handover:
                </span>
                <div className="mt-2 rounded-md border overflow-hidden">
                  <a href={supportShipment.handOverImageUrl} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={supportShipment.handOverImageUrl} 
                      alt="Handover" 
                      className="w-full max-h-[250px] object-cover transition-opacity hover:opacity-90" 
                    />
                  </a>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-muted-foreground gap-2">
            <Truck className="h-8 w-8 opacity-20" />
            <span className="text-sm text-center px-4">No replacement shipment created yet.<br/>Change status to "Processing" to create one.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}