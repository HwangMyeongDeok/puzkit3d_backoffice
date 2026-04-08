import {
  ShoppingBag, Truck, MapPin, Phone, CreditCard, Package2, ShieldAlert
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Types
import { type InstockCustomerOrderDto } from '@/types/types';
import { type InstockOrderDeliveryTrackingDto } from '@/types/types';

// Utils (Nhớ import đúng đường dẫn của bạn)
import { formatCurrency, formatDateTime } from './utils';
import { PrintWaybillButton } from './PrintWaybillButton';

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
  const fullAddress = [order.detailAddress, order.customerWardName, order.customerDistrictName, order.customerProvinceName]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-5">
      {/* Khối Order Summary & Customer Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Status" value={<Badge variant="outline">{order.status}</Badge>} />
            <InfoRow label="Payment Method" value={order.paymentMethod} />
            <InfoRow label="Paid" value={order.isPaid ? 'Yes' : 'No'} />
            <InfoRow label="Created At" value={formatDateTime(order.createdAt)} />
            <InfoRow label="Updated At" value={formatDateTime(order.updatedAt)} />
            <InfoRow label="Paid At" value={formatDateTime(order.paidAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" />
              Customer & Shipping Address
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
          <Card className="bg-muted/20 border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Truck className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-sm">No shipments created for this order yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {deliveries.map((delivery) => (
              <Card key={delivery.id} className={delivery.type === 'Support' ? 'border-amber-200 bg-amber-50/10' : ''}>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {delivery.type === 'Support' ? <ShieldAlert className="h-4 w-4 text-amber-600" /> : <Package2 className="h-4 w-4 text-blue-600" />}
                        {delivery.type} Package
                      </CardTitle>
                      <Badge className={delivery.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}>
                        {delivery.status}
                      </Badge>
                    </div>

                    {/* 👇 ĐẶT NÚT IN VẬN ĐƠN Ở ĐÂY, CHUYỀN ID CỦA DELIVERY VÀO 👇 */}
                    {delivery.deliveryOrderCode && (
                      <PrintWaybillButton deliveryTrackingId={delivery.id} />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* ... Các thông tin khác giữ nguyên như cũ ... */}
                  <InfoRow label="Tracking Code" value={<span className="font-mono font-bold">{delivery.deliveryOrderCode || 'Pending Sync'}</span>} />
                  <InfoRow label="Expected Delivery" value={formatDateTime(delivery.expectedDeliveryDate)} />
                  {delivery.deliveredAt && (
                    <InfoRow label="Delivered At" value={formatDateTime(delivery.deliveredAt)} />
                  )}
                </CardContent>

              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Thông tin Thanh toán */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Payment Breakdown
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

      {/* Thông tin Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package2 className="h-4 w-4" />
            Order Items
          </CardTitle>
          <CardDescription>{order.orderDetails.length} item(s) in this order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.orderDetails.map((detail) => (
            // Form map items ở đây giữ nguyên không cần thay đổi
            <div key={detail.id} className="rounded-lg border p-4">
              <div className="flex gap-4">
                {detail.thumbnailUrl ? (
                  <img src={detail.thumbnailUrl} alt={detail.productName} className="h-20 w-20 rounded-lg border object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">No image</div>
                )}
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{detail.productName}</p>
                      <p className="text-sm text-muted-foreground">{detail.variantName}</p>
                    </div>
                    <Badge variant="outline">{detail.priceName || 'Default price'}</Badge>
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <InfoRow label="SKU" value={detail.sku} />
                    <InfoRow label="Color" value={detail.variantDetails.color} />
                    <InfoRow label="Quantity" value={detail.quantity.toString()} />
                    <InfoRow label="Unit Price" value={formatCurrency(detail.unitPrice)} />
                    <InfoRow label="Total" value={formatCurrency(detail.totalAmount)} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}