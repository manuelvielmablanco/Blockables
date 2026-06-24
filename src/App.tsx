import { useState, useCallback, useRef, useEffect } from 'react';
import * as Blockly from 'blockly';
import { BoardProvider, useBoard } from './context/BoardContext';
import TopBar from './components/layout/TopBar';
import WorkspaceArea from './components/layout/WorkspaceArea';
import type { WorkspaceHandle } from './components/layout/WorkspaceArea';
import CodeViewer from './components/layout/CodeViewer';
import UploadDialog from './components/dialogs/UploadDialog';
import ExamplesDialog from './components/dialogs/ExamplesDialog';
import KitsDialog from './components/dialogs/KitsDialog';
import SerialMonitor from './components/serial/SerialMonitor';
import { useSerial } from './hooks/useSerial';
import {
  serializeProject,
  exportProject,
  importProject,
  exportCode,
  autoSave,
  loadHelloBlocksXml,
  transformHelloBlocksXml,
} from './services/project';
import type { ProjectData } from './services/project';
import type { ExampleProject } from './data/examples';
import type { KitLoadable } from './data/kits';
import { useToast } from './components/ui/Toast';

function AppContent() {
  const [code, setCode] = useState<string>('// Arrastra bloques para generar código');
  const [showCode, setShowCode] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showKits, setShowKits] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [projectName, setProjectName] = useState('Mi proyecto');
  const codeRef = useRef(code);
  const workspaceRef = useRef<WorkspaceHandle>(null);
  const toast = useToast();

  const { board, setBoard } = useBoard();
  const serial = useSerial();
  const lastSerialStatus = useRef(serial.status);

  // Ctrl+E opens examples dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setShowExamples(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast on serial connect/disconnect/error transitions
  useEffect(() => {
    const prev = lastSerialStatus.current;
    if (prev !== serial.status) {
      if (serial.status === 'connected') {
        toast.success('Placa conectada', 'Ya puedes subir tu código.');
      } else if (serial.status === 'error') {
        toast.error('Error de conexión', 'No se pudo conectar a la placa.');
      } else if (prev === 'connected' && serial.status === 'disconnected') {
        toast.info('Placa desconectada');
      }
      lastSerialStatus.current = serial.status;
    }
  }, [serial.status, toast]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    codeRef.current = newCode;

    // Auto-save
    const ws = workspaceRef.current?.getWorkspace();
    if (ws) {
      autoSave(ws, projectName, board.id);
    }
  }, [projectName, board.id]);

  // "Subir" button now opens upload dialog directly
  const handleUpload = useCallback(() => {
    setShowUploadDialog(true);
  }, []);

  const handleConnect = useCallback(async () => {
    if (serial.status === 'connected') {
      await serial.disconnect();
    } else {
      await serial.connect();
    }
  }, [serial]);

  const handleToggleMonitor = useCallback(() => {
    setShowMonitor((prev) => !prev);
  }, []);

  // File menu actions
  const handleNewProject = useCallback(() => {
    const ws = workspaceRef.current?.getWorkspace();
    if (!ws) return;
    if (confirm('¿Crear un nuevo proyecto? Se perderán los cambios no guardados.')) {
      ws.clear();
      const setupBlock = ws.newBlock('arduino_setup');
      setupBlock.setDeletable(false);
      setupBlock.initSvg();
      setupBlock.render();
      setupBlock.moveBy(30, 30);

      const loopBlock = ws.newBlock('arduino_loop');
      loopBlock.setDeletable(false);
      loopBlock.initSvg();
      loopBlock.render();
      loopBlock.moveBy(30, 200);

      setProjectName('Mi proyecto');
      toast.info('Nuevo proyecto creado');
    }
  }, [toast]);

  const handleSaveProject = useCallback(() => {
    const ws = workspaceRef.current?.getWorkspace();
    if (!ws) return;
    const project = serializeProject(ws, projectName, board.id);
    exportProject(project);
    toast.success('Proyecto guardado', `${projectName}.ib`);
  }, [projectName, board.id, toast]);

  const handleOpenProject = useCallback(async () => {
    const project = await importProject();
    if (!project) return;

    const ws = workspaceRef.current?.getWorkspace();
    if (!ws) return;

    // Hello Blocks .hb files use XML format with _hbXml property
    const hbXml = (project as ProjectData & { _hbXml?: string })._hbXml;
    if (hbXml) {
      try {
        loadHelloBlocksXml(ws, hbXml);
        setProjectName(project.name);
        toast.success('Proyecto abierto', project.name);
      } catch (err) {
        console.error('Error cargando .hb:', err);
        const msg = err instanceof Error ? err.message : String(err);
        toast.error('No se pudo abrir el .hb', msg);
      }
      return;
    }

    try {
      ws.clear();
      const state = JSON.parse(project.workspace);
      Blockly.serialization.workspaces.load(state, ws);
      setProjectName(project.name);
      if (project.boardId) {
        setBoard(project.boardId);
      }
      toast.success('Proyecto abierto', project.name);
    } catch (err) {
      console.error('Error cargando proyecto:', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('No se pudo abrir el proyecto', msg);
    }
  }, [setBoard, toast]);

  const handleExportCode = useCallback(() => {
    exportCode(codeRef.current, projectName);
    toast.success('Código exportado', `${projectName}.ino`);
  }, [projectName, toast]);

  const handleSelectExample = useCallback((example: ExampleProject) => {
    const ws = workspaceRef.current?.getWorkspace();
    if (!ws) return;

    ws.clear();
    Blockly.serialization.workspaces.load(example.workspace as object, ws);
    setProjectName(example.name);
    setBoard(example.boardId);
    setShowExamples(false);
    toast.info('Ejemplo cargado', example.name);
  }, [setBoard, toast]);

  const handleSelectKit = useCallback((loadable: KitLoadable) => {
    const ws = workspaceRef.current?.getWorkspace();
    if (!ws) return;

    try {
      if (loadable.hbXml) {
        // Kit empaquetado como Hello Blocks XML — usar el importador con
        // la misma transformación que aplica a los .hb importados a mano.
        const transformed = transformHelloBlocksXml(loadable.hbXml);
        loadHelloBlocksXml(ws, transformed);
      } else if (loadable.workspace) {
        ws.clear();
        Blockly.serialization.workspaces.load(loadable.workspace as object, ws);
      } else {
        throw new Error('El kit no tiene workspace ni hbXml');
      }
      setProjectName(loadable.name);
      setBoard(loadable.boardId);
      setShowKits(false);
      toast.info('Kit cargado', `${loadable.name} — programa original`);
    } catch (err) {
      console.error('Error cargando kit:', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('No se pudo cargar el kit', msg);
    }
  }, [setBoard, toast]);

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-subtle)' }}>
      <TopBar
        projectName={projectName}
        onProjectNameChange={setProjectName}
        showCode={showCode}
        onToggleCode={() => setShowCode(!showCode)}
        onUpload={handleUpload}
        onConnect={handleConnect}
        onToggleMonitor={handleToggleMonitor}
        serialStatus={serial.status}
        showMonitor={showMonitor}
        onNew={handleNewProject}
        onOpen={handleOpenProject}
        onSave={handleSaveProject}
        onExportCode={handleExportCode}
        onExamples={() => setShowExamples(true)}
        onKits={() => setShowKits(true)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <WorkspaceArea
            ref={workspaceRef}
            onCodeChange={handleCodeChange}
            onOpenExamples={() => setShowExamples(true)}
          />
          {showCode && <CodeViewer code={code} />}
        </div>
        {showMonitor && (
          <div className="h-64 shrink-0">
            <SerialMonitor
              lines={serial.lines}
              status={serial.status}
              baudRate={serial.baudRate}
              onSendLine={serial.sendLine}
              onChangeBaudRate={serial.changeBaudRate}
              onClear={serial.clearLines}
              onClose={() => setShowMonitor(false)}
            />
          </div>
        )}
      </div>
      <UploadDialog
        open={showUploadDialog}
        code={codeRef.current}
        boardId={board.id}
        onClose={() => setShowUploadDialog(false)}
      />
      <ExamplesDialog
        open={showExamples}
        onClose={() => setShowExamples(false)}
        onSelect={handleSelectExample}
      />
      <KitsDialog
        open={showKits}
        onClose={() => setShowKits(false)}
        onSelect={handleSelectKit}
      />
    </div>
  );
}

export default function App() {
  return (
    <BoardProvider>
      <AppContent />
    </BoardProvider>
  );
}
