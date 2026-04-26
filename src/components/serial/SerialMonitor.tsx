import { useState, useRef, useEffect } from 'react';
import { Activity, Clock, ArrowDown, Trash2, X } from 'lucide-react';
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

  const statusLabel =
    status === 'connected' ? 'Conectado' :
    status === 'connecting' ? 'Conectando…' :
    'Desconectado';

  const statusDotColor =
    status === 'connected' ? '#6cd29a' :
    status === 'connecting' ? 'var(--yellow)' :
    'var(--fg-3)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--ink)',
        borderTop: '1px solid var(--teal-contrast)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px',
          background: '#28282a',
          borderBottom: '1px solid #2a2a28',
          color: 'var(--teal)',
          fontFamily: 'var(--font-ui)',
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          flexShrink: 0,
        }}
      >
        <Activity className="w-[14px] h-[14px]" style={{ color: 'var(--teal)' }} />
        <span>Monitor Serie</span>

        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusDotColor,
            marginLeft: 6,
          }}
        />
        <span
          style={{
            background: 'var(--teal-depth)',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 999,
            fontSize: 10,
            textTransform: 'none',
            letterSpacing: 0,
            fontWeight: 600,
          }}
        >
          {statusLabel}
        </span>

        <div style={{ flex: 1 }} />

        {/* Baud rate */}
        <select
          value={baudRate}
          onChange={(e) => onChangeBaudRate(Number(e.target.value))}
          style={{
            fontSize: 11,
            background: '#2d2d2b',
            color: 'var(--teal-soft)',
            border: '1px solid var(--teal-depth)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 8px',
            outline: 'none',
            fontFamily: 'var(--font-mono)',
            textTransform: 'none',
          }}
        >
          {BAUD_RATES.map((rate) => (
            <option key={rate} value={rate}>{rate} baud</option>
          ))}
        </select>

        <IconBtn
          active={showTimestamps}
          onClick={() => setShowTimestamps(!showTimestamps)}
          title="Mostrar marcas de tiempo"
        >
          <Clock className="w-[12px] h-[12px]" />
        </IconBtn>

        <IconBtn
          active={autoScroll}
          onClick={() => setAutoScroll(!autoScroll)}
          title="Auto-scroll"
        >
          <ArrowDown className="w-[12px] h-[12px]" />
        </IconBtn>

        <IconBtn onClick={onClear} title="Limpiar">
          <Trash2 className="w-[12px] h-[12px]" />
        </IconBtn>

        <IconBtn onClick={onClose} title="Cerrar monitor">
          <X className="w-[12px] h-[12px]" />
        </IconBtn>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '12px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12.5,
          lineHeight: 1.6,
          color: '#d4d4d2',
          minHeight: 0,
        }}
      >
        {lines.length === 0 ? (
          <div style={{ color: 'var(--fg-3)', textAlign: 'center', padding: '14px 0' }}>
            {status === 'connected'
              ? 'Esperando datos…'
              : 'Conecta una placa para ver datos del puerto serie'}
          </div>
        ) : (
          lines.map((line, i) => (
            <div key={i} style={{ display: 'block' }}>
              {showTimestamps && (
                <span style={{ color: 'var(--fg-3)', marginRight: 6, userSelect: 'none' }}>
                  {formatTime(line.timestamp)}
                </span>
              )}
              <span
                style={{
                  color:
                    line.type === 'rx'
                      ? 'var(--teal-light)'
                      : line.type === 'tx'
                      ? 'var(--yellow)'
                      : 'var(--yellow-light)',
                  fontStyle: line.type === 'system' ? 'italic' : 'normal',
                }}
              >
                {line.type === 'tx' && <span style={{ color: 'var(--yellow)', marginRight: 4 }}>→</span>}
                {line.text}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: '#28282a',
          borderTop: '1px solid #2a2a28',
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={status === 'connected' ? 'Escribe un mensaje…' : 'Conecta la placa primero'}
          disabled={status !== 'connected'}
          style={{
            flex: 1,
            background: '#2d2d2b',
            border: '1px solid var(--teal-depth)',
            color: '#fff',
            borderRadius: 'var(--radius-sm)',
            padding: '7px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12.5,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={status !== 'connected' || !input.trim()}
          className="btn btn-secondary"
          style={{ fontSize: 12, padding: '6px 14px' }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 26,
        height: 26,
        borderRadius: 'var(--radius-sm)',
        background: active ? 'rgba(99,192,187,.18)' : 'transparent',
        border: '1px solid var(--teal-depth)',
        color: active ? 'var(--teal)' : 'var(--teal-soft)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 150ms var(--ease-ui)',
      }}
    >
      {children}
    </button>
  );
}
