import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  code: string;
}

export default function CodeViewer({ code }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className="shrink-0 flex flex-col"
      style={{
        width: 380,
        background: '#fff',
        borderLeft: '1px solid var(--border)',
        fontFamily: 'var(--font-ui)',
      }}
    >
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
