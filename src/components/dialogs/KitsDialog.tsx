import { useState } from 'react';
import { X, Package, Cpu, Check } from 'lucide-react';
import { kits } from '../../data/kits';
import type { KitProject } from '../../data/kits';

interface KitsDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (kit: KitProject) => void;
}

const boardLabels: Record<string, string> = {
  'arduino-nano': 'Arduino Nano',
  'esp32-c3': 'ESP32-C3',
  'esp32-wroom': 'ESP32 WROOM',
};

export default function KitsDialog({ open, onClose, onSelect }: KitsDialogProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
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
          width: 760,
          maxHeight: '88vh',
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
            background: 'var(--yellow-light, #fff7d6)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package className="w-[18px] h-[18px]" style={{ color: 'var(--ink)' }} />
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  margin: 0,
                  color: 'var(--ink)',
                }}
              >
                Kits Ingeniables
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
                Recupera el programa original de cada kit y reprográmalo a tu manera.
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
              gap: 16,
            }}
          >
            {kits.map((kit) => (
              <KitCard key={kit.id} kit={kit} onSelect={onSelect} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 11.5, color: 'var(--fg-3)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            Al cargar un kit se reemplaza el contenido actual del workspace.
          </span>
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
        .kit-card-btn:hover {
          border-color: var(--teal) !important;
          box-shadow: var(--shadow-md, 0 8px 24px rgba(0,0,0,0.08));
          transform: translateY(-2px);
        }
        .kit-card-btn:hover .kit-load-cta {
          background: var(--teal);
          color: #fff;
        }
      `}</style>
    </div>
  );

  // ────────────────────────────────────────────────────────────────────
  //  Card
  // ────────────────────────────────────────────────────────────────────
  function KitCard({ kit, onSelect }: { kit: KitProject; onSelect: (k: KitProject) => void }) {
    const [imgFailed, setImgFailed] = useState(false);
    return (
      <button
        onClick={() => onSelect(kit)}
        className="kit-card-btn"
        style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
          transition:
            'border-color 200ms var(--ease-smooth), box-shadow 200ms var(--ease-smooth), transform 200ms var(--ease-smooth)',
          fontFamily: 'var(--font-ui)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Imagen / placeholder */}
        <div
          style={{
            height: 200,
            background:
              'linear-gradient(135deg, var(--teal-bg, #e0f2f4) 0%, var(--yellow-light, #fff7d6) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            padding: 12,
          }}
        >
          {!imgFailed ? (
            <img
              src={`${import.meta.env.BASE_URL}${kit.image}`}
              alt={kit.name}
              onError={() => setImgFailed(true)}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            <span style={{ fontSize: 64, lineHeight: 1 }}>{kit.emoji}</span>
          )}
        </div>

        {/* Texto */}
        <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{kit.name}</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                marginLeft: 'auto',
                background: 'var(--teal-bg)',
                color: 'var(--teal-contrast)',
                padding: '1px 8px',
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 600,
              }}
            >
              <Cpu className="w-[10px] h-[10px]" />
              {boardLabels[kit.boardId] ?? kit.boardId}
            </span>
          </div>
          <p
            style={{
              margin: '0 0 10px',
              fontSize: 12.5,
              color: 'var(--fg-3)',
              lineHeight: 1.5,
            }}
          >
            {kit.description}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', flex: 1 }}>
            {kit.features.map((f) => (
              <li
                key={f}
                style={{
                  fontSize: 11.5,
                  color: 'var(--fg-2)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  padding: '2px 0',
                }}
              >
                <Check className="w-[12px] h-[12px]" style={{ color: 'var(--teal)', marginTop: 2, flexShrink: 0 }} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div
            className="kit-load-cta"
            style={{
              alignSelf: 'flex-start',
              background: 'var(--bg-subtle)',
              color: 'var(--fg-2)',
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: 700,
              transition: 'background 160ms var(--ease-ui), color 160ms var(--ease-ui)',
            }}
          >
            Cargar programa original →
          </div>
        </div>
      </button>
    );
  }
}
