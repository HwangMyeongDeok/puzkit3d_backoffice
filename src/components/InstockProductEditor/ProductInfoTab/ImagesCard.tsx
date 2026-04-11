'use client';

import { Upload, X, ImagePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ImagesCardProps {
  isCreateMode: boolean;
  thumbnailError: string | null;
  displayThumbnail: string | null;
  thumbnailInputRef: React.RefObject<HTMLInputElement | null>;
  handleThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveThumbnail: () => void;
  previewInputRef: React.RefObject<HTMLInputElement | null>;
  existingPreviews: [string, string][];
  previewLocalPreviews: string[];
  totalPreviewCount: number;
  canAddMorePreviews: boolean;
  handlePreviewFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveExistingPreview: (key: string) => void;
  handleRemoveNewPreview: (index: number) => void;
}

export function ImagesCard({
  isCreateMode,
  thumbnailError,
  displayThumbnail,
  thumbnailInputRef,
  handleThumbnailChange,
  handleRemoveThumbnail,
  previewInputRef,
  existingPreviews,
  previewLocalPreviews,
  totalPreviewCount,
  canAddMorePreviews,
  handlePreviewFilesChange,
  handleRemoveExistingPreview,
  handleRemoveNewPreview
}: ImagesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">Thumbnail {isCreateMode && <span className="text-destructive">*</span>}</p>
          <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
          {displayThumbnail ? (
            <div className="relative group w-40 h-40 rounded-lg overflow-hidden border bg-muted">
              <img src={displayThumbnail} alt="Thumbnail" className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="bg-white/90 rounded-full p-1.5 text-foreground hover:bg-white"><Upload className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={handleRemoveThumbnail} className="bg-white/90 rounded-full p-1.5 text-destructive hover:bg-white"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => thumbnailInputRef.current?.click()} className={`w-40 h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 ${thumbnailError ? 'border-destructive text-destructive' : 'text-muted-foreground hover:border-primary'}`}>
              <Upload className="h-6 w-6" /> <span className="text-xs font-medium">Upload thumbnail</span>
            </button>
          )}
          {thumbnailError && <p className="text-[0.8rem] font-medium text-destructive">{thumbnailError}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Preview Images ({totalPreviewCount}/3)</p>
          <input ref={previewInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePreviewFilesChange} />
          <div className="flex flex-wrap gap-3">
            {existingPreviews.map(([key, url]) => (
              <div key={key} className="relative group w-28 h-28 rounded-lg overflow-hidden border bg-muted">
                <img src={url} alt={key} className="object-cover w-full h-full" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={() => handleRemoveExistingPreview(key)} className="bg-white/90 rounded-full p-1.5 text-destructive"><X className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            {previewLocalPreviews.map((src, i) => (
              <div key={`new-${i}`} className="relative group w-28 h-28 rounded-lg overflow-hidden border bg-muted">
                <img src={src} alt="New" className="object-cover w-full h-full" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={() => handleRemoveNewPreview(i)} className="bg-white/90 rounded-full p-1.5 text-destructive"><X className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            {canAddMorePreviews && (
              <button type="button" onClick={() => previewInputRef.current?.click()} className="w-28 h-28 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary">
                <ImagePlus className="h-5 w-5" /> <span className="text-xs font-medium">Add</span>
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}