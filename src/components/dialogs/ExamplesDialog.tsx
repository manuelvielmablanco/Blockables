import { X, Lightbulb, BookOpen, Cpu } from 'lucide-react';
import { examples } from '../../data/examples';
import type { ExampleProject } from '../../data/examples';

interface ExamplesDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (example: ExampleProject) => void;
}

const difficultyStyles: Record<ExampleProject['difficulty'], { bg: string; color: string; label: string }> = {
  principiante: { bg: 'var(--yellow-light)', color: 'var(--ink)',          label: 'principiante' },
  intermedio:   { bg: 'var(--blue-soft)',    color: 'var(--blue-contrast)', label: 'intermedio'   },
  avanzado:     { bg: 'var(--red-soft)',     color: 'var(--red-contrast)',  label: 'avanzado'     },
};

const boardLabels: Record<string, string> = {
  'arduino-nano': 'Arduino Nano',
  'esp32-c3':     'ESP32-C3',
  'esp32-wroom':  'ESP32 WROOM',
};

export default function ExamplesDialog({ open, onClose, onSelect }: ExamplesDialogProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,63,70,0.42)',
        backdropFilter: 'blur(3px)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: 720,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--teal-bg)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen className="w-[18px] h-[18px]" style={{ color: 'var(--teal-contrast)' }} />
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  margin: 0,
                  color: 'var(--ink)',
                }}
              >
                Proyectos de ejemplo
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  color: 'var(--fg-3)',
                  fontSize: 12,
                  margin: '2px 0 0',
                }}
              >
                Explora ideas listas para abrir y modificar.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.7)',
              border: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--fg-2)',
            }}
          >
            <X className="w-[16px] h-[16px]" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 14,
            }}
          >
            {examples.map((example) => {
              const diff = difficultyStyles[example.difficulty];
              return (
                <button
                  key={example.id}
                  onClick={() => onSelect(example)}
                  className="example-card-btn"
                  style={{
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    transition: 'border-color 200ms var(--ease-smooth), box-shadow 200ms var(--ease-smooth), transform 200ms var(--ease-smooth)',
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--teal-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'var(--teal-contrast)',
                    }}
                  >
                    <Lightbulb className="w-[22px] h-[22px]" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                        {example.name}
                      </span>
                      <span
                        style={{
                          background: diff.bg,
                          color: diff.color,
                          padding: '1px 8px',
                          borderRadius: 999,
                          fontWeight: 700,
                          fontSize: 10.5,
                          fontFamily: 'var(--font-ui)',
                        }}
                      >
                        {diff.label}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '0 0 8px',
                        fontSize: 12.5,
                        color: 'var(--fg-3)',
                        lineHeight: 1.5,
                      }}
                    >
                      {example.description}
                    </p>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'var(--teal-bg)',
                        color: 'var(--teal-contrast)',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 10.5,
                        fontWeight: 600,
                      }}
                    >
                      <Cpu className="w-[11px] h-[11px]" />
                      {boardLabels[example.boardId] ?? example.boardId}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            className="btn"
            style={{ background: '#fff', color: 'var(--fg-2)', border: '1px solid var(--border)' }}
          >
            Cerrar
          </button>
        </div>
      </div>

      <style>{`
        .example-card-btn:hover {
          border-color: var(--teal) !important;
          box-shadow: var(--shadow-sm);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
