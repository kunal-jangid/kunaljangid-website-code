import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ZoomableImage from './ZoomableImage';

export default function GadgetsCard() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
    document.body.classList.add('no-scroll');
  };

  const closeModal = () => {
    setIsOpen(false);
    document.body.classList.remove('no-scroll');
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div
        onClick={openModal}
        className="w-full h-full min-h-[140px] flex flex-col justify-between cursor-pointer group/card select-none"
      >
        <div className="text-right font-mono text-[10px] opacity-40 md:hidden">[ Tap to view ]</div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">The Gadgets</h3>
          <p className="text-xs opacity-70 leading-relaxed text-left">
            Pretty much a certified gear enthusiast. Love having a clean custom configuration, lover of deep linear mechanical keyboard acoustics, great books, and some might say, too many diecast models.
          </p>
        </div>
        <div className="absolute inset-0 bg-brand-text text-brand-bg hidden md:flex opacity-0 group-hover/card:opacity-100 transition-all duration-300 items-center justify-center p-4 text-center font-bold text-sm tracking-tight select-none">
          Wanna see my desk setup right now? <br /><br /> Click here
        </div>
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999] flex flex-col justify-center items-center p-4 bg-brand-bg/95 backdrop-blur-sm transition-opacity duration-200">
          <button
            onClick={closeModal}
            className="absolute top-6 right-6 text-brand-text font-mono text-xs uppercase tracking-widest border border-brand-border/20 px-4 py-2 rounded hover:bg-brand-text hover:text-brand-bg transition-all z-[1000]"
          >
            × Close (ESC)
          </button>
          <ZoomableImage src="/desk-setup.png" alt="Desk Setup Asset Frame" />
          <div className="text-brand-text/45 text-center text-[11px] font-mono mt-6 max-w-xs px-4">
            <span className="md:hidden">[ Pinch to zoom / Drag image to pan setup layout ]</span>
            <span className="hidden md:inline">[ Use scroll wheel / trackpad to zoom view ]</span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
