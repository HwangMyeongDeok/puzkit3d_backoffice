import { Package2, Loader2, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePartById } from '@/hooks/usePartQueries'; 
import type { InstockOrderDetailDto } from '@/types/types';

function TicketAffectedItem({ item, ticketType, orderData }: { item: any; ticketType: string; orderData: any }) {
  const matchedProduct = orderData?.orderDetails?.find(
    (od: InstockOrderDetailDto) => od.id === item.orderDetailId
  );

  const productId = matchedProduct?.productDetails?.productId;

  const { data: partData, isLoading: isPartLoading } = usePartById(
    productId || '', 
    ticketType === 'ReplacePart' ? item.partId : null
  );

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg bg-background">
      {/* Hình ảnh Product gốc */}
      {matchedProduct?.thumbnailUrl ? (
        <img 
          src={matchedProduct.thumbnailUrl} 
          alt={matchedProduct.productName} 
          className="w-14 h-14 rounded-md bg-muted object-cover border shrink-0" 
        />
      ) : (
        <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center border shrink-0">
          <Package2 className="h-5 w-5 text-muted-foreground/50" />
        </div>
      )}
      
      <div className="flex-1 min-w-0 space-y-1">
        {/* Tên Product */}
        <p className="font-medium text-sm leading-tight truncate">
          {matchedProduct?.productName || 'Unknown Product'} 
          {matchedProduct?.variantName ? ` - ${matchedProduct.variantName}` : ''}
        </p>
        
        {/* Số lượng & Giá */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Qty Issue: <strong className="text-foreground">{item.quantity}</strong></span>
          {matchedProduct?.unitPrice && <span>Price: {matchedProduct.unitPrice.toLocaleString('vi-VN')}đ</span>}
        </div>

        {/* Note của khách */}
        {item.note && (
          <p className="text-xs mt-1 text-red-500 font-medium bg-red-50 dark:bg-red-950/30 p-1.5 rounded inline-block">
            Note: {item.note}
          </p>
        )}

        {/* Hiển thị chi tiết Part (Chỉ dành cho case ReplacePart) */}
        {ticketType === 'ReplacePart' && item.partId && (
          <div className="mt-2 p-2.5 bg-muted/50 rounded-md border border-muted">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Part Replacement Required
            </p>
            
            {isPartLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Fetching part info...
              </div>
            ) : partData ? (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded border bg-white dark:bg-slate-900 flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate" title={partData.name}>
                    {partData.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground mt-0.5">
                    <span className="font-mono text-foreground/80">{partData.code}</span>
                    <span>&bull;</span>
                    <span>Type: {partData.partType || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Part ID: {item.partId} (Detail not found)</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function TicketAffectedItems({ details, ticketType, orderData }: { details: any[]; ticketType: string; orderData: any }) {
  if (!details || details.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3 border-b bg-muted/20">
        <CardTitle className="text-base flex items-center gap-2">
          <Package2 className="h-4 w-4" /> Affected Items
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 bg-muted/10">
        <div className="space-y-3">
          {details.map((item) => (
            <TicketAffectedItem 
              key={item.id} 
              item={item} 
              ticketType={ticketType} 
              orderData={orderData} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}