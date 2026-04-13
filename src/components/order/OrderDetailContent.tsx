import React, { useState } from 'react';
import { 
  ShoppingBag, Truck, Phone, CreditCard, Package2, ShieldAlert, PlusCircle, Loader2, MapPin, CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// Types
import { type InstockCustomerOrderDto } from '@/types/types';
import { type InstockOrderDeliveryTrackingDto } from '@/types/types';

// Utils, Constants & Hooks (Đảm bảo import đúng đường dẫn của ông)
import { formatCurrency, formatDateTime } from './utils';
import { PrintWaybillButton } from './PrintWaybillButton';
import { INSTOCK_ORDER_KEYS } from '@/hooks/useInstockOrderQueries'; // Lấy key chuẩn để xóa cache
import { useCreateDeliveryTracking } from '@/hooks/useDeliveryQueries'; 

// 👉 TÁI SỬ DỤNG LẠI COMPONENT NÀY TỪ PHẦN SUPPORT
import { HandOverDialog } from '@/components/support/HandOverDialog'; 

const InfoRow = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="max-w-[60%] text-right font-medium break-words">
      {value ? value : <span className="text-muted-foreground opacity-70">—</span>}
    </span>
  </div>
);

export function OrderDetailContent({
  order,
  deliveries,
}: {
  order: InstockCustomerOrderDto;
  deliveries: InstockOrderDeliveryTrackingDto[];
}) {
  const queryClient = useQueryClient();
  const createDelivery = useCreateDeliveryTracking();
  
  // 👉 STATE MỚI ĐỂ QUẢN LÝ DIALOG HAND OVER
  const [handOverDialogTrackingId, setHandOverDialogTrackingId] = useState<string | null>(null);

  const fullAddress = [order.detailAddress, order.customerWardName, order.customerDistrictName, order.customerProvinceName]
    .filter(Boolean)
    .join(', ');

  // Hàm xử lý tạo Shipment
  const handleCreateShipment = async () => {
    try {
      await createDelivery.mutateAsync({ 
        orderId: order.id, 
        supportTicketId: null 
      });
      
      toast.success('Original shipment created successfully!');
      
      // 👉 SỬA LẠI ĐOẠN NÀY: Dùng đúng function sinh Key của ông thì nó mới nhận diện và tự load lại data liền
      queryClient.invalidateQueries({ queryKey: INSTOCK_ORDER_KEYS.deliveryTracking(order.id) });
    } catch (error) {
      console.error(error);
      toast.error('Failed to create shipment. Please try again.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Khối Order Summary & Customer Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4" /> Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Status" value={<Badge variant="outline">{order.status}</Badge>} />
            <InfoRow label="Payment Method" value={order.paymentMethod} />
            <InfoRow label="Paid" value={order.isPaid ? 'Yes' : 'No'} />
            <InfoRow label="Created At" value={formatDateTime(order.createdAt)} />
            <InfoRow label="Paid At" value={formatDateTime(order.paidAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" /> Customer Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Name" value={order.customerName} />
            <InfoRow label="Phone" value={order.customerPhone} />
            <InfoRow label="Email" value={order.customerEmail} />
            <Separator className="my-2" />
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Address</span>
              <p className="text-sm font-medium">{fullAddress || '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danh sách các gói hàng (Deliveries) */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5" /> Delivery Shipments
        </h3>

        {deliveries.length === 0 ? (
          <Card className="bg-muted/20 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Truck className="h-10 w-10 opacity-20 mb-3" />
              <p className="text-sm font-medium mb-1">No shipments found</p>
              <p className="text-xs text-muted-foreground mb-4">Create a delivery shipment to start processing this order.</p>
              
              <Button 
                onClick={handleCreateShipment} 
                disabled={createDelivery.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createDelivery.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <><PlusCircle className="mr-2 h-4 w-4" /> Create Original Shipment</>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {deliveries.map((delivery) => {
              const isReadyToPick = delivery.status === "ReadyToPick";
              const hasHandOverImage = !!delivery.handOverImageUrl;

              return (
                <Card key={delivery.id} className={delivery.type === 'Return' || delivery.type === 'Resend' ? 'border-amber-200 bg-amber-50/10' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <CardTitle className="flex items-center gap-2 text-base">
                          {delivery.type === 'Return' || delivery.type === 'Resend' ? <ShieldAlert className="h-4 w-4 text-amber-600" /> : <Package2 className="h-4 w-4 text-blue-600" />}
                          {delivery.type} Package
                        </CardTitle>
                        <Badge className={delivery.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}>
                          {delivery.status}
                        </Badge>
                      </div>

                      {/* 👉 NHÓM CÁC NÚT THAO TÁC */}
                      <div className="flex flex-wrap items-center gap-2">
                        {delivery.deliveryOrderCode && (
                          <PrintWaybillButton deliveryTrackingId={delivery.id} />
                        )}

                        {isReadyToPick && (
                          <Button 
                            size="sm" 
                            className={`h-7 px-3 text-xs shadow-sm transition-all ${
                              hasHandOverImage 
                                ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none" 
                                : "bg-amber-600 hover:bg-amber-700 text-white active:scale-95"
                            }`}
                            onClick={() => setHandOverDialogTrackingId(delivery.id)}
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
                    <InfoRow label="Tracking Code" value={<span className="font-mono font-bold">{delivery.deliveryOrderCode || 'Pending Sync'}</span>} />
                    <InfoRow label="Expected Delivery" value={formatDateTime(delivery.expectedDeliveryDate)} />
                    {delivery.deliveredAt && (
                      <InfoRow label="Delivered At" value={formatDateTime(delivery.deliveredAt)} />
                    )}
                    
                    {hasHandOverImage && (
                      <div className="mt-3 space-y-1">
                        <span className="text-muted-foreground text-sm flex items-center gap-1 font-medium">
                          <MapPin className="h-3.5 w-3.5" /> Proof of Handover:
                        </span>
                        <div className="mt-2 rounded-md border overflow-hidden">
                          <a href={delivery.handOverImageUrl!} target="_blank" rel="noopener noreferrer">
                            <img src={delivery.handOverImageUrl!} alt="Handover" className="w-full max-h-[200px] object-cover transition-opacity hover:opacity-90" />
                          </a>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment & Items Cards (Giữ nguyên như cũ) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" /> Payment Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Subtotal" value={formatCurrency(order.subTotalAmount)} />
          <InfoRow label="Shipping Fee" value={formatCurrency(order.shippingFee)} />
          <InfoRow label="Used Coin" value={order.usedCoinAmount.toLocaleString('vi-VN')} />
          <Separator />
          <InfoRow label="Grand Total" value={<span className="text-lg font-bold text-emerald-600">{formatCurrency(order.grandTotalAmount)}</span>} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package2 className="h-4 w-4" /> Order Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.orderDetails.map((detail) => (
             /* Code render items giữ nguyên */
             <div key={detail.id} className="rounded-lg border p-4">...</div>
          ))}
        </CardContent>
      </Card>

      {/* 👉 NHÚNG DIALOG UPLOAD ẢNH VÀO DƯỚI CÙNG COMPONENT */}
      <HandOverDialog 
  trackingId={handOverDialogTrackingId} 
  orderId={order.id}    // 👉 Truyền orderId vào đây
  onClose={() => setHandOverDialogTrackingId(null)} 
  onSuccess={() => {
    queryClient.invalidateQueries({ queryKey: INSTOCK_ORDER_KEYS.detail(order.id) });
    queryClient.invalidateQueries({ queryKey: INSTOCK_ORDER_KEYS.deliveryTracking(order.id) });
  }}
/>
    </div>
  );
}