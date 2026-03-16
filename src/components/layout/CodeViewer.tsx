import { Highlight, themes } from 'prism-react-renderer';

interface CodeViewerProps {
  code: string;
}

export default function CodeViewer({ code }: CodeViewerProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="w-[400px] flex flex-col border-l border-gray-200 bg-white shrink-0">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-sm font-semibold text-gray-700">Código Arduino</span>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 transition-colors font-medium"
        >
          Copiar
        </button>
      </div>
      <div className="flex-1 overflow-auto p-0">
        <Highlight theme={themes.github} code={code} language="cpp">
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              style={{ ...style, margin: 0, padding: '16px', fontSize: '13px', lineHeight: '1.5', background: 'transparent' }}
              className="font-mono"
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span className="inline-block w-8 text-right mr-4 text-gray-400 select-none text-xs">
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
