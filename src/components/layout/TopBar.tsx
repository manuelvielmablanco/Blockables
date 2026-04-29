import {
  Plug,
  Loader2,
  AlertTriangle,
  Activity,
  Upload,
  Code2,
  Undo2,
  Redo2,
} from 'lucide-react';
import BoardSelector from './BoardSelector';
import FileMenu from './FileMenu';
import type { ConnectionStatus } from '../../services/serial';

interface TopBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  showCode: boolean;
  onToggleCode: () => void;
  onUpload?: () => void;
  onConnect?: () => void;
  onToggleMonitor?: () => void;
  serialStatus?: ConnectionStatus;
  showMonitor?: boolean;
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onExportCode?: () => void;
  onExamples?: () => void;
  onKits?: () => void;
}

export default function TopBar({
  projectName,
  onProjectNameChange,
  showCode,
  onToggleCode,
  onUpload,
  onConnect,
  onToggleMonitor,
  serialStatus = 'disconnected',
  showMonitor = false,
  onNew,
  onOpen,
  onSave,
  onExportCode,
  onExamples,
  onKits,
}: TopBarProps) {
  const isConnected = serialStatus === 'connected';
  const isConnecting = serialStatus === 'connecting';
  const isError = serialStatus === 'error';

  const connectClass = isConnected
    ? 'btn btn-connect-connected'
    : isConnecting
    ? 'btn btn-connect-connecting'
    : isError
    ? 'btn btn-connect-error'
    : 'btn btn-connect-disconnected';

  const connectLabel = isConnected
    ? 'Conectado'
    : isConnecting
    ? 'Conectando…'
    : isError
    ? 'Error'
    : 'Conectar';

  return (
    <header
      className="flex items-center gap-2.5 px-4 shrink-0"
      style={{
        height: 56,
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0,63,70,.06)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* File menu trigger (hamburger) */}
      <FileMenu
        onNew={onNew || (() => {})}
        onOpen={onOpen || (() => {})}
        onSave={onSave || (() => {})}
        onExportCode={onExportCode || (() => {})}
        onExamples={onExamples || (() => {})}
        onKits={onKits || (() => {})}
      />

      {/* Brand */}
      <div className="flex items-center gap-2">
        <img
          src={`${import.meta.env.BASE_URL}logo-ingeniables.svg`}
          alt="Ingeniables"
          style={{ height: 26 }}
        />
        <span
          className="font-bold"
          style={{ color: 'var(--teal)', fontSize: 16, fontFamily: 'var(--font-ui)' }}
        >
          Blocks
        </span>
      </div>

      <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

      {/* Project name */}
      <input
        type="text"
        value={projectName}
        onChange={(e) => onProjectNameChange(e.target.value)}
        className="topbar-project-input"
        placeholder="Nombre del proyecto"
        aria-label="Nombre del proyecto"
        style={{
          padding: '6px 12px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          fontWeight: 600,
          width: 180,
          color: 'var(--fg-1)',
          outline: 'none',
          fontFamily: 'var(--font-ui)',
        }}
      />

      <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

      {/* Board selector */}
      <BoardSelector />

      {/* Código toggle */}
      <button
        onClick={onToggleCode}
        className="btn btn-bg"
        aria-pressed={showCode}
        title="Ver código"
        style={
          showCode
            ? { background: 'var(--teal)', color: '#fff' }
            : undefined
        }
      >
        <Code2 className="w-[14px] h-[14px]" />
        Código
      </button>

      {/* Undo / Redo */}
      <div className="flex gap-1">
        <button
          id="undo-btn"
          className="p-1.5 rounded-md transition-colors"
          style={{ color: 'var(--fg-3)', background: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="Deshacer"
        >
          <Undo2 className="w-[16px] h-[16px]" />
        </button>
        <button
          id="redo-btn"
          className="p-1.5 rounded-md transition-colors"
          style={{ color: 'var(--fg-3)', background: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="Rehacer"
        >
          <Redo2 className="w-[16px] h-[16px]" />
        </button>
      </div>

      <div className="flex-1" />

      {/* Connect */}
      <button
        onClick={onConnect}
        className={connectClass}
        disabled={isConnecting}
        title={connectLabel}
      >
        {isConnected ? (
          <span className="pulse-dot" />
        ) : isConnecting ? (
          <Loader2 className="w-[14px] h-[14px] anim-spin" />
        ) : isError ? (
          <AlertTriangle className="w-[14px] h-[14px]" />
        ) : (
          <Plug className="w-[14px] h-[14px]" />
        )}
        {connectLabel}
      </button>

      {/* Monitor (ghost) */}
      <button
        onClick={onToggleMonitor}
        className={showMonitor ? 'btn btn-secondary' : 'btn btn-ghost'}
        title="Monitor serie"
      >
        <Activity className="w-[14px] h-[14px]" />
        Monitor
      </button>

      {/* Upload (secondary teal) */}
      <button onClick={onUpload} className="btn btn-secondary" title="Compilar y subir">
        <Upload className="w-[14px] h-[14px]" />
        Subir
      </button>
    </header>
  );
}
