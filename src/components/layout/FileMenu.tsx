import { useState, useRef, useEffect } from 'react';

interface FileMenuProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExportCode: () => void;
  onExamples: () => void;
}

export default function FileMenu({ onNew, onOpen, onSave, onExportCode, onExamples }: FileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        title="Menú de archivo"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50">
          <button
            onClick={() => handleAction(onNew)}
            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="text-base">📄</span>
            Nuevo proyecto
          </button>
          <button
            onClick={() => handleAction(onOpen)}
            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="text-base">📂</span>
            Abrir proyecto (.ib)
          </button>
          <button
            onClick={() => handleAction(onSave)}
            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="text-base">💾</span>
            Guardar proyecto (.ib)
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => handleAction(onExportCode)}
            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="text-base">📝</span>
            Exportar código (.ino)
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => handleAction(onExamples)}
            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="text-base">📚</span>
            Ejemplos
          </button>
        </div>
      )}
    </div>
  );
}
