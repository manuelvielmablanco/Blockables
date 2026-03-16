import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as Blockly from 'blockly';
import { createWorkspace, updateWorkspaceToolbox } from '../../blockly/workspace';
import { generateArduinoCode } from '../../blockly/generators/arduino';
import { useBoard } from '../../context/BoardContext';

interface WorkspaceAreaProps {
  onCodeChange: (code: string) => void;
}

export interface WorkspaceHandle {
  getWorkspace: () => Blockly.WorkspaceSvg | null;
}

const WorkspaceArea = forwardRef<WorkspaceHandle, WorkspaceAreaProps>(
  function WorkspaceArea({ onCodeChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
    const { board } = useBoard();

    useImperativeHandle(ref, () => ({
      getWorkspace: () => workspaceRef.current,
    }));

    const updateCode = useCallback(() => {
      if (workspaceRef.current) {
        const code = generateArduinoCode(workspaceRef.current, board);
        onCodeChange(code);
      }
    }, [onCodeChange, board]);

    // Initialize workspace
    useEffect(() => {
      if (containerRef.current && !workspaceRef.current) {
        workspaceRef.current = createWorkspace(containerRef.current, board);

        workspaceRef.current.addChangeListener((event: Blockly.Events.Abstract) => {
          if (
            event.type === Blockly.Events.BLOCK_CHANGE ||
            event.type === Blockly.Events.BLOCK_CREATE ||
            event.type === Blockly.Events.BLOCK_DELETE ||
            event.type === Blockly.Events.BLOCK_MOVE
          ) {
            updateCode();
          }
        });

        document.getElementById('undo-btn')?.addEventListener('click', () => {
          workspaceRef.current?.undo(false);
        });
        document.getElementById('redo-btn')?.addEventListener('click', () => {
          workspaceRef.current?.undo(true);
        });

        updateCode();

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
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, []);

    return (
      <div ref={containerRef} className="flex-1 h-full relative" style={{ backgroundColor: '#fafafa' }} />
    );
  }
);

export default WorkspaceArea;
