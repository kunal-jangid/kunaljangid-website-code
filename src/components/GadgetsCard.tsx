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
        <div className="text-right font-mono text-[9px] text-brand-muted md:hidden w-full">[ Tap to view ]</div>
        <div>
          <p className="text-xs text-brand-muted leading-relaxed text-left font-sans">
            Pretty much a certified gear enthusiast. Love having a clean custom configuration, lover of deep linear mechanical keyboard acoustics, great books, and some might say, too many diecast models.
          </p>
        </div>
        <div className="absolute inset-0 bg-brand-text text-brand-bg hidden md:flex opacity-0 group-hover/card:opacity-100 transition-all duration-200 items-center justify-center p-4 text-center font-display font-medium text-sm tracking-tight select-none">
          Wanna inspect my current desk workstation? <br /><br /> <span className="font-mono text-xs uppercase tracking-wider underline underline-offset-4">Click to inspect</span>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-4xl bg-brand-surface border border-brand-border rounded-lg shadow-none">
        <DialogHeader className="border-b border-brand-border/40 pb-3">
          <DialogTitle className="text-lg font-medium font-display italic text-brand-text">Workstation & Desk Gear</DialogTitle>
        </DialogHeader>
        <DialogPanel scrollFade={false} className="flex flex-col items-center justify-center p-2">
          <ZoomableImage src="/desk-setup.png" alt="Desk Setup Asset Frame" />
          <div className="text-brand-muted text-center text-[11px] font-mono mt-5 max-w-xs px-4">
            <span className="md:hidden">[ Pinch to zoom / Drag image to pan ]</span>
            <span className="hidden md:inline">[ Scroll wheel / trackpad to zoom ]</span>
          </div>
        </DialogPanel>
      </DialogContent>
    </Dialog>
  );
}

