import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Menu,
  FilePlus,
  FolderOpen,
  Save,
  FileCode,
  BookOpen,
  Package,
  Trash2,
} from 'lucide-react';

interface FileMenuProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExportCode: () => void;
  onExamples: () => void;
  onKits: () => void;
}

export default function FileMenu({ onNew, onOpen, onSave, onExportCode, onExamples, onKits }: FileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Compute popup position (viewport coords) when opening / on resize / scroll
  useLayoutEffect(() => {
    if (!isOpen) return;
    const update = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPopupPos({ top: rect.bottom + 4, left: rect.left });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = menuRef.current?.contains(target);
      const insidePopup = popupRef.current?.contains(target);
      if (!insideTrigger && !insidePopup) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  const handleClear = () => {
    setIsOpen(false);
    // Same handler as new project but with a different confirm prompt happens inside onNew already.
    onNew();
  };

  const popup = isOpen && popupPos && (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        top: popupPos.top,
        left: popupPos.left,
        width: 240,
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(0,0,0,0.12))',
        zIndex: 9999,
        padding: 6,
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div className="fm-section">
        <div className="fm-header">Proyecto</div>
        <FmItem
          icon={<FilePlus className="w-[15px] h-[15px]" />}
          label="Nuevo"
          shortcut="Ctrl+N"
          onClick={() => handleAction(onNew)}
        />
        <FmItem
          icon={<FolderOpen className="w-[15px] h-[15px]" />}
          label="Abrir…"
          shortcut="Ctrl+O"
          onClick={() => handleAction(onOpen)}
        />
        <FmItem
          icon={<Save className="w-[15px] h-[15px]" />}
          label="Guardar"
          shortcut="Ctrl+S"
          onClick={() => handleAction(onSave)}
        />
      </div>

      <div className="fm-section">
        <div className="fm-header">Exportar</div>
        <FmItem
          icon={<FileCode className="w-[15px] h-[15px]" />}
          label="Exportar .ino"
          onClick={() => handleAction(onExportCode)}
        />
      </div>

      <div className="fm-section">
        <div className="fm-header">Ayuda</div>
        <FmItem
          icon={<BookOpen className="w-[15px] h-[15px]" />}
          label="Ejemplos"
          onClick={() => handleAction(onExamples)}
        />
        <FmItem
          icon={<Package className="w-[15px] h-[15px]" />}
          label="Kits Ingeniables"
          onClick={() => handleAction(onKits)}
        />
      </div>

      <div className="fm-section">
        <FmItem
          icon={<Trash2 className="w-[15px] h-[15px]" />}
          label="Vaciar workspace"
          danger
          onClick={handleClear}
        />
      </div>
    </div>
  );

  return (
    <div ref={menuRef} className="relative" style={{ fontFamily: 'var(--font-ui)' }}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        title="Menú de archivo"
        aria-label="Menú archivo"
        aria-expanded={isOpen}
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          border: 0,
          background: isOpen ? 'var(--bg-subtle)' : 'transparent',
          color: 'var(--fg-2)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = isOpen ? 'var(--bg-subtle)' : 'transparent')}
      >
        <Menu className="w-[18px] h-[18px]" />
      </button>

      {popup && createPortal(popup, document.body)}

      <style>{`
        .fm-section + .fm-section {
          border-top: 1px solid var(--border);
          margin-top: 6px;
          padding-top: 6px;
        }
        .fm-header {
          padding: 4px 10px 6px;
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: var(--fg-3);
        }
        .fm-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 13px;
          color: var(--fg-1);
          transition: background 120ms var(--ease-ui);
          background: transparent;
          border: 0;
          width: 100%;
          text-align: left;
          font-family: var(--font-ui);
        }
        .fm-item:hover { background: var(--teal-bg); color: var(--teal-contrast); }
        .fm-item svg { color: var(--teal-depth); stroke-width: 2; flex-shrink: 0; }
        .fm-item:hover svg { color: var(--teal-contrast); }
        .fm-item .fm-grow { flex: 1; }
        .fm-item .fm-shortcut {
          font-family: var(--font-mono);
          font-size: 10.5px;
          color: var(--fg-3);
        }
        .fm-item.danger { color: var(--red); }
        .fm-item.danger svg { color: var(--red); }
        .fm-item.danger:hover { background: var(--red-bg); color: var(--red); }
        .fm-item.danger:hover svg { color: var(--red); }
      `}</style>
    </div>
  );
}

interface FmItemProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  danger?: boolean;
  onClick: () => void;
}

function FmItem({ icon, label, shortcut, danger, onClick }: FmItemProps) {
  return (
    <button className={`fm-item${danger ? ' danger' : ''}`} onClick={onClick}>
      {icon}
      <span className="fm-grow">{label}</span>
      {shortcut && <span className="fm-shortcut">{shortcut}</span>}
    </button>
  );
}
