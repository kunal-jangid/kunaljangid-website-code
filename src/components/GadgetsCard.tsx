import React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPanel,
} from "@/components/ui/dialog";
import ZoomableImage from './ZoomableImage';

export default function GadgetsCard() {
  return (
    <Dialog>
      <DialogTrigger render={
        <button className="w-full h-full min-h-[140px] flex flex-col justify-between cursor-pointer group/card select-none text-left" />
      }>
        <div className="text-right font-mono text-[10px] opacity-40 md:hidden w-full">[ Tap to view ]</div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">The Gadgets</h3>
          <p className="text-xs opacity-70 leading-relaxed text-left">
            Pretty much a certified gear enthusiast. Love having a clean custom configuration, lover of deep linear mechanical keyboard acoustics, great books, and some might say, too many diecast models.
          </p>
        </div>
        <div className="absolute inset-0 bg-brand-text text-brand-bg hidden md:flex opacity-0 group-hover/card:opacity-100 transition-all duration-300 items-center justify-center p-4 text-center font-bold text-sm tracking-tight select-none">
          Wanna see my desk setup right now? <br /><br /> Click here
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-4xl bg-brand-bg border-brand-border/40">
        <DialogHeader className="border-b border-brand-border/20 pb-4">
          <DialogTitle className="text-lg font-bold font-mono">DESK SETUP</DialogTitle>
        </DialogHeader>
        <DialogPanel scrollFade={false} className="flex flex-col items-center justify-center">
          <ZoomableImage src="/desk-setup.png" alt="Desk Setup Asset Frame" />
          <div className="text-brand-text/45 text-center text-[11px] font-mono mt-6 max-w-xs px-4">
            <span className="md:hidden">[ Pinch to zoom / Drag image to pan setup layout ]</span>
            <span className="hidden md:inline">[ Use scroll wheel / trackpad to zoom view ]</span>
          </div>
        </DialogPanel>
      </DialogContent>
    </Dialog>
  );
}

