/**
 * Project save/load service.
 * Handles exporting/importing Blockly workspace as XML/JSON files.
 */

import * as Blockly from 'blockly/core';

export interface ProjectData {
  name: string;
  boardId: string;
  workspace: string; // Serialized workspace JSON
  version: string;
  createdAt: string;
  updatedAt: string;
}

const PROJECT_VERSION = '1.0.0';
const STORAGE_KEY = 'ingeniables-blocks-autosave';

/**
 * Serialize the current workspace to a project data object.
 */
export function serializeProject(
  workspace: Blockly.WorkspaceSvg,
  name: string,
  boardId: string
): ProjectData {
  const state = Blockly.serialization.workspaces.save(workspace);
  return {
    name,
    boardId,
    workspace: JSON.stringify(state),
    version: PROJECT_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Load a project into the workspace.
 */
export function loadProject(
  workspace: Blockly.WorkspaceSvg,
  project: ProjectData
): { name: string; boardId: string } {
  const state = JSON.parse(project.workspace);
  Blockly.serialization.workspaces.load(state, workspace);
  return { name: project.name, boardId: project.boardId };
}

/**
 * Export project as a downloadable .ib file (JSON).
 */
export function exportProject(project: ProjectData): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(project.name)}.ib`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import project from a .ib file.
 */
export function importProject(): Promise<ProjectData | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ib,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        const project = JSON.parse(text) as ProjectData;
        if (!project.workspace || !project.name) {
          throw new Error('Archivo de proyecto inválido');
        }
        resolve(project);
      } catch (err) {
        console.error('Error importing project:', err);
        resolve(null);
      }
    };
    input.click();
  });
}

/**
 * Auto-save workspace to localStorage.
 */
export function autoSave(workspace: Blockly.WorkspaceSvg, name: string, boardId: string): void {
  try {
    const project = serializeProject(workspace, name, boardId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch (err) {
    console.warn('Auto-save failed:', err);
  }
}

/**
 * Load auto-saved workspace from localStorage.
 */
export function loadAutoSave(): ProjectData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as ProjectData;
  } catch {
    return null;
  }
}

/**
 * Export generated Arduino code as .ino file.
 */
export function exportCode(code: string, projectName: string): void {
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(projectName)}.ino`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '_') || 'proyecto';
}
