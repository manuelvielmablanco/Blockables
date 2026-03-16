import { useState, useRef, useEffect } from 'react';
import type { SerialLine } from '../../hooks/useSerial';
import type { ConnectionStatus } from '../../services/serial';

const BAUD_RATES = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];

interface SerialMonitorProps {
  lines: SerialLine[];
  status: ConnectionStatus;
  baudRate: number;
  onSendLine: (text: string) => void;
  onChangeBaudRate: (rate: number) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function SerialMonitor({
  lines,
  status,
  baudRate,
  onSendLine,
  onChangeBaudRate,
  onClear,
  onClose,
}: SerialMonitorProps) {
  const [input, setInput] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendLine(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('es', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      + '.' + String(d.getMilliseconds()).padStart(3, '0');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-t border-gray-700">
      {/* Monitor header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border-b border-gray-700 shrink-0">
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-semibold text-gray-300">Monitor Serie</span>

        <div className={`w-2 h-2 rounded-full ml-1 ${
          status === 'connected' ? 'bg-green-400' :
          status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
          'bg-gray-500'
        }`} />
        <span className="text-xs text-gray-500">
          {status === 'connected' ? 'Conectado' :
           status === 'connecting' ? 'Conectando...' :
           'Desconectado'}
        </span>

        <div className="flex-1" />

        {/* Baud rate selector */}
        <select
          value={baudRate}
          onChange={(e) => onChangeBaudRate(Number(e.target.value))}
          className="text-xs bg-gray-700 text-gray-300 border border-gray-600 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
        >
          {BAUD_RATES.map((rate) => (
            <option key={rate} value={rate}>{rate} baud</option>
          ))}
        </select>

        {/* Timestamps toggle */}
        <button
          onClick={() => setShowTimestamps(!showTimestamps)}
          className={`text-xs px-2 py-0.5 rounded ${
            showTimestamps ? 'bg-brand-teal/30 text-brand-teal' : 'text-gray-500 hover:text-gray-300'
          }`}
          title="Mostrar marcas de tiempo"
        >
          🕐
        </button>

        {/* Auto-scroll toggle */}
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`text-xs px-2 py-0.5 rounded ${
            autoScroll ? 'bg-brand-teal/30 text-brand-teal' : 'text-gray-500 hover:text-gray-300'
          }`}
          title="Auto-scroll"
        >
          ↓
        </button>

        {/* Clear */}
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-300 px-2 py-0.5"
          title="Limpiar"
        >
          🗑
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 text-lg leading-none ml-1"
          title="Cerrar monitor"
        >
          ×
        </button>
      </div>

      {/* Output area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-2 font-mono text-xs leading-relaxed min-h-0"
      >
        {lines.length === 0 ? (
          <div className="text-gray-600 text-center py-4">
            {status === 'connected'
              ? 'Esperando datos...'
              : 'Conecta una placa para ver datos del puerto serie'}
          </div>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="flex gap-2 hover:bg-gray-800/50">
              {showTimestamps && (
                <span className="text-gray-600 shrink-0 select-none">{formatTime(line.timestamp)}</span>
              )}
              <span
                className={
                  line.type === 'rx' ? 'text-green-300' :
                  line.type === 'tx' ? 'text-blue-300' :
                  'text-yellow-400 italic'
                }
              >
                {line.type === 'tx' && <span className="text-blue-500 mr-1">→</span>}
                {line.text}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-t border-gray-700 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={status === 'connected' ? 'Escribe un mensaje...' : 'Conecta la placa primero'}
          disabled={status !== 'connected'}
          className="flex-1 bg-gray-700 text-gray-200 text-xs font-mono px-3 py-1.5 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-teal disabled:opacity-50 placeholder:text-gray-600"
        />
        <button
          onClick={handleSend}
          disabled={status !== 'connected' || !input.trim()}
          className="px-3 py-1.5 text-xs font-semibold bg-brand-teal text-white rounded hover:bg-brand-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
