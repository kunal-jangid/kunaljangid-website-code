import React, { useState } from 'react';

interface ProjectCardProps {
  title: string;
  subtitle: string;
  tags: string[];
  friction: string;
  fix: string;
  payoff: string;
}

export default function ProjectCard({ title, subtitle, tags, friction, fix, payoff }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      suppressHydrationWarning
      onClick={() => setIsExpanded(!isExpanded)}
      className="glass-panel p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 cursor-pointer group hover:border-brand-accent/50 select-none h-fit w-full"
    >
      <div className="text-left w-full">
        <span className="text-[9px] font-mono uppercase tracking-widest opacity-50 block mb-1">
          {subtitle}
        </span>
        <h3 className="text-base font-bold tracking-tight mb-2 group-hover:text-brand-accent transition-colors flex items-center justify-between">
          <span>{title}</span>
          <span className="text-[9px] font-mono opacity-40 group-hover:opacity-100 transition-opacity ml-2 whitespace-nowrap">
            {isExpanded ? '[ collapse ]' : '[ click to expand ]'}
          </span>
        </h3>
        
        {/* Collapsible Content Wrapper */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded
              ? 'max-h-[500px] opacity-100 mt-3 pt-3 border-t border-brand-border/10'
              : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="text-xs md:text-sm opacity-90 leading-relaxed space-y-3 font-sans">
            <div>
              <strong className="text-brand-accent font-mono block text-[9px] uppercase tracking-wider mb-0.5">
                The Friction:
              </strong>
              {friction}
            </div>
            <div>
              <strong className="text-brand-accent font-mono block text-[9px] uppercase tracking-wider mb-0.5">
                The Fix:
              </strong>
              {fix}
            </div>
            <div>
              <strong className="text-brand-accent font-mono block text-[9px] uppercase tracking-wider mb-0.5">
                The Payoff:
              </strong>
              {payoff}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-4 max-w-sm">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="px-2 py-0.5 text-[9px] font-mono bg-brand-border/10 rounded opacity-80 group-hover:opacity-100 transition-opacity"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
