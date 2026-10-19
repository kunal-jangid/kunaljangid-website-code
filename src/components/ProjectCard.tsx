import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectCardProps {
  index?: number;
  title: string;
  subtitle: string;
  tags: string[];
  friction: string;
  fix: string;
  payoff: string;
}

export default function ProjectCard({ index, title, subtitle, tags, friction, fix, payoff }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    const handleCommand = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { action, value } = customEvent?.detail || {};
      if (action === 'filter-tech') {
        const query = (value || '').toLowerCase().trim();
        const hasTag = tags.some(t => t.toLowerCase().includes(query)) || title.toLowerCase().includes(query);
        if (query === 'all' || query === '') {
          setIsHidden(false);
          setIsHighlighted(false);
        } else if (hasTag) {
          setIsHidden(false);
          setIsHighlighted(true);
        } else {
          setIsHidden(true);
          setIsHighlighted(false);
        }
      }
    };

    window.addEventListener('terminal-command', handleCommand);
    return () => window.removeEventListener('terminal-command', handleCommand);
  }, [tags, title]);

  if (isHidden) return null;

  const formattedIndex = index ? String(index).padStart(2, '0') : '01';

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  };

  return (
    <div
      onClick={toggleExpand}
      className={`py-5 flex flex-col cursor-pointer transition-all duration-200 select-none text-left w-full ${
        isHighlighted ? 'bg-brand-surface border-l-2 border-l-brand-accent pl-3' : 'hover:bg-brand-surface/40'
      }`}
    >
      {/* Line 1: Index Number, Dept & Toggle indicator */}
      <div className="flex items-center justify-between w-full text-[10px] text-brand-muted uppercase tracking-wider mb-2 gap-4 font-mono">
        <div className="flex items-center gap-2 truncate">
          <span className="text-brand-accent font-semibold">{formattedIndex} //</span>
          <span className="truncate">{subtitle}</span>
        </div>
        <span className="text-brand-text border border-brand-border bg-brand-surface px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider shrink-0 whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px]">
          {isExpanded ? '[-] COLLAPSE' : '[+] VIEW ENTRY'}
        </span>
      </div>

      {/* Line 2: Project Title (Fraunces Editorial Serif) */}
      <h3 className="text-lg md:text-xl font-display font-medium text-brand-text hover:text-brand-accent transition-colors mb-3 leading-snug tracking-tight">
        {title}
      </h3>

      {/* Line 3: Tactile Stamps (Badges) */}
      <div className="flex flex-wrap gap-1.5 w-full">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="text-[9px] font-mono border border-brand-border bg-brand-surface px-2 py-0.5 rounded text-brand-text/80 whitespace-nowrap hover:bg-brand-text hover:text-brand-bg transition-colors duration-150"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Expandable section */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="project-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden mt-4 pl-4 border-l border-brand-border"
          >
            <div className="text-xs space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border-t border-brand-border/40 pt-3">
                <span className="text-brand-accent font-semibold font-mono text-[10px] uppercase tracking-widest block md:col-span-1">
                  CHALLENGE
                </span>
                <p className="text-brand-text leading-relaxed font-sans text-xs md:col-span-3">{friction}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border-t border-brand-border/40 pt-3">
                <span className="text-brand-accent font-semibold font-mono text-[10px] uppercase tracking-widest block md:col-span-1">
                  RESOLUTION
                </span>
                <p className="text-brand-text leading-relaxed font-sans text-xs md:col-span-3">{fix}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border-t border-brand-border/40 pt-3">
                <span className="text-brand-accent font-semibold font-mono text-[10px] uppercase tracking-widest block md:col-span-1">
                  PAYOFF
                </span>
                <p className="text-brand-text leading-relaxed font-sans text-xs md:col-span-3">{payoff}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


