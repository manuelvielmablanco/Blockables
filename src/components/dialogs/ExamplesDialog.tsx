import { examples } from '../../data/examples';
import type { ExampleProject } from '../../data/examples';

interface ExamplesDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (example: ExampleProject) => void;
}

const difficultyColors = {
  principiante: 'bg-green-100 text-green-700',
  intermedio: 'bg-yellow-100 text-yellow-700',
  avanzado: 'bg-red-100 text-red-700',
};

export default function ExamplesDialog({ open, onClose, onSelect }: ExamplesDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-base font-bold text-brand-black font-heading">
            📚 Proyectos de ejemplo
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => onSelect(example)}
                className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-brand-teal hover:bg-brand-teal/5 transition-all text-left group"
              >
                <span className="text-2xl shrink-0 mt-0.5">{example.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-brand-black group-hover:text-brand-teal transition-colors">
                      {example.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${difficultyColors[example.difficulty]}`}>
                      {example.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{example.description}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Placa: {example.boardId === 'arduino-nano' ? '🔵 Arduino Nano' :
                           example.boardId === 'esp32-c3' ? '🟢 ESP32-C3' :
                           '🟣 ESP32 WROOM'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
