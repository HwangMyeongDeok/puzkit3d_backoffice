import { Truck, CheckCircle2, MapPin, PackagePlus, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InfoRow } from '../shared';
import { PrintWaybillButton } from '@/components/order/PrintWaybillButton'; 

import { MediaViewer } from '../MediaViewer'; 

import type { SupportTicketDto } from '@/services/supportTicketApi';
import type { DeliveryTracking } from '@/services/deliveryApi'; 

interface Props {
  ticket: SupportTicketDto;
  deliveries: DeliveryTracking[]; 
  isCreating: boolean;
  onCreateShipment: () => void;
  onHandOverClick: (trackingId: string) => void;
}

export function TicketShipmentCard({ 
  ticket, 
  deliveries, 
  isCreating, 
  onCreateShipment, 
  onHandOverClick 
}: Props) {
  
  // 👉 0. LỌC BỎ CÁC ĐƠN 'ORIGINAL' (Vì đây là Support Ticket)
  // Chúng ta chỉ quan tâm các type khác như Return, Resend, ReplaceDrive...
  const supportDeliveries = deliveries.filter(d => d.type !== 'Original');

  // 👉 1. XÁC ĐỊNH LOGIC CHO NÚT CREATE TỔNG Ở HEADER (Dùng mảng đã lọc)
  const hasNoDelivery = supportDeliveries.length === 0;
  
  const returnDelivery = supportDeliveries.find(d => d.type === 'Return');
  const hasResendDelivery = supportDeliveries.some(d => d.type === 'Resend');
  
  const isReturnDelivered = returnDelivery?.status?.toLowerCase().includes('delivered');

  // Prefetch any handover images so the browser starts loading earlier
  useEffect(() => {
    try {
      const urls: string[] = [];
      supportDeliveries.forEach(d => {
        if (d.handOverImageUrl) {
          d.handOverImageUrl.split(',').map(u => u.trim()).filter(Boolean).forEach(u => urls.push(u));
        }
      });
      if (urls.length > 0) {
        console.log('Prefetching handover images', urls);
        urls.forEach((u) => {
          const img = new Image();
          img.src = u;
        });
      }
    } catch (err) {
      console.warn('Prefetch failure', err);
    }
  }, [supportDeliveries]);

  // Nút Lần 1: Chưa có gì
  const showInitialCreateBtn = hasNoDelivery && 
                              (ticket.type === 'ReplaceDrive' || ticket.type === 'Exchange') && 
                              ticket.status === 'Processing';

  // Nút Lần 2: Đã xong Return, chưa có Resend
  const showResendCreateBtn = ticket.type === 'Exchange' && 
                              isReturnDelivered && 
                              !hasResendDelivery && 
                              ticket.status === 'Processing';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4" /> Support Deliveries
          </CardTitle>

          {/* NÚT TẠO SHIPMENT TỔNG */}
          {showInitialCreateBtn && (
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={onCreateShipment} disabled={isCreating}>
              {isCreating ? 'Creating...' : <><Plus className="mr-1.5 h-3.5 w-3.5" /> Create Shipment</>}
            </Button>
          )}

          {showResendCreateBtn && (
            <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" onClick={onCreateShipment} disabled={isCreating}>
              {isCreating ? 'Creating...' : <><PackagePlus className="mr-1.5 h-3.5 w-3.5" /> Create Resend Shipment</>}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-5">
        {hasNoDelivery ? (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-2">
            <Truck className="h-8 w-8 opacity-20" />
            <span className="text-sm text-center">No shipments created yet.<br/>Change status to "Processing" to create one.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* 👉 MAP QUA MẢNG ĐÃ LỌC ĐỂ HIỂN THỊ */}
            {supportDeliveries.map((shipment) => {
              console.log('Delivery item for render', shipment.id, shipment.handOverImageUrl);
              const isReadyToPick = shipment.status === "ReadyToPick";
              const hasHandOverImage = !!shipment.handOverImageUrl;
              // Staff chỉ Handover chặng Resend (hoặc ReplaceDrive)
              const showHandOverBtn = isReadyToPick && (ticket.type === 'ReplaceDrive' || shipment.type === 'Resend');

              // Style màu sắc cho từng khối để phân cách rõ ràng
              const isReturn = shipment.type === 'Return';
              const boxStyle = isReturn 
                ? 'border-amber-200/60 bg-amber-50/30' 
                : 'border-indigo-200/60 bg-indigo-50/30';

              return (
                <div key={shipment.id} className={`flex flex-col gap-4 rounded-xl border p-4 shadow-sm transition-all ${boxStyle}`}>
                  {/* Header của từng cục hàng */}
                  <div className="flex items-center justify-between border-b pb-3 border-slate-200/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${isReturn ? 'text-amber-600 border-amber-200 bg-amber-100/50' : 'text-indigo-600 border-indigo-200 bg-indigo-100/50'}`}>
                        {shipment.type || 'Standard'}
                      </Badge>
                      {shipment.deliveryOrderCode && (
                        <PrintWaybillButton deliveryTrackingId={shipment.id} />
                      )}
                    </div>
                    
                    {/* Nút Handover gắn liền với từng cục hàng */}
                    {showHandOverBtn && (
                      <Button 
                        size="sm" 
                        className={`h-7 px-3 text-xs shadow-sm transition-all ${
                          hasHandOverImage 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
                            : "bg-amber-600 hover:bg-amber-700 text-white"
                        }`}
                        onClick={() => onHandOverClick(shipment.id)}
                        disabled={hasHandOverImage}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" /> 
                        {hasHandOverImage ? "Handed Over" : "Hand Over"}
                      </Button>
                    )}
                  </div>

                  {/* Chi tiết cục hàng */}
                  <div className="grid gap-2 pl-1">
                    <InfoRow label="Tracking Code" value={<span className="font-mono text-sm font-semibold">{shipment.deliveryOrderCode || 'Pending Sync'}</span>} />
                    <InfoRow label="Status" value={<Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 uppercase text-[10px] font-bold shadow-sm">{shipment.status}</Badge>} />
                    <InfoRow label="Expected Date" value={shipment.expectedDeliveryDate ? new Date(shipment.expectedDeliveryDate).toLocaleString() : 'N/A'} />
                  </div>
                  
                  {/* Ảnh Handover */}
                  {hasHandOverImage && (
                    <div className="mt-2 rounded-lg bg-white/60 p-3 border border-slate-100">
                      <span className="text-muted-foreground text-xs flex items-center gap-1 font-semibold mb-2 uppercase tracking-wider">
                        <MapPin className="h-3.5 w-3.5" /> Proof of Handover:
                      </span>
                      <MediaViewer proofData={shipment.handOverImageUrl} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}