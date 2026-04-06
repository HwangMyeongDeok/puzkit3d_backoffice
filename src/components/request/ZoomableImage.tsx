import { useRef, useState } from "react";

export const ZoomableImage = ({ src }: { src: string }) => {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  const clampScale = (s: number) => Math.min(Math.max(s, 1), 5);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => {
      const next = clampScale(prev - e.deltaY * 0.002);
      if (next === 1) setPos({ x: 0, y: 0 });
      return next;
    });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    setPos({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  };

  const onMouseUp = () => { setDragging(false); dragStart.current = null; };

  const handleDoubleClick = () => {
    if (scale > 1) { setScale(1); setPos({ x: 0, y: 0 }); }
    else setScale(2.5);
  };

  return (
    <div
      style={{
        width: '85vw',
        height: '80vh',
        overflow: 'hidden',
        borderRadius: '8px',
        background: '#000',
        userSelect: 'none',
        cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <img
        src={src}
        alt="Zoomed sketch"
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
          transformOrigin: 'center center',
          transition: dragging ? 'none' : 'transform 0.15s ease',
          display: 'block',
        }}
      />
    </div>
  );
};