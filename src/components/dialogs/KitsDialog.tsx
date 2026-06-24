import { useState } from 'react';
import { X, Package, Cpu, Check, ArrowLeft } from 'lucide-react';
import { kits } from '../../data/kits';
import type { KitProject, KitVariant, KitLoadable } from '../../data/kits';

interface KitsDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (loadable: KitLoadable) => void;
}

const boardLabels: Record<string, string> = {
  'arduino-nano': 'Arduino Nano',
  'esp32-c3': 'ESP32-C3',
  'esp32-wroom': 'ESP32 WROOM',
};

export default function KitsDialog({ open, onClose, onSelect }: KitsDialogProps) {
  // Cuando se elige un kit con variantes, guardamos cuál para mostrar el
  // paso de selección de módulo. null = mostrar la rejilla de kits.
  const [variantKit, setVariantKit] = useState<KitProject | null>(null);

  if (!open) return null;

  const handleClose = () => {
    setVariantKit(null);
    onClose();
  };

  const handleKitClick = (kit: KitProject) => {
    if (kit.variants && kit.variants.length > 0) {
      setVariantKit(kit);
    } else {
      onSelect({ name: kit.name, boardId: kit.boardId, workspace: kit.workspace, hbXml: kit.hbXml });
    }
  };

  const handleVariantClick = (kit: KitProject, variant: KitVariant) => {
    onSelect({
      name: kit.name,
      boardId: kit.boardId,
      workspace: variant.workspace,
      hbXml: variant.hbXml,
    });
    setVariantKit(null);
  };

  const inVariantStep = variantKit !== null;

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
          width: inVariantStep ? 760 : kits.length >= 3 ? 980 : 760,
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
            {inVariantStep ? (
              <button
                onClick={() => setVariantKit(null)}
                aria-label="Volver"
                title="Volver a los kits"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,.7)',
                  border: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink)',
                  flexShrink: 0,
                }}
              >
                <ArrowLeft className="w-[16px] h-[16px]" />
              </button>
            ) : (
              <Package className="w-[18px] h-[18px]" style={{ color: 'var(--ink)' }} />
            )}
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  margin: 0,
                  color: 'var(--ink)',
                }}
              >
                {inVariantStep ? variantKit!.name : 'Kits Ingeniables'}
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
                {inVariantStep
                  ? 'Elige tu versión de hardware para cargar el programa correcto.'
                  : 'Recupera el programa original de cada kit y reprográmalo a tu manera.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
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
          {inVariantStep ? (
            <VariantPicker kit={variantKit!} onPick={handleVariantClick} />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${kits.length >= 3 ? 3 : 2}, 1fr)`,
                gap: 16,
              }}
            >
              {kits.map((kit) => (
                <KitCard key={kit.id} kit={kit} onSelect={handleKitClick} />
              ))}
            </div>
          )}
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
            onClick={inVariantStep ? () => setVariantKit(null) : handleClose}
            className="btn"
            style={{ background: '#fff', color: 'var(--fg-2)', border: '1px solid var(--border)' }}
          >
            {inVariantStep ? 'Volver' : 'Cerrar'}
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
}

// ────────────────────────────────────────────────────────────────────
//  Selección de variante (módulo de hardware)
// ────────────────────────────────────────────────────────────────────
function VariantPicker({
  kit,
  onPick,
}: {
  kit: KitProject;
  onPick: (kit: KitProject, variant: KitVariant) => void;
}) {
  return (
    <div>
      <p
        style={{
          margin: '0 0 18px',
          fontSize: 14,
          color: 'var(--fg-1)',
          lineHeight: 1.55,
          fontWeight: 600,
        }}
      >
        {kit.variantPrompt}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${(kit.variants?.length ?? 2) >= 2 ? 2 : 1}, 1fr)`,
          gap: 16,
        }}
      >
        {kit.variants?.map((variant) => (
          <VariantCard key={variant.id} variant={variant} onClick={() => onPick(kit, variant)} />
        ))}
      </div>
    </div>
  );
}

function VariantCard({ variant, onClick }: { variant: KitVariant; onClick: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <button
      onClick={onClick}
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
      <div
        style={{
          height: 210,
          background: imgFailed
            ? 'linear-gradient(135deg, var(--teal-bg, #e0f2f4) 0%, var(--yellow-light, #fff7d6) 100%)'
            : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 10,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {!imgFailed ? (
          <img
            src={`${import.meta.env.BASE_URL}${variant.image}`}
            alt={variant.label}
            onError={() => setImgFailed(true)}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <span style={{ fontSize: 56, lineHeight: 1 }}>🔧</span>
        )}
      </div>
      <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
          {variant.label}
        </span>
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--fg-3)', lineHeight: 1.5, flex: 1 }}>
          {variant.description}
        </p>
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
          Cargar este programa →
        </div>
      </div>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────
//  Card de kit
// ────────────────────────────────────────────────────────────────────
function KitCard({ kit, onSelect }: { kit: KitProject; onSelect: (k: KitProject) => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasVariants = !!(kit.variants && kit.variants.length > 0);
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
          {hasVariants ? 'Elegir versión →' : 'Cargar programa original →'}
        </div>
      </div>
    </button>
  );
}
