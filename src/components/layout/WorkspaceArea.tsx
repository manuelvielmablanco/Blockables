import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import * as Blockly from 'blockly';
import { createWorkspace, updateWorkspaceToolbox } from '../../blockly/workspace';
import { generateArduinoCode } from '../../blockly/generators/arduino';
import { useBoard } from '../../context/BoardContext';

interface WorkspaceAreaProps {
  onCodeChange: (code: string) => void;
  onOpenExamples?: () => void;
}

export interface WorkspaceHandle {
  getWorkspace: () => Blockly.WorkspaceSvg | null;
}

const WorkspaceArea = forwardRef<WorkspaceHandle, WorkspaceAreaProps>(
  function WorkspaceArea({ onCodeChange, onOpenExamples }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const blocklyHostRef = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
    const { board } = useBoard();
    const [isEmpty, setIsEmpty] = useState(true);

    useImperativeHandle(ref, () => ({
      getWorkspace: () => workspaceRef.current,
    }));

    const updateCode = useCallback(() => {
      if (workspaceRef.current) {
        const code = generateArduinoCode(workspaceRef.current, board);
        onCodeChange(code);
      }
    }, [onCodeChange, board]);

    const updateEmptyState = useCallback(() => {
      if (workspaceRef.current) {
        const blocks = workspaceRef.current.getAllBlocks(false);
        const userBlocks = blocks.filter(
          (b) => b.type !== 'arduino_setup' && b.type !== 'arduino_loop'
        );
        setIsEmpty(userBlocks.length === 0);
      }
    }, []);

    // Initialize workspace
    useEffect(() => {
      if (blocklyHostRef.current && !workspaceRef.current) {
        workspaceRef.current = createWorkspace(blocklyHostRef.current, board);

        workspaceRef.current.addChangeListener((event: Blockly.Events.Abstract) => {
          if (
            event.type === Blockly.Events.BLOCK_CHANGE ||
            event.type === Blockly.Events.BLOCK_CREATE ||
            event.type === Blockly.Events.BLOCK_DELETE ||
            event.type === Blockly.Events.BLOCK_MOVE
          ) {
            updateCode();
            updateEmptyState();
          }
        });

        document.getElementById('undo-btn')?.addEventListener('click', () => {
          workspaceRef.current?.undo(false);
        });
        document.getElementById('redo-btn')?.addEventListener('click', () => {
          workspaceRef.current?.undo(true);
        });

        updateCode();
        updateEmptyState();

        requestAnimationFrame(() => {
          if (workspaceRef.current) {
            Blockly.svgResize(workspaceRef.current);
          }
        });
      }

      return () => {
        if (workspaceRef.current) {
          workspaceRef.current.dispose();
          workspaceRef.current = null;
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // React to board changes: update toolbox
    useEffect(() => {
      if (workspaceRef.current) {
        updateWorkspaceToolbox(workspaceRef.current, board);
        updateCode();
      }
    }, [board, updateCode]);

    // Handle resize
    useEffect(() => {
      const handleResize = () => {
        if (workspaceRef.current) {
          Blockly.svgResize(workspaceRef.current);
        }
      };

      const observer = new ResizeObserver(handleResize);
      if (blocklyHostRef.current) {
        observer.observe(blocklyHostRef.current);
      }

      return () => observer.disconnect();
    }, []);

    return (
      <div
        ref={containerRef}
        className="flex-1 h-full relative"
        style={{ backgroundColor: '#fafafa' }}
      >
        <div ref={blocklyHostRef} className="w-full h-full" />
        {isEmpty && (
          <div className="ws-empty">
            <div className="ws-empty-figure">
              <img
                src={`${import.meta.env.BASE_URL}characters/turquesa/programando.png`}
                alt=""
                className="anim-float"
              />
              <div className="ws-empty-shadow" />
            </div>
            <div className="ws-empty-msg">"Arrastra bloques para empezar."</div>
            <div className="ws-empty-hint">
              Abre una categoría del toolbox o prueba un{' '}
              <button
                type="button"
                className="ws-empty-link"
                onClick={onOpenExamples}
              >
                ejemplo
              </button>
              <span className="ws-empty-sep"> · </span>
              <kbd className="kbd">Ctrl</kbd> <kbd className="kbd">E</kbd>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default WorkspaceArea;
