import React, { useState, useEffect } from 'react';

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
  const [isHidden, setIsHidden] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    const handleCommand = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { action, value } = customEvent.detail;
      if (action === 'expand-projects') {
        setIsExpanded(true);
      } else if (action === 'filter-tech') {
        const query = value.toLowerCase();
        const hasTag = tags.some(t => t.toLowerCase().includes(query)) || title.toLowerCase().includes(query);
        if (query === 'all' || query === '') {
          setIsHidden(false);
          setIsHighlighted(false);
        } else if (hasTag) {
          setIsHidden(false);
          setIsHighlighted(true);
          setIsExpanded(true);
        } else {
          setIsHidden(true);
          setIsHighlighted(false);
          setIsExpanded(false);
        }
      }
    };

    window.addEventListener('terminal-command', handleCommand);
    return () => window.removeEventListener('terminal-command', handleCommand);
  }, [tags, title]);

  if (isHidden) return null;

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={`border-b border-brand-border/20 py-3.5 flex flex-col cursor-pointer transition-all duration-200 select-none text-left w-full font-mono ${
        isHighlighted ? 'bg-brand-accent/5 border-l-2 border-l-brand-accent pl-2' : ''
      }`}
    >
      {/* Structured Ledger Row Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr_auto_90px] items-start sm:items-center gap-2 sm:gap-4 w-full">
        {/* Subtitle / Dept */}
        <span className="text-[10px] text-brand-text/50 uppercase tracking-wider truncate">
          {subtitle}
        </span>
        {/* Title */}
        <span className="text-sm font-bold text-brand-text hover:text-brand-accent transition-colors truncate sm:pr-4">
          {title}
        </span>
        {/* Badges / Tech */}
        <div className="flex flex-wrap gap-1 sm:justify-end">
          {tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-[9px] border border-brand-border/20 px-1.5 py-0.5 rounded text-brand-text/60 whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
        </div>
        {/* Expand / Collapse Indicator */}
        <span className="text-[10px] text-brand-accent/70 text-left sm:text-right font-mono font-bold">
          {isExpanded ? '[ COLLAPSE ]' : '[ DECRYPT ]'}
        </span>
      </div>

      {/* Expandable section */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[500px] opacity-100 mt-4 pl-4 border-l border-brand-accent/30' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="text-xs space-y-3 pt-2">
          <div>
            <span className="text-brand-accent block text-[9px] uppercase tracking-wider mb-0.5 font-bold">
              // SECTION 01 // THE FRICTION
            </span>
            <p className="text-brand-text/80 leading-relaxed font-sans">{friction}</p>
          </div>
          <div>
            <span className="text-brand-accent block text-[9px] uppercase tracking-wider mb-0.5 font-bold">
              // SECTION 02 // THE FIX
            </span>
            <p className="text-brand-text/80 leading-relaxed font-sans">{fix}</p>
          </div>
          <div>
            <span className="text-brand-accent block text-[9px] uppercase tracking-wider mb-0.5 font-bold">
              // SECTION 03 // THE PAYOFF
            </span>
            <p className="text-brand-text/80 leading-relaxed font-sans">{payoff}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


