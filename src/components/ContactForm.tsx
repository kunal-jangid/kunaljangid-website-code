import React, { useState, useRef } from 'react';

interface ContactFormProps {
  alwaysOpen?: boolean;
}

export default function ContactForm({ alwaysOpen = false }: ContactFormProps) {
  const [isOpen, setIsOpen] = useState(alwaysOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const toggleDrawer = () => {
    if (alwaysOpen) return;
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setTimeout(() => {
        drawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name'),
      contact: formData.get('contact'),
      message: formData.get('message'),
      system_integrity_hash: formData.get('system_integrity_hash')
    };

    const WORKER_ENDPOINT = 'https://spotify-telemetry.kunaljangid2k3.workers.dev';

    try {
      const response = await fetch(WORKER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error();

      setSuccess(true);
    } catch (err) {
      alert('Transmission failed. Please reach out directly via email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {!alwaysOpen && (
        <button
          onClick={toggleDrawer}
          className="text-xs font-mono uppercase tracking-wider border border-brand-border px-8 py-3 rounded hover:bg-brand-text hover:text-brand-bg transition-all duration-200"
        >
          {isOpen ? '[ Close Terminal Drop Box ]' : '[ Want to contact me? Click here ]'}
        </button>
      )}

      {(isOpen || alwaysOpen) && (
        <div
          ref={drawerRef}
          className={`w-full max-w-xl mx-auto glass-panel p-8 rounded-2xl transition-all duration-300 ${
            !alwaysOpen ? 'mt-8' : ''
          }`}
        >
          {success ? (
            <div className="text-center text-xs font-mono py-4 text-brand-accent animate-pulse">
              [ System Status: Message transmitted to Kunal successfully ]
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-sm text-left">
              {/* Honeypot anti-spam capture mesh */}
              <div className="hidden" aria-hidden="true">
                <label>Do not fill this text field if you are human:</label>
                <input type="text" name="system_integrity_hash" autoComplete="off" tabIndex={-1} />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">01 // Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your identity"
                  className="w-full bg-transparent border-b border-brand-border/40 focus:border-brand-accent py-1 outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">
                  02 // Email Address or Phone Number
                </label>
                <input
                  type="text"
                  name="contact"
                  required
                  placeholder="Your routing endpoint"
                  className="w-full bg-transparent border-b border-brand-border/40 focus:border-brand-accent py-1 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">03 // Content</label>
                <textarea
                  name="message"
                  rows={3}
                  required
                  placeholder="Type payload details here..."
                  className="w-full bg-transparent border-b border-brand-border/40 focus:border-brand-accent py-1 outline-none resize-none transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-xs uppercase tracking-wider border border-brand-border px-8 py-3 rounded hover:bg-brand-text hover:text-brand-bg transition-all duration-150 w-full sm:w-auto disabled:opacity-50"
                >
                  {isSubmitting ? 'Transmitting...' : 'Transmit Message'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
