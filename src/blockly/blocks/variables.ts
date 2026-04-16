import * as Blockly from 'blockly';

// Variable types available in the editor
const VAR_TYPES: [string, string][] = [
  ['Número', 'int'],
  ['Decimal', 'float'],
  ['Texto', 'String'],
  ['Lógica', 'bool'],
  ['Carácter', 'char'],
  ['Byte', 'byte'],
  ['Número largo', 'long'],
];

/**
 * Dynamic dropdown generator that scans the workspace for all
 * typed_variable_declare blocks and returns their names as options.
 * Falls back to [['miVariable', 'miVariable']] if none found.
 */
function declaredVarOptions(this: Blockly.FieldDropdown): Blockly.MenuOption[] {
  const block = (this as unknown as { getSourceBlock: () => Blockly.Block | null }).getSourceBlock?.();
  if (!block) return [['miVariable', 'miVariable']];
  const workspace = block.workspace;
  if (!workspace) return [['miVariable', 'miVariable']];

  const names = new Set<string>();

  // 1. Variables from typed_variable_declare blocks
  for (const b of workspace.getAllBlocks(false)) {
    if (b.type === 'typed_variable_declare') {
      const name = b.getFieldValue('VAR');
      if (name) names.add(name);
    }
  }

  // 2. Variables from Blockly's variable system (for loops, forEach, etc.)
  const allVars = Blockly.Variables.allUsedVarModels(workspace);
  for (const v of allVars) {
    if (v.name) names.add(v.name);
  }

  if (names.size === 0) return [['miVariable', 'miVariable']];

  const options: Blockly.MenuOption[] = [];
  for (const name of Array.from(names).sort()) {
    options.push([name, name]);
  }
  return options;
}

/**
 * Look up the declared type of a variable by scanning typed_variable_declare blocks.
 * Returns null if variable is not declared via typed_variable_declare (e.g. loop counters).
 */
function lookupVariableType(workspace: Blockly.Workspace, varName: string): string | null {
  for (const b of workspace.getAllBlocks(false)) {
    if (b.type === 'typed_variable_declare' && b.getFieldValue('VAR') === varName) {
      return b.getFieldValue('TYPE') || null;
    }
  }
  return null;
}

/**
 * Map Arduino/C++ type to Blockly input check type.
 */
function typeToCheck(type: string | null): string | null {
  if (!type) return null;
  switch (type) {
    case 'bool': return 'Boolean';
    case 'String': return 'String';
    case 'char': return null; // allow anything (char is tricky)
    default: return 'Number'; // int, float, long, byte
  }
}

/**
 * Get shadow block configuration for a type.
 */
function shadowForType(type: string | null): { shadowType: string; fields: Record<string, string | number> } {
  if (type === 'bool') return { shadowType: 'logic_boolean', fields: { BOOL: 'FALSE' } };
  if (type === 'String') return { shadowType: 'text', fields: { TEXT: '' } };
  return { shadowType: 'math_number', fields: { NUM: 0 } };
}

/**
 * Update a value input's check and (optionally) replace its shadow block.
 * If the currently connected block is incompatible, disconnect and dispose it.
 */
function updateValueInput(
  block: Blockly.Block,
  inputName: string,
  type: string | null,
  replaceShadow: boolean = true,
) {
  const input = block.getInput(inputName);
  if (!input || !input.connection) return;
  const check = typeToCheck(type);
  input.setCheck(check);

  const target = input.connection.targetBlock();

  // If there is a connected block that doesn't match the new check, detach + dispose it
  if (target) {
    const outCheck = target.outputConnection?.getCheck?.();
    const compatible =
      !check || !outCheck || (Array.isArray(outCheck) && outCheck.includes(check));
    if (!compatible || target.isShadow()) {
      target.unplug(false);
      target.dispose(false);
    }
  }

  if (replaceShadow && !input.connection.targetBlock()) {
    const { shadowType, fields } = shadowForType(type);
    try {
      const ws = block.workspace;
      const shadow = ws.newBlock(shadowType);
      shadow.setShadow(true);
      for (const [fname, fval] of Object.entries(fields)) {
        shadow.setFieldValue(String(fval), fname);
      }
      const shadowWithSvg = shadow as unknown as { initSvg?: () => void; render?: () => void };
      if (shadowWithSvg.initSvg) shadowWithSvg.initSvg();
      if (shadowWithSvg.render) shadowWithSvg.render();
      const outCon = shadow.outputConnection;
      if (outCon && input.connection) {
        input.connection.connect(outCon);
      }
    } catch {
      // ignore if shadow creation fails
    }
  }
}

// ── Declare variable ──
Blockly.Blocks['typed_variable_declare'] = {
  init: function (this: Blockly.Block) {
    const self = this;
    this.appendDummyInput()
      .appendField('crear variable')
      .appendField(
        new Blockly.FieldDropdown(VAR_TYPES, function (newValue: string) {
          // Defer until block is fully constructed and rendered
          setTimeout(() => updateValueInput(self, 'VALUE', newValue, true), 0);
          return undefined;
        }) as Blockly.Field,
        'TYPE',
      )
      .appendField(new Blockly.FieldTextInput('miVariable') as Blockly.Field, 'VAR');
    this.appendValueInput('VALUE').setCheck('Number').appendField('=');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip('Crea una nueva variable con tipo y valor inicial');
  },
};

// ── Set variable ──
Blockly.Blocks['typed_variable_set'] = {
  init: function (this: Blockly.Block) {
    const self = this;
    this.appendValueInput('VALUE')
      .appendField('establecer')
      .appendField(
        new Blockly.FieldDropdown(declaredVarOptions, function (newValue: string) {
          setTimeout(() => {
            const type = lookupVariableType(self.workspace, newValue);
            updateValueInput(self, 'VALUE', type, true);
          }, 0);
          return undefined;
        }) as Blockly.Field,
        'VAR',
      )
      .appendField('=');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip('Asigna un valor a una variable existente');
  },
  /**
   * Keep VALUE check in sync with the variable's declared type.
   * Called by Blockly whenever the workspace changes.
   */
  onchange: function (this: Blockly.Block, event: Blockly.Events.Abstract) {
    // Only react to events that could change variable declarations
    const t = event.type;
    if (
      t !== Blockly.Events.BLOCK_CREATE &&
      t !== Blockly.Events.BLOCK_CHANGE &&
      t !== Blockly.Events.BLOCK_DELETE
    ) {
      return;
    }
    const varName = this.getFieldValue('VAR');
    const type = lookupVariableType(this.workspace, varName);
    const check = typeToCheck(type);
    const input = this.getInput('VALUE');
    if (input) input.setCheck(check);
  },
};

// ── Get variable ──
Blockly.Blocks['typed_variable_get'] = {
  init: function (this: Blockly.Block) {
    const self = this;
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown(declaredVarOptions, function (newValue: string) {
        setTimeout(() => {
          const type = lookupVariableType(self.workspace, newValue);
          self.setOutput(true, typeToCheck(type));
        }, 0);
        return undefined;
      }) as Blockly.Field,
      'VAR',
    );
    this.setOutput(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip('Obtiene el valor de una variable');
  },
  onchange: function (this: Blockly.Block, event: Blockly.Events.Abstract) {
    const t = event.type;
    if (
      t !== Blockly.Events.BLOCK_CREATE &&
      t !== Blockly.Events.BLOCK_CHANGE &&
      t !== Blockly.Events.BLOCK_DELETE
    ) {
      return;
    }
    const varName = this.getFieldValue('VAR');
    const type = lookupVariableType(this.workspace, varName);
    this.setOutput(true, typeToCheck(type));
  },
};

// ── Increment / Decrement variable ──
Blockly.Blocks['typed_variable_change'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('DELTA')
      .setCheck('Number')
      .appendField(new Blockly.FieldDropdown([['incrementar', '+='], ['decrementar', '-=']]) as Blockly.Field, 'OP')
      .appendField(new Blockly.FieldDropdown(declaredVarOptions) as Blockly.Field, 'VAR')
      .appendField('en');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip('Incrementa o decrementa una variable numérica');
  },
};
