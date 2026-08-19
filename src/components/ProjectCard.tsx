import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
      className={`border-b border-brand-border/20 py-4 flex flex-col cursor-pointer transition-all duration-200 select-none text-left w-full font-mono ${
        isHighlighted ? 'bg-brand-accent/5 border-l-2 border-l-brand-accent pl-2' : ''
      }`}
    >
      {/* Line 1: Dept & Decrypt indicator */}
      <div className="flex items-center justify-between w-full text-[10px] text-brand-text/50 uppercase tracking-wider mb-2 gap-4">
        <span className="truncate pr-2">{subtitle}</span>
        <span className="text-brand-accent/70 font-bold shrink-0 whitespace-nowrap">
          {isExpanded ? '[ COLLAPSE ]' : '[ DECRYPT ]'}
        </span>
      </div>

      {/* Line 2: Project Title */}
      <h3 className="text-base font-bold text-brand-text hover:text-brand-accent transition-colors mb-2.5 leading-snug">
        {title}
      </h3>

      {/* Line 3: Badges */}
      <div className="flex flex-wrap gap-1.5 w-full">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="text-[9px] border border-brand-border/20 px-1.5 py-0.5 rounded text-brand-text/60 whitespace-nowrap"
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
            className="overflow-hidden mt-4 pl-4 border-l-2 border-brand-accent/40"
          >
            <div className="text-xs space-y-4 pt-2 font-mono">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border-t border-brand-border/10 pt-3">
                <span className="text-brand-accent font-bold text-[9px] uppercase tracking-widest block md:col-span-1">
                  [PROBLEM]
                </span>
                <p className="text-brand-text/85 leading-relaxed font-sans text-xs md:col-span-3">{friction}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border-t border-brand-border/10 pt-3">
                <span className="text-brand-accent font-bold text-[9px] uppercase tracking-widest block md:col-span-1">
                  [RESOLUTION]
                </span>
                <p className="text-brand-text/85 leading-relaxed font-sans text-xs md:col-span-3">{fix}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border-t border-brand-border/10 pt-3">
                <span className="text-brand-accent font-bold text-[9px] uppercase tracking-widest block md:col-span-1">
                  [OUTCOME]
                </span>
                <p className="text-brand-text/85 leading-relaxed font-sans text-xs md:col-span-3">{payoff}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


