'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function MediaViewer({ proofData }: { proofData?: string | null }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  console.log('MediaViewer received proofData:', proofData);

  if (!proofData) {
    return <span className="text-sm text-muted-foreground italic">No evidence provided.</span>;
  }

  const urls = proofData.split(',').map((url) => url.trim()).filter(Boolean);

  if (urls.length === 0) {
    return <span className="text-sm text-muted-foreground italic">No evidence provided.</span>;
  }

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  function ImageItem({ url, onClick }: { url: string; onClick: (u: string) => void }) {
    const [loaded, setLoaded] = useState(false);
    const [src, setSrc] = useState(url);
    const [retries, setRetries] = useState(0);

    useEffect(() => {
      setSrc(url);
      setLoaded(false);
      setRetries(0);
    }, [url]);

    return (
      <div
        className="group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border bg-black/5 shadow-sm min-h-[150px]"
        onClick={() => onClick(url)}
      >
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 animate-pulse rounded bg-slate-200/60" />
          </div>
        )}

        <img
          src={src}
          alt="Evidence"
          loading="eager"
          importance="high"
          decoding="async"
          className="max-h-[250px] h-full w-full object-contain transition-all duration-300 group-hover:scale-105 group-hover:opacity-90"
          onLoad={() => {
            console.log('Image loaded', url);
            setLoaded(true);
          }}
          onError={() => {
            console.warn('Image failed to load, retrying', url, 'attempt', retries + 1);
            if (retries < 3) {
              const next = retries + 1;
              setRetries(next);
              // shorter retry delay to improve UX
              setTimeout(() => setSrc(`${url}?retry=${Date.now()}`), 500 * next);
            } else {
              setLoaded(true);
              setSrc('https://placehold.co/400x250?text=Image+Processing...');
            }
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
      </div>
    );
  }

  return (
    <>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {urls.map((url, index) => {
          const ytId = getYoutubeId(url);

          if (ytId) {
            return (
              <div key={index} className="aspect-video overflow-hidden rounded-lg border bg-black/5 shadow-sm">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title="YouTube video player"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            );
          }

          return <ImageItem key={index} url={url} onClick={(u) => setSelectedImage(u)} />;
        })}
      </div>

      {/* --- MODAL PHÓNG TO ẢNH --- */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25 md:right-8 md:top-8"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative flex max-h-[90vh] max-w-5xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage as string}
              alt="Enlarged Evidence"
              className="max-h-[90vh] max-w-full rounded-md object-contain shadow-2xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.dataset.retried) {
                  target.dataset.retried = 'true';
                  setTimeout(() => {
                    target.src = `${selectedImage}?retry=${Date.now()}`;
                  }, 500);
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}