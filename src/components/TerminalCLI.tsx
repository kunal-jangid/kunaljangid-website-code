import React, { useState, useRef, useEffect } from 'react';

interface LogLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success';
}

interface TerminalCLIProps {
  autoBootContact?: boolean;
}

export default function TerminalCLI({ autoBootContact = false }: TerminalCLIProps) {
  const [history, setHistory] = useState<LogLine[]>([
    { text: 'kamel shell [Version 1.0.0]', type: 'output' },
    { text: 'Type "help" for a list of system commands.', type: 'output' },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [wizardStep, setWizardStep] = useState<'name' | 'email' | 'message' | null>(null);
  const [formData, setFormData] = useState({ name: '', contact: '', message: '' });
  
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

  // Trigger contact wizard on boot if requested
  useEffect(() => {
    if (autoBootContact) {
      setHistory([
        { text: 'kamel shell [Version 1.0.0]', type: 'output' },
        { text: 'Initializing Payload Transmission Wizard...', type: 'success' },
        { text: 'Please enter your Identity/Name:', type: 'output' }
      ]);
      setWizardStep('name');
    }
  }, [autoBootContact]);

  const handleCommand = async (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    // Handle wizard step flow
    if (wizardStep !== null) {
      const promptLabel = getPromptText();
      const newHistory = [...history, { text: `${promptLabel} ${trimmed}`, type: 'input' as const }];
      
      if (wizardStep === 'name') {
        setFormData(prev => ({ ...prev, name: trimmed }));
        newHistory.push(
          { text: `[SYSTEM] Identity registered: "${trimmed}"`, type: 'success' },
          { text: 'Please enter your Contact Email/Routing Endpoint:', type: 'output' }
        );
        setWizardStep('email');
        setHistory(newHistory);
        setInputVal('');
      } else if (wizardStep === 'email') {
        setFormData(prev => ({ ...prev, contact: trimmed }));
        newHistory.push(
          { text: `[SYSTEM] Endpoint registered: "${trimmed}"`, type: 'success' },
          { text: 'Enter message payload details:', type: 'output' }
        );
        setWizardStep('message');
        setHistory(newHistory);
        setInputVal('');
      } else if (wizardStep === 'message') {
        newHistory.push(
          { text: `[SYSTEM] Payload details accepted.`, type: 'success' },
          { text: 'Transmitting secure connection to worker endpoint...', type: 'output' }
        );
        
        setHistory(newHistory);
        setInputVal('');
        
        try {
          const response = await fetch('https://spotify-telemetry.kunaljangid2k3.workers.dev', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.name,
              contact: formData.contact,
              message: trimmed,
              system_integrity_hash: ''
            })
          });

          if (!response.ok) throw new Error();
          
          setHistory(prev => [
            ...prev,
            { text: '[SUCCESS] Connection confirmed. Payload routed successfully to Kunal.', type: 'success' },
            { text: 'Wizard completed. Prompt listening for standard directives.', type: 'output' }
          ]);
        } catch (e) {
          setHistory(prev => [
            ...prev,
            { text: '[ERROR] Transmission failed. Connection closed. Please try again or email thekunaljangid@gmail.com.', type: 'error' },
            { text: 'Wizard terminated. Prompt listening for standard directives.', type: 'output' }
          ]);
        }
        setWizardStep(null);
        setFormData({ name: '', contact: '', message: '' });
      }
      return;
    }

    // Standard command processing
    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const newHistory = [...history, { text: `[usr@kunal]:~$ ${trimmed}`, type: 'input' as const }];

    switch (command) {
      case 'help':
        newHistory.push(
          { text: 'Available system directives:', type: 'success' },
          { text: '  about      - Display systems engineer credentials.', type: 'output' },
          { text: '  projects   - Trigger expansion of project ledger.', type: 'output' },
          { text: '  contact    - Launch secure payload communication wizard.', type: 'output' },
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
        newHistory.push(
          { text: 'Initializing Payload Transmission Wizard...', type: 'success' },
          { text: 'Please enter your Identity/Name:', type: 'output' }
        );
        setWizardStep('name');
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

  const getPlaceholder = () => {
    if (wizardStep === 'name') return 'Enter your identity...';
    if (wizardStep === 'email') return 'Enter email routing endpoint...';
    if (wizardStep === 'message') return 'Enter message details...';
    return "Type command (or '/' to focus)...";
  };

  const getPromptText = () => {
    if (wizardStep === 'name') return '[usr@kunal][step-1/3]:~$';
    if (wizardStep === 'email') return '[usr@kunal][step-2/3]:~$';
    if (wizardStep === 'message') return '[usr@kunal][step-3/3]:~$';
    return '[usr@kunal]:~$';
  };

  return (
    <div className="w-full glass-panel border border-brand-border/20 rounded-xl p-5 flex flex-col justify-between font-mono text-xs text-left h-[420px] bklit-glow">
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
        <span className="text-brand-accent font-bold shrink-0">{getPromptText()}</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          className="flex-1 bg-transparent text-brand-text outline-none border-none caret-brand-accent p-0 font-mono text-xs placeholder:text-brand-text/30"
        />
      </div>
    </div>
  );
}
