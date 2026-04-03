export function   MediaViewer({ proofData }: { proofData?: string | null }) {
  if (!proofData) {
    return <span className="text-sm text-muted-foreground italic">No evidence provided.</span>;
  }

  const urls = proofData.split(',').map(url => url.trim()).filter(Boolean);

  if (urls.length === 0) {
    return <span className="text-sm text-muted-foreground italic">No evidence provided.</span>;
  }

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {urls.map((url, index) => {
        const ytId = getYoutubeId(url);

        if (ytId) {
          return (
            <div key={index} className="rounded-lg border bg-black/5 overflow-hidden aspect-video shadow-sm">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title="YouTube video player"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }

        return (
          <div key={index} className="rounded-lg border overflow-hidden bg-white flex items-center justify-center shadow-sm">
            <a href={url} target="_blank" rel="noopener noreferrer" className="w-full h-full">
              <img 
                src={url} 
                alt={`Evidence ${index + 1}`} 
                className="w-full h-full max-h-[250px] object-cover transition-opacity hover:opacity-90" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x250?text=Image+Not+Found';
                }}
              />
            </a>
          </div>
        );
      })}
    </div>
  );
}