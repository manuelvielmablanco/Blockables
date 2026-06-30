import * as Blockly from 'blockly';
import * as Es from 'blockly/msg/es';
import { IngeniablesTheme } from './theme';
import { getToolboxForBoard } from './toolbox';
import type { BoardProfile } from '../boards/types';
import { defaultBoard } from '../boards';
import './blocks';

Blockly.setLocale(Es);

export function createWorkspace(container: HTMLDivElement, board?: BoardProfile): Blockly.WorkspaceSvg {
  const currentBoard = board || defaultBoard;
  const toolbox = getToolboxForBoard(currentBoard);

  const workspace = Blockly.inject(container, {
    toolbox,
    theme: IngeniablesTheme,
    grid: {
      spacing: 20,
      length: 3,
      colour: '#e0e0e0',
      snap: true,
    },
    zoom: {
      controls: true,
      wheel: true,
      startScale: 1.0,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2,
      pinch: true,
    },
    trashcan: true,
    move: {
      scrollbars: {
        horizontal: true,
        vertical: true,
      },
      drag: true,
      wheel: false,
    },
    renderer: 'zelos',
    sounds: false,
  });

  // Add default setup and loop blocks
  const setupBlock = workspace.newBlock('arduino_setup');
  setupBlock.initSvg();
  setupBlock.render();
  setupBlock.moveBy(50, 30);
  setupBlock.setDeletable(false);
  setupBlock.setMovable(true);

  const loopBlock = workspace.newBlock('arduino_loop');
  loopBlock.initSvg();
  loopBlock.render();
  loopBlock.moveBy(50, 250);
  loopBlock.setDeletable(false);
  loopBlock.setMovable(true);

  // Mantener oculta la barra de scroll del flyout cuando el menú está cerrado.
  setupFlyoutScrollbarSync(container, workspace);

  // Expose for debugging
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__workspace = workspace;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__Blockly = Blockly;

  return workspace;
}

/**
 * Blockly deja la barra de scroll del flyout (.blocklyFlyoutScrollbar) visible
 * aunque el flyout se colapse. Este observador le añade/quita la clase
 * .is-flyout-collapsed según el flyout esté oculto o visible, de modo que el
 * CSS la oculte solo cuando el menú está cerrado.
 */
function setupFlyoutScrollbarSync(container: HTMLElement, workspace: Blockly.WorkspaceSvg) {
  let raf = 0;
  const sync = () => {
    raf = 0;
    // El flyout puede pertenecer al workspace o a su toolbox.
    const wsFlyout = workspace.getFlyout?.();
    const tbFlyout = (
      workspace.getToolbox?.() as unknown as { getFlyout?: () => Blockly.IFlyout | null } | null
    )?.getFlyout?.();
    const flyout = wsFlyout || tbFlyout || null;
    const visible = !!flyout && flyout.isVisible();
    container.querySelectorAll('.blocklyFlyoutScrollbar').forEach((bar) => {
      (bar as Element).classList.toggle('is-flyout-collapsed', !visible);
    });
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(sync);
  };
  // Filtramos a cambios de 'style' y nodos: abrir/cerrar el flyout muta el DOM.
  // (No observamos 'class' para no reaccionar a nuestro propio toggle.)
  const observer = new MutationObserver(schedule);
  observer.observe(container, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['style'],
  });
  schedule();
}

/**
 * Update the workspace toolbox when the board changes.
 * This hides/shows categories based on board features.
 */
export function updateWorkspaceToolbox(workspace: Blockly.WorkspaceSvg, board: BoardProfile) {
  const toolbox = getToolboxForBoard(board);
  workspace.updateToolbox(toolbox);
}
