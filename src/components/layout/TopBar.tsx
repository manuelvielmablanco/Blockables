import BoardSelector from './BoardSelector';
import FileMenu from './FileMenu';
import { useBoard } from '../../context/BoardContext';
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
}: TopBarProps) {
  const { board } = useBoard();
  const isConnected = serialStatus === 'connected';
  const isConnecting = serialStatus === 'connecting';

  return (
    <header className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200 shadow-sm h-14 shrink-0">
      <img src={`${import.meta.env.BASE_URL}logo-ingeniables.svg`} alt="Ingeniables" className="h-7" />
      <div className="w-px h-6 bg-gray-300" />
      <span className="text-sm font-bold text-brand-teal font-heading tracking-tight">Blocks</span>
      <div className="w-px h-6 bg-gray-300" />

      {/* File menu */}
      <FileMenu
        onNew={onNew || (() => {})}
        onOpen={onOpen || (() => {})}
        onSave={onSave || (() => {})}
        onExportCode={onExportCode || (() => {})}
        onExamples={onExamples || (() => {})}
      />

      <input
        type="text"
        value={projectName}
        onChange={(e) => onProjectNameChange(e.target.value)}
        className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent w-44"
        placeholder="Nombre del proyecto"
      />

      <div className="w-px h-6 bg-gray-300" />
      <BoardSelector />

      <button
        onClick={onToggleCode}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
          showCode
            ? 'bg-brand-teal text-white'
            : 'bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        Código
      </button>

      <div className="flex gap-1">
        <button id="undo-btn" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Deshacer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a4 4 0 014 4v0a4 4 0 01-4 4H3m0-8l4-4m-4 4l4 4" />
          </svg>
        </button>
        <button id="redo-btn" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Rehacer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a4 4 0 00-4 4v0a4 4 0 004 4h10m0-8l-4-4m4 4l-4 4" />
          </svg>
        </button>
      </div>

      <div className="flex-1" />

      {/* Connect button */}
      <button
        onClick={onConnect}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
          isConnected
            ? 'bg-green-500 text-white hover:bg-green-600'
            : isConnecting
            ? 'bg-brand-yellow/60 text-brand-black cursor-wait'
            : 'bg-brand-yellow text-brand-black hover:bg-brand-yellow/80'
        }`}
        disabled={isConnecting}
      >
        {isConnected ? (
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
        {isConnected ? 'Conectado' : isConnecting ? '...' : 'Conectar'}
      </button>

      {/* Monitor button */}
      <button
        onClick={onToggleMonitor}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
          showMonitor
            ? 'bg-brand-teal text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Monitor
      </button>

      {/* Upload button */}
      <button
        onClick={onUpload}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-brand-teal text-white hover:bg-brand-teal/90 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Subir
      </button>
    </header>
  );
}
