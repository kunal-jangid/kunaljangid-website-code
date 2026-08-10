import React, { useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPanel,
} from "@/components/ui/dialog";
import ZoomableImage from './ZoomableImage';

const photoAssets = [
  '/photography/shot1.jpg',
  '/photography/shot2.jpg',
  '/photography/shot3.jpg',
  '/photography/shot4.jpg',
  '/photography/shot5.jpg',
  '/photography/shot6.jpg',
  '/photography/shot7.jpg',
  '/photography/shot8.jpg',
  '/photography/shot9.jpg',
];

export default function FramesCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [open, setOpen] = useState(false);

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % photoAssets.length);
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + photoAssets.length) % photoAssets.length);
  };

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % photoAssets.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + photoAssets.length) % photoAssets.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const diffX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diffX) > 60) {
      if (diffX > 0) {
        prevPhoto();
      } else {
        nextPhoto();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <button className="w-full h-full min-h-[140px] flex flex-col justify-between cursor-pointer group/card select-none text-left" />
      }>
        <div className="text-right font-mono text-[10px] opacity-40 md:hidden w-full">[ Tap to view ]</div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">The Frames</h3>
          <p className="text-xs opacity-70 leading-relaxed text-left">
            Capturing industrial lines, geographic balances, and raw environmental illumination profiles found during transit using my phone, which is more often than not a Samsung lol.
          </p>
        </div>
        <div className="absolute inset-0 bg-brand-text text-brand-bg hidden md:flex opacity-0 group-hover/card:opacity-100 transition-all duration-300 items-center justify-center p-4 text-center font-bold text-sm tracking-tight select-none">
          Wanna see the pictures I took recently? <br /><br /> Click here
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-4xl bg-brand-bg border-brand-border/40">
        <DialogHeader className="border-b border-brand-border/20 pb-4">
          <DialogTitle className="text-lg font-bold font-mono">THE FRAMES</DialogTitle>
        </DialogHeader>

        <DialogPanel scrollFade={false}>
          <div
            className="flex flex-col justify-center items-center w-full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="max-w-4xl max-h-[70vh] w-full flex items-center justify-between gap-2 md:gap-6 relative">
              <button
                onClick={prevPhoto}
                className="hidden md:block text-brand-text/40 hover:text-brand-text font-mono text-xs uppercase tracking-widest p-2 transition-colors z-[1000]"
              >
                [ Prev ]
              </button>

              <div className="overflow-hidden rounded flex items-center justify-center grow max-h-[65vh] w-full">
                <ZoomableImage
                  src={photoAssets[currentIndex]}
                  alt={`Recent Film Frame ${currentIndex + 1}`}
                />
              </div>

              <button
                onClick={nextPhoto}
                className="hidden md:block text-brand-text/40 hover:text-brand-text font-mono text-xs uppercase tracking-widest p-2 transition-colors z-[1000]"
              >
                [ Next ]
              </button>
            </div>

            <div className="text-brand-text/40 text-[11px] font-mono mt-6 text-center">
              {String(currentIndex + 1).padStart(2, '0')} / {String(photoAssets.length).padStart(2, '0')}
            </div>
            <div className="text-brand-text/20 text-[10px] font-mono mt-1 md:hidden text-center">
              [ Swipe horizontally to browse // Pinch to zoom ]
            </div>
          </div>
        </DialogPanel>
      </DialogContent>
    </Dialog>
  );
}

