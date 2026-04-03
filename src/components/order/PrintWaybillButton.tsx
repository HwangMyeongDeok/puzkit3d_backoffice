import { useState } from 'react';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { instockOrderApi } from '@/services/instockOrderApi';

export function PrintWaybillButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  
  const handlePrint = async () => {
    setLoading(true);
    try {
      const response = await instockOrderApi.getWaybillUrl(orderId) as { waybillUrl: string };
      if (!response?.waybillUrl) throw new Error('No waybill URL returned.');
      window.open(response.waybillUrl, '_blank', 'noopener,noreferrer');
      toast.success('Waybill opened in a new tab.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve waybill. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button size="sm" variant="outline" onClick={handlePrint} disabled={loading}>
      <Printer className="mr-1.5 h-4 w-4" />
      {loading ? 'Loading...' : 'Print Waybill'}
    </Button>
  );
}