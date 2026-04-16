import { Package2, Loader2, HardDrive, ArrowDownRight, MessageSquareQuote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// 👉 Hook MasterData (Tanstack Query)
import { useDrives } from '@/hooks/useMasterDataQueries'; 
import type { InstockCustomerOrderDto, InstockOrderDetailDto } from '@/types/types';
import type { TicketDetailItem } from '@/services/supportTicketApi'; 

interface TicketAffectedItemProps {
  item: TicketDetailItem;
  ticketType: string;
  orderData?: InstockCustomerOrderDto;
}

function TicketAffectedItem({ item, ticketType, orderData }: TicketAffectedItemProps) {
  const matchedProduct = orderData?.orderDetails?.find(
    (od: InstockOrderDetailDto) => od.id === item.orderDetailId
  );

  const isReplaceDrive = ticketType === 'ReplaceDrive' && !!item.driveId;

  // Fetch drives
  const { data: allDrives, isLoading: isDrivesLoading } = useDrives();

  // Tìm Drive cụ thể
  const driveData = isReplaceDrive && allDrives 
    ? allDrives.find(d => d.id === item.driveId) 
    : null;

  const showDriveLoading = isReplaceDrive && isDrivesLoading;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all">
      {/* --- KHỐI 1: THÔNG TIN SẢN PHẨM GỐC --- */}
      <div className={`flex items-center gap-4 p-4 ${isReplaceDrive ? 'bg-muted/10' : 'bg-transparent'}`}>
        
        {/* Hình ảnh Product */}
        {matchedProduct?.thumbnailUrl ? (
          <img 
            src={matchedProduct.thumbnailUrl} 
            alt={matchedProduct.productName} 
            className="h-16 w-16 shrink-0 rounded-lg border bg-muted object-cover shadow-sm" 
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border bg-muted shadow-sm">
            <Package2 className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
        
        <div className="min-w-0 flex-1">
          {/* Tên Product */}
          {isReplaceDrive && (
            <p className="mb-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Original Product
            </p>
          )}
          <p className="truncate text-sm font-semibold text-foreground">
            {matchedProduct?.productName || 'Unknown Product'} 
          </p>
          {matchedProduct?.variantName && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Variant: {matchedProduct.variantName}
            </p>
          )}

          {/* Giá Product */}
          {matchedProduct?.unitPrice && (
            <p className="mt-1 text-xs text-muted-foreground">
              Price: {matchedProduct.unitPrice.toLocaleString('vi-VN')}đ
            </p>
          )}
        </div>

        {/* 👉 Nếu KHÔNG PHẢI ReplaceDrive: Hiển thị Quantity Issue ở đây */}
        {!isReplaceDrive && (
          <div className="shrink-0 text-right">
            <Badge variant="destructive" className="px-2 py-1 shadow-sm">
              Quantity: {item.quantity}
            </Badge>
          </div>
        )}
      </div>

      {/* 👉 Nếu KHÔNG PHẢI ReplaceDrive: Hiển thị Note ở đây */}
      {!isReplaceDrive && item.note && (
        <div className="border-t border-dashed border-border bg-muted/5 px-4 py-3">
          <div className="flex items-start gap-2">
            <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm italic leading-relaxed text-muted-foreground">
              &ldquo;{item.note}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* --- KHỐI 2: CHI TIẾT DRIVE (CHỈ DÀNH CHO REPLACE DRIVE) --- */}
      {isReplaceDrive && (
        <div className="relative border-t border-border bg-background p-4 pt-5">
          {/* Mũi tên chỉ hướng kết nối logic */}
          <div className="absolute top-[-12px] left-8 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm">
            <ArrowDownRight className="h-3 w-3" />
          </div>

          <div className="flex flex-col rounded-lg border border-amber-200/80 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-900/10">
            <div className="flex items-start justify-between gap-3 p-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex shrink-0 items-center justify-center rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/50 dark:text-amber-500">
                  <HardDrive className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 text-[10px] font-bold tracking-wider text-amber-800 uppercase dark:text-amber-500">
                    Drive Replacement Required
                  </p>
                  
                  {showDriveLoading ? (
                    <div className="mt-1 flex items-center gap-2 text-xs text-amber-700">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading drive info...
                    </div>
                  ) : driveData ? (
                    <div>
                      <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                        {driveData.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-amber-700/80 dark:text-amber-400/80">
                        {driveData.description || `ID: ${item.driveId}`}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="truncate text-sm font-medium text-amber-900 dark:text-amber-200">
                        ID: <span className="font-mono text-xs opacity-80">{item.driveId}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-amber-600/70">Info unavailable</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 👉 NẾU LÀ REPLACE DRIVE: Quantity Issue chuyển vào đây */}
              <div className="shrink-0 pt-1">
                <span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200/50 dark:bg-amber-900/60 dark:text-amber-300 dark:ring-amber-800/50">
                  Quantity: {item.quantity}
                </span>
              </div>
            </div>

            {/* 👉 NẾU LÀ REPLACE DRIVE: Note chuyển vào đây */}
            {item.note && (
              <div className="border-t border-amber-200/40 bg-white/40 p-3 dark:border-amber-800/30 dark:bg-black/20">
                <div className="flex items-start gap-2">
                  <MessageSquareQuote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600/60 dark:text-amber-500/60" />
                  <p className="text-sm italic leading-relaxed text-amber-900/80 dark:text-amber-100/70">
                    &ldquo;{item.note}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface TicketAffectedItemsProps {
  details: TicketDetailItem[]; 
  ticketType: string;
  orderData?: InstockCustomerOrderDto;
}

export function TicketAffectedItems({ details, ticketType, orderData }: TicketAffectedItemsProps) {
  if (!details || details.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package2 className="h-4 w-4" /> Affected Items
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-muted/5 pt-4">
        <div className="space-y-4">
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