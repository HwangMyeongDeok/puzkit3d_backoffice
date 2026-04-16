import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadApi } from '@/services/uploadApi';
import { useUpdateHandOverImage } from '@/hooks/useDeliveryQueries';
import { useUpdateInstockOrderStatus } from '@/hooks/useInstockOrderQueries';

interface HandOverDialogProps {
  trackingId: string | null;
  orderId: string | null;
  // 👉 THÊM FLAG NÀY ĐỂ BỎ QUA VIỆC UPDATE ORDER STATUS
  skipOrderStatusUpdate?: boolean; 
  onClose: () => void;
  onSuccess: () => void;
}

export function HandOverDialog({ trackingId, orderId, skipOrderStatusUpdate = false, onClose, onSuccess }: HandOverDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { mutateAsync: updateHandOverImage } = useUpdateHandOverImage();
  const { mutateAsync: updateOrderStatus } = useUpdateInstockOrderStatus();

  const handleConfirm = async () => {
    if (!trackingId || !file) return;
    
    setIsSubmitting(true);
    try {
      // 1. Upload ảnh lên S3
      const customPath = `hand-overs/${trackingId}-${Date.now()}`;
      const imageUrl = await uploadApi.uploadFileToS3(file, 'deliveries', customPath);
      
      // 2. Cập nhật ảnh vào Tracking Delivery
      await updateHandOverImage({ id: trackingId, imageUrl });
      
      // 👉 3. CHỈ UPDATE ORDER NẾU KHÔNG BỊ SKIP
      if (orderId && !skipOrderStatusUpdate) {
        await updateOrderStatus({ 
          orderId: orderId, 
          data: { newStatus: 'HandedOverToDelivery' }
        });
      }
      
      toast.success("Package handed over successfully!");
      onSuccess(); 
      handleClose(); 
    } catch (err) {
      console.error(err);
      toast.error('Failed to hand over package. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <Dialog open={!!trackingId} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <DialogTitle>Hand Over Package</DialogTitle>
          <DialogDescription>
            Please upload a photo of the packed package to confirm hand over to the delivery service.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) {
                setFile(selectedFile);
                setPreview(URL.createObjectURL(selectedFile));
              }
            }}
          />
          {preview ? (
            <div className="relative w-full max-w-sm rounded-lg border overflow-hidden">
              <img src={preview} alt="Preview" className="w-full h-auto object-cover max-h-64" />
              <Button 
                size="icon" 
                variant="destructive" 
                className="absolute top-2 right-2 h-6 w-6 rounded-full"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center w-full max-w-sm h-40 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 hover:bg-muted/30 cursor-pointer transition-colors"
            >
              <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Click to upload photo</p>
              <p className="text-xs text-muted-foreground/70 mt-1">JPEG, PNG, WEBP max 5MB</p>
            </div>
          )}
        </div>
        <div className="flex w-full justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            disabled={!file || isSubmitting} 
            onClick={handleConfirm}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Hand Over</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}