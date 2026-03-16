import { useState, useCallback, useRef } from 'react';
import * as Blockly from 'blockly';
import { BoardProvider, useBoard } from './context/BoardContext';
import TopBar from './components/layout/TopBar';
import WorkspaceArea from './components/layout/WorkspaceArea';
import type { WorkspaceHandle } from './components/layout/WorkspaceArea';
import CodeViewer from './components/layout/CodeViewer';
import UploadDialog from './components/dialogs/UploadDialog';
import ExamplesDialog from './components/dialogs/ExamplesDialog';
import SerialMonitor from './components/serial/SerialMonitor';
import { useSerial } from './hooks/useSerial';
import { serializeProject, exportProject, importProject, exportCode, autoSave } from './services/project';
import type { ExampleProject } from './data/examples';

function AppContent() {
  const [code, setCode] = useState<string>('// Arrastra bloques para generar código');
  const [showCode, setShowCode] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [projectName, setProjectName] = useState('Mi proyecto');
  const codeRef = useRef(code);
  const workspaceRef = useRef<WorkspaceHandle>(null);

  const { board, setBoard } = useBoard();
  const serial = useSerial();

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
    }
  }, []);

  const handleSaveProject = useCallback(() => {
    const ws = workspaceRef.current?.getWorkspace();
    if (!ws) return;
    const project = serializeProject(ws, projectName, board.id);
    exportProject(project);
  }, [projectName, board.id]);

  const handleOpenProject = useCallback(async () => {
    const project = await importProject();
    if (!project) return;

    const ws = workspaceRef.current?.getWorkspace();
    if (!ws) return;

    ws.clear();
    const state = JSON.parse(project.workspace);
    Blockly.serialization.workspaces.load(state, ws);
    setProjectName(project.name);
    if (project.boardId) {
      setBoard(project.boardId);
    }
  }, [setBoard]);

  const handleExportCode = useCallback(() => {
    exportCode(codeRef.current, projectName);
  }, [projectName]);

  const handleSelectExample = useCallback((example: ExampleProject) => {
    const ws = workspaceRef.current?.getWorkspace();
    if (!ws) return;

    ws.clear();
    Blockly.serialization.workspaces.load(example.workspace as object, ws);
    setProjectName(example.name);
    setBoard(example.boardId);
    setShowExamples(false);
  }, [setBoard]);

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#fafafa' }}>
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
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <WorkspaceArea ref={workspaceRef} onCodeChange={handleCodeChange} />
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
        onDisconnectSerial={serial.disconnect}
      />
      <ExamplesDialog
        open={showExamples}
        onClose={() => setShowExamples(false)}
        onSelect={handleSelectExample}
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
