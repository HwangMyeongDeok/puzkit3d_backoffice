import { 
  ShoppingBag, Truck, MapPin, Phone, CreditCard, Package2 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { type InstockCustomerOrderDto } from '@/types/types';

// Import từ thư mục hiện tại
import { GHN_STATUS_MAP } from './constants';
import { formatCurrency, formatDateTime } from './utils';
import { PrintWaybillButton } from './PrintWaybillButton';
import { DeliveryTrackingSection } from './DeliveryTrackingSection';
import { ShippingTimeline, type TrackingLog } from './ShippingTimeline';

// InfoRow dùng nội bộ trong file này
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
  ghnStatus,
  statusUpdated,
  trackingLogs,
}: {
  order: InstockCustomerOrderDto;
  ghnStatus?: string;
  statusUpdated: boolean;
  trackingLogs?: TrackingLog[];
}) {
  const fullAddress = [order.detailAddress, order.customerWardName, order.customerDistrictName, order.customerProvinceName]
    .filter(Boolean)
    .join(', ');

  const hasDeliveryCode = !!order.deliveryOrderCode;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Status" value={order.status} />
            <InfoRow label="GHN Status" value={ghnStatus ? (GHN_STATUS_MAP[ghnStatus]?.label ?? ghnStatus) : '—'} />
            <InfoRow label="Status Synced" value={statusUpdated ? 'Yes' : 'No'} />
            <InfoRow label="Payment Method" value={order.paymentMethod} />
            <InfoRow label="Paid" value={order.isPaid ? 'Yes' : 'No'} />
            <InfoRow label="Created At" value={formatDateTime(order.createdAt)} />
            <InfoRow label="Updated At" value={formatDateTime(order.updatedAt)} />
            <InfoRow label="Paid At" value={formatDateTime(order.paidAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4" />
                Delivery
              </CardTitle>
              {hasDeliveryCode && <PrintWaybillButton orderId={order.id} />}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Delivery Code" value={order.deliveryOrderCode} />
            <InfoRow label="Expected Date" value={formatDateTime(order.expectedDeliveryDate)} />
            <InfoRow label="Address" value={fullAddress || '—'} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4" />
            Delivery Tracking
          </CardTitle>
          <CardDescription>Real-time delivery tracking records for this order.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeliveryTrackingSection orderId={order.id} orderStatus={order.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Shipping Timeline
          </CardTitle>
          <CardDescription>Live tracking events from GHN.</CardDescription>
        </CardHeader>
        <CardContent>
          <ShippingTimeline logs={trackingLogs} currentGhnStatus={ghnStatus} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Name" value={order.customerName} />
            <InfoRow label="Phone" value={order.customerPhone} />
            <InfoRow label="Email" value={order.customerEmail} />
          </CardContent>
        </Card>

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
            <InfoRow label="Coin Discount" value={formatCurrency(order.usedCoinAmountAsMoney || 0)} />
            <Separator />
            <InfoRow label="Grand Total" value={formatCurrency(order.grandTotalAmount)} />
          </CardContent>
        </Card>
      </div>

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
                    <InfoRow label="Size" value={`${detail.variantDetails.assembledLengthMm} x ${detail.variantDetails.assembledWidthMm} x ${detail.variantDetails.assembledHeightMm} mm`} />
                  </div>
                  <div className="rounded-md bg-muted/40 p-3 text-sm">
                    <p className="font-medium">{detail.productDetails.name}</p>
                    <p className="mt-1 text-muted-foreground">{detail.productDetails.description || 'No product description.'}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Code: {detail.productDetails.code}</span>
                      <span>Level: {detail.productDetails.difficultLevel}</span>
                      <span>Pieces: {detail.productDetails.totalPieceCount}</span>
                      <span>Build time: {detail.productDetails.estimatedBuildTime} min</span>
                    </div>
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