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
 * Import project from a .ib or .hb (Hello Blocks) file.
 */
export function importProject(): Promise<ProjectData | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ib,.json,.hb';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();

        // Hello Blocks .hb files are Blockly XML
        if (file.name.endsWith('.hb')) {
          const projectName = file.name.replace('.hb', '');
          resolve({
            name: projectName,
            boardId: 'arduino-nano',
            workspace: '', // Will be loaded via XML path
            version: PROJECT_VERSION,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _hbXml: transformHelloBlocksXml(text),
          } as ProjectData & { _hbXml: string });
          return;
        }

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
 * Transform Hello Blocks XML to Blockables-compatible XML.
 * Maps block types, field names, and value input names.
 */
function transformHelloBlocksXml(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  // Block type mapping: Hello Blocks → Blockables
  const blockTypeMap: Record<string, string> = {
    'control_arduino_setup': 'arduino_setup',
    'control_arduino_loop': 'arduino_loop',
    'neopixel_setled_colour_picker': 'neopixel_setcolor_picker',
    'io_digital_read': 'io_digitalread',
    'io_digital_write': 'io_digitalwrite',
    'io_analog_read': 'io_analogread',
    'io_analog_write': 'io_analogwrite',
    'logic_boolean_io': 'logic_boolean',
    'variables_set_number': 'variables_set',
    'variables_get_number': 'variables_get',
    'variables_set_bool': 'variables_set',
    'variables_get_bool': 'variables_get',
    'neopixel_examples': 'neopixel_effect',
    'neopixel_setled': 'neopixel_setcolor',
    'serial_init': 'serial_begin',
    'logic_compare_bool': 'logic_compare',
  };

  // Remap block types
  const blocks = doc.querySelectorAll('block, shadow');
  blocks.forEach((block) => {
    const type = block.getAttribute('type');
    if (type && blockTypeMap[type]) {
      block.setAttribute('type', blockTypeMap[type]);
    }
    // HB serial_print with NEWLINE=TRUE → serial_println, and remap STRINGOUTPUT → VALUE
    if (type === 'serial_print') {
      const nlField = block.querySelector(':scope > field[name="NEWLINE"]');
      if (nlField) {
        if (nlField.textContent?.trim() === 'TRUE') {
          block.setAttribute('type', 'serial_println');
        }
        nlField.remove();
      }
      const strOut = block.querySelector(':scope > value[name="STRINGOUTPUT"]');
      if (strOut) strOut.setAttribute('name', 'VALUE');
    }
  });

  // Remap statement name "DO" → "SETUP"/"LOOP" for setup/loop blocks
  const statements = doc.querySelectorAll('statement');
  statements.forEach((stmt) => {
    const parent = stmt.parentElement;
    if (!parent) return;
    const parentType = parent.getAttribute('type');
    if (parentType === 'arduino_setup' && stmt.getAttribute('name') === 'DO') {
      stmt.setAttribute('name', 'SETUP');
    }
    if (parentType === 'arduino_loop' && stmt.getAttribute('name') === 'DO') {
      stmt.setAttribute('name', 'LOOP');
    }
    // Hello Blocks uses DO_ELSE for controls_if else branch; standard Blockly uses ELSE
    if (parentType === 'controls_if' && stmt.getAttribute('name') === 'DO_ELSE') {
      stmt.setAttribute('name', 'ELSE');
    }
  });

  // Remap value input names
  const valueMap: Record<string, Record<string, string>> = {
    'time_delay': { 'DELAY_TIME_MILI': 'MS' },
    'motor_stepper_step': { 'STEP': 'STEPS' },
    'motor_stepper_init': { 'STEPS': 'STEPS_REV' },
    'neopixel_init': { 'LEDCOUNT': 'NUM' },
    'neopixel_setcolor': { 'LEDNUMBER': 'INDEX' },
  };

  const values = doc.querySelectorAll('value');
  values.forEach((val) => {
    const parent = val.parentElement;
    if (!parent) return;
    const parentType = parent.getAttribute('type');
    const valName = val.getAttribute('name');
    if (parentType && valName && valueMap[parentType]?.[valName]) {
      val.setAttribute('name', valueMap[parentType][valName]);
    }
  });

  // Remap field names and values for specific blocks
  const fieldNameMap: Record<string, Record<string, string>> = {
    'neopixel_effect': { 'EXAMPLE': 'EFFECT' },
  };
  const fieldValueMap: Record<string, Record<string, string>> = {
    'neopixel_effect': { 'Arcoiris': 'RAINBOW', 'ArcoirisCiclico': 'RAINBOW_CYCLE', 'Aleatorio': 'RANDOM' },
  };

  // Remove ID fields from stepper blocks (Blockables doesn't use multi-stepper IDs)
  const fields = doc.querySelectorAll('field');
  fields.forEach((field) => {
    const parent = field.parentElement;
    if (!parent) return;
    const parentType = parent.getAttribute('type');
    if (parentType?.startsWith('motor_stepper') && field.getAttribute('name') === 'ID') {
      field.remove();
    }
    // Remap field names
    const fieldName = field.getAttribute('name');
    if (parentType && fieldName && fieldNameMap[parentType]?.[fieldName]) {
      field.setAttribute('name', fieldNameMap[parentType][fieldName]);
    }
    // Remap field values
    const val = field.textContent?.trim();
    if (parentType && val && fieldValueMap[parentType]?.[val]) {
      field.textContent = fieldValueMap[parentType][val];
    }
    // Rename VARLISTNUM → VAR for list blocks and remove variabletype
    if (fieldName === 'VARLISTNUM') {
      field.setAttribute('name', 'VAR');
      field.removeAttribute('variabletype');
    }
    // Remove variabletype attribute from VAR fields (use generic variables)
    if (field.getAttribute('name') === 'VAR') {
      field.removeAttribute('variabletype');
    }
  });

  // Clean variabletype from variable declarations
  const variables = doc.querySelectorAll('variable');
  variables.forEach((v) => {
    v.removeAttribute('type');
  });

  // For neopixel_init: convert LEDCOUNT value input to NUM field
  const neopixelInits = doc.querySelectorAll('block[type="neopixel_init"]');
  neopixelInits.forEach((block) => {
    // Find the LEDCOUNT/NUM value input and extract the number
    const numValue = block.querySelector('value[name="NUM"]');
    if (numValue) {
      const shadowNum = numValue.querySelector('field[name="NUM"]');
      if (shadowNum) {
        // Create a field element instead of value input
        const numField = doc.createElement('field');
        numField.setAttribute('name', 'NUM');
        numField.textContent = shadowNum.textContent;
        block.appendChild(numField);
        numValue.remove();
      }
    }
    // Remove RGBMODE and FREQ fields (Blockables uses fixed GRB + 800KHz)
    const rgbField = block.querySelector('field[name="RGBMODE"]');
    const freqField = block.querySelector('field[name="FREQ"]');
    rgbField?.remove();
    freqField?.remove();
  });

  // Make setup/loop blocks not deletable
  const setupLoop = doc.querySelectorAll('block[type="arduino_setup"], block[type="arduino_loop"]');
  setupLoop.forEach((block) => {
    block.setAttribute('deletable', 'false');
    block.setAttribute('editable', 'false');
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

/**
 * Load a Hello Blocks XML string into the workspace.
 */
export function loadHelloBlocksXml(
  workspace: Blockly.WorkspaceSvg,
  xml: string
): void {
  workspace.clear();
  const dom = Blockly.utils.xml.textToDom(xml);
  Blockly.Xml.domToWorkspace(dom, workspace);
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
