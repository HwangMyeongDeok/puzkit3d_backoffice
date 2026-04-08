import { useState } from 'react';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { instockOrderApi } from '@/services/instockOrderApi';

export function PrintWaybillButton({ deliveryTrackingId }: { deliveryTrackingId: string }) {
  const [loading, setLoading] = useState(false);
  
  const handlePrint = async () => {
    setLoading(true);
    try {
      // Gọi API lấy link
      const response = await instockOrderApi.getWaybillUrl(deliveryTrackingId);
      
      const urlToOpen = typeof response === 'string' ? response : (response as any)?.waybillUrl;

      if (!urlToOpen) throw new Error('No waybill URL returned.');
      
      // Mở link đó sang một tab mới
      window.open(urlToOpen, '_blank', 'noopener,noreferrer');
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve waybill. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button size="sm" variant="outline" onClick={handlePrint} disabled={loading} className="h-7 px-2 text-xs">
      <Printer className="mr-1.5 h-3.5 w-3.5" />
      {loading ? 'Opening...' : 'Print Waybill'}
    </Button>
  );
}