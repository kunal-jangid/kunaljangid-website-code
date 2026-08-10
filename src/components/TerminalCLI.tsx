import React, { useState, useRef, useEffect } from 'react';

interface LogLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success';
}

export default function TerminalCLI() {
  const [history, setHistory] = useState<LogLine[]>([
    { text: 'Kunal Quant-HUD [Version 1.0.0]', type: 'output' },
    { text: 'Type "help" for a list of system commands.', type: 'output' },
  ]);
  const [inputVal, setInputVal] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  // Listen to '/' key to focus terminal globally
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const newHistory = [...history, { text: `[usr@kunaljangid.com]:~$ ${trimmed}`, type: 'input' as const }];

    switch (command) {
      case 'help':
        newHistory.push(
          { text: 'Available system directives:', type: 'success' },
          { text: '  about      - Display systems engineer credentials.', type: 'output' },
          { text: '  projects   - Trigger expansion of project ledger.', type: 'output' },
          { text: '  contact    - Redirect connection to Transmit Endpoint.', type: 'output' },
          { text: '  clear      - Purge terminal console logs.', type: 'output' },
          { text: '  /tech [tag]- Filter project ledger (e.g. /tech react).', type: 'output' }
        );
        break;
      case 'about':
        newHistory.push({
          text: 'Kunal Jangid: Software Engineer at OSTTRA. Building high-performance quantitative fintech systems.',
          type: 'output',
        });
        break;
      case 'clear':
        setHistory([]);
        setInputVal('');
        return;
      case 'projects':
        newHistory.push({ text: 'Triggering ledger decryption protocols...', type: 'success' });
        window.dispatchEvent(new CustomEvent('terminal-command', { detail: { action: 'expand-projects' } }));
        break;
      case 'contact':
        newHistory.push({ text: 'Rerouting routing endpoints to contact form...', type: 'success' });
        setTimeout(() => {
          window.location.href = '/contact';
        }, 800);
        break;
      case '/tech':
        if (args.length === 0) {
          newHistory.push({ text: 'Error: Directives requires tech name argument (e.g. /tech react)', type: 'error' });
        } else {
          const tech = args.join(' ');
          newHistory.push({ text: `Filtering ledger nodes matching: ${tech}`, type: 'success' });
          window.dispatchEvent(new CustomEvent('terminal-command', { detail: { action: 'filter-tech', value: tech } }));
        }
        break;
      default:
        newHistory.push({ text: `Command not found: "${command}". Type "help" for instructions.`, type: 'error' });
    }

    setHistory(newHistory);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(inputVal);
    }
  };

  return (
    <div className="w-full glass-panel border border-brand-border/20 rounded-xl p-5 flex flex-col justify-between font-mono text-xs text-left h-[420px]">
      {/* Scrollable logs area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-1 mb-2 pr-1 no-scrollbar select-text">
        {history.map((line, idx) => {
          let colorClass = 'text-brand-text';
          if (line.type === 'input') colorClass = 'text-brand-text opacity-70';
          if (line.type === 'error') colorClass = 'text-destructive';
          if (line.type === 'success') colorClass = 'text-brand-accent';
          return (
            <div key={idx} className={`${colorClass} leading-relaxed whitespace-pre-wrap break-all`}>
              {line.text}
            </div>
          );
        })}
      </div>

      {/* Input prompt area */}
      <div className="flex items-center gap-2 border-t border-brand-border/20 pt-3">
        <span className="text-brand-accent font-bold shrink-0">[usr@kunal]:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command (or '/' to focus)..."
          className="flex-1 bg-transparent text-brand-text outline-none border-none caret-brand-accent p-0 font-mono text-xs placeholder:text-brand-text/30"
        />
      </div>
    </div>
  );
}
