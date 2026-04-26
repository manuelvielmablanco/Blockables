import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Cpu, ChevronDown, Check, X } from 'lucide-react';
import { useBoard } from '../../context/BoardContext';
import { boards } from '../../boards';

const thumbColorByBoard: Record<string, string> = {
  'arduino-nano': 'var(--teal)',
  'esp32-c3':     'var(--blue)',
  'esp32-wroom':  'var(--blue-depth)',
};

function thumbColor(id: string): string {
  return thumbColorByBoard[id] ?? 'var(--teal-depth)';
}

export default function BoardSelector() {
  const { board, setBoard } = useBoard();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = wrapRef.current?.contains(target);
      const insidePopup = popupRef.current?.contains(target);
      if (!insideTrigger && !insidePopup) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleSelect = (id: string) => {
    setBoard(id);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', fontFamily: 'var(--font-ui)' }}>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Seleccionar placa"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 12px',
          background: 'var(--teal-bg)',
          color: 'var(--teal-contrast)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          fontWeight: 600,
          border: 0,
          cursor: 'pointer',
          fontFamily: 'var(--font-ui)',
          transition: 'background 150ms var(--ease-ui)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--teal-soft)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--teal-bg)')}
      >
        <Cpu className="w-[14px] h-[14px]" />
        <span>{board.name}</span>
        <ChevronDown className="w-[14px] h-[14px]" />
      </button>

      {open && pos && createPortal(
        <div
          ref={popupRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: 320,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(0,0,0,0.12))',
            zIndex: 9999,
            overflow: 'hidden',
            fontFamily: 'var(--font-ui)',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--teal-bg)',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              color: 'var(--teal-contrast)',
              fontFamily: 'var(--font-mono)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Selecciona placa</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              style={{
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                color: 'var(--fg-3)',
                padding: 0,
                width: 22,
                height: 22,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
              }}
            >
              <X className="w-[14px] h-[14px]" />
            </button>
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {boards.map((b) => {
              const selected = b.id === board.id;
              return (
                <button
                  key={b.id}
                  onClick={() => handleSelect(b.id)}
                  className="board-option-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 120ms var(--ease-ui)',
                    background: selected ? 'var(--teal-bg)' : '#fff',
                    border: 0,
                    width: '100%',
                    textAlign: 'left',
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 36,
                      borderRadius: 'var(--radius-sm)',
                      background: thumbColor(b.id),
                      flexShrink: 0,
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                    aria-hidden
                  >
                    {b.shortName?.slice(0, 4) ?? b.name.slice(0, 4)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: selected ? 'var(--teal-contrast)' : 'var(--ink)',
                        margin: 0,
                      }}
                    >
                      {b.name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10.5,
                        color: 'var(--fg-3)',
                        marginTop: 2,
                      }}
                    >
                      {b.chip} · {b.voltage}V · {b.flashSize}
                    </div>
                  </div>
                  {selected && (
                    <Check className="w-[18px] h-[18px]" style={{ color: 'var(--teal)', flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .board-option-btn:hover { background: var(--teal-bg) !important; }
      `}</style>
    </div>
  );
}
