import { useState, useCallback } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  code: string;
}

const MIN_WIDTH = 280;
const DEFAULT_WIDTH = 380;
const WIDTH_KEY = 'ingeniables.codeViewerWidth';

export default function CodeViewer({ code }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [width, setWidth] = useState<number>(() => {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    return saved >= MIN_WIDTH ? saved : DEFAULT_WIDTH;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  // Arrastrar el borde izquierdo para ensanchar/estrechar el panel.
  // Mover hacia la izquierda = más ancho (el panel está pegado a la derecha).
  const startResize = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = width;
      const maxW = () => Math.max(MIN_WIDTH, window.innerWidth - 360);
      const onMove = (ev: PointerEvent) => {
        const next = Math.min(Math.max(MIN_WIDTH, startW + (startX - ev.clientX)), maxW());
        setWidth(next);
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        setWidth((w) => {
          localStorage.setItem(WIDTH_KEY, String(w));
          return w;
        });
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [width],
  );

  return (
    <div
      className="shrink-0 flex flex-col relative"
      style={{
        width,
        background: '#fff',
        borderLeft: '1px solid var(--border)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* Tirador de redimensionado (borde izquierdo) */}
      <div
        onPointerDown={startResize}
        title="Arrastra para ampliar el panel de código"
        className="code-resize-handle"
        style={{
          position: 'absolute',
          left: -4,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: 'col-resize',
          zIndex: 5,
        }}
      />
      <style>{`
        .code-resize-handle::after {
          content: '';
          position: absolute;
          left: 3px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: transparent;
          transition: background 140ms var(--ease-ui);
        }
        .code-resize-handle:hover::after { background: var(--teal); }
      `}</style>
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--teal-contrast)',
            fontFamily: 'var(--font-ui)',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
          }}
        >
          Código Arduino
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: '1px solid var(--teal)',
            color: 'var(--teal-depth)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
            transition: 'background 150ms var(--ease-ui)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--teal-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {copied ? <Check className="w-[12px] h-[12px]" /> : <Copy className="w-[12px] h-[12px]" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <Highlight theme={themes.github} code={code} language="cpp">
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              style={{
                ...style,
                margin: 0,
                padding: '14px 16px',
                fontSize: 13,
                lineHeight: 1.6,
                background: 'transparent',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 24,
                      textAlign: 'right',
                      marginRight: 14,
                      color: 'var(--fg-3)',
                      userSelect: 'none',
                      fontSize: 11,
                    }}
                  >
                    {i + 1}
                  </span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}
