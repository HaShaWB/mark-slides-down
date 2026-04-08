import React, { useRef, useEffect, useState } from 'react';
import mermaid from 'mermaid';

let initialized = false;
let idCounter = 0;

function ensureInit() {
  if (initialized) return;
  initialized = true;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'sans-serif',
  });
}

interface MermaidDiagramProps {
  code: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const id = `mmd-${++idCounter}`;

    ensureInit();

    mermaid.render(id, code)
      .then(({ svg }) => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(typeof err === 'string' ? err : err?.message || 'Diagram render error');
        }
      });

    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <div style={{ padding: '0.5em' }}>
        <pre style={{ color: '#f88', fontSize: 14, whiteSpace: 'pre-wrap' }}>{error}</pre>
        <pre style={{ color: '#888', fontSize: 12, marginTop: 8 }}>{code}</pre>
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%' }} />;
};
