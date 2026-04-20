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
  return collectVarOptions(this, null);
}

/**
 * Dynamic dropdown for blocks that require NUMERIC variables only
 * (e.g. increment/decrement). Filters out bool, String, char variables.
 */
function numericVarOptions(this: Blockly.FieldDropdown): Blockly.MenuOption[] {
  return collectVarOptions(this, 'numeric');
}

/**
 * Shared helper: collect variable names from the workspace,
 * optionally filtered by category ('numeric' = int/float/long/byte).
 *
 * IMPORTANT: always includes the field's current value_ so that
 * Blockly's doClassValidation_() passes during workspace deserialization,
 * even when the workspace is still being built incrementally.
 */
function collectVarOptions(
  field: Blockly.FieldDropdown,
  filter: 'numeric' | null,
): Blockly.MenuOption[] {
  // Ensure the currently-stored value is always a valid option.
  // This prevents Blockly from rejecting a saved variable name when the
  // generator is called before all blocks are in the workspace.
  const currentValue = (field as unknown as { value_: string }).value_;

  const block = (field as unknown as { getSourceBlock: () => Blockly.Block | null }).getSourceBlock?.();
  if (!block) {
    const name = currentValue || 'miVariable';
    return [[name, name]];
  }
  const workspace = block.workspace;
  if (!workspace) {
    const name = currentValue || 'miVariable';
    return [[name, name]];
  }

  const NUMERIC_TYPES = new Set(['int', 'float', 'long', 'byte']);
  const names = new Set<string>();

  // Always include the current value first (deserialization safety)
  if (currentValue && currentValue !== 'miVariable') names.add(currentValue);

  // 1. Variables from typed_variable_declare blocks
  for (const b of workspace.getAllBlocks(false)) {
    if (b.type === 'typed_variable_declare') {
      const name = b.getFieldValue('VAR');
      const type = b.getFieldValue('TYPE');
      if (!name) continue;
      if (filter === 'numeric' && !NUMERIC_TYPES.has(type)) continue;
      names.add(name);
    }
  }

  // 2. Variables from Blockly's variable system (loop counters etc. — assumed numeric)
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
 * Check if a block's output is compatible with a given check type.
 */
function isOutputCompatible(target: Blockly.Block, check: string | null): boolean {
  if (!check) return true;
  const outCheck = target.outputConnection?.getCheck?.();
  if (!outCheck) return true; // no check means accept anything
  if (Array.isArray(outCheck)) return outCheck.includes(check);
  return outCheck === check;
}

/**
 * Create and attach a shadow block of the appropriate type.
 * No-op if the input already has a connected block.
 */
function attachShadow(block: Blockly.Block, inputName: string, type: string | null) {
  const input = block.getInput(inputName);
  if (!input || !input.connection) return;
  if (input.connection.targetBlock()) return; // already has something
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
    if (outCon) input.connection.connect(outCon);
  } catch {
    // ignore
  }
}

/**
 * Update a value input's check and (optionally) schedule a shadow replacement.
 *
 * KEY FIX: setCheck() runs SYNCHRONOUSLY so that Blockly's deserialization can
 * connect child blocks with the correct type immediately. attachShadow() runs
 * asynchronously (setTimeout) so that during deserialization the JSON shadow
 * connects via setShadowState() first — and the guard in attachShadow() will
 * then see a connected block and skip creating a duplicate shadow.
 *
 * During user interaction the flow is the same: the old shadow is disposed
 * synchronously, setCheck() updates the restriction, and after the current
 * call stack the input is empty, so attachShadow() creates the new shadow.
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

  // 1. Capture target BEFORE setCheck (setCheck auto-disconnects incompatible
  //    blocks and leaves them as orphans if we don't dispose them first)
  const target = input.connection.targetBlock();

  // 2. Dispose the target if it's a shadow (always replace defaults) or incompatible
  if (target && (target.isShadow() || !isOutputCompatible(target, check))) {
    target.unplug(false);
    target.dispose(false);
  }

  // 3. Now it's safe to set the new check
  input.setCheck(check);

  // 4. Schedule shadow attachment asynchronously.
  //    - During deserialization: the JSON shadow is connected synchronously via
  //      Blockly's setShadowState() before this timeout fires, so attachShadow's
  //      guard ("already has something") correctly skips duplicate creation.
  //    - During user interaction: by the time this fires, the old shadow has been
  //      disposed in step 2, so the input is empty and a fresh shadow is attached.
  if (replaceShadow) {
    setTimeout(() => attachShadow(block, inputName, type), 0);
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
          // Synchronous update — required for correct workspace deserialization.
          // (Shadow attachment is deferred inside updateValueInput.)
          updateValueInput(self, 'VALUE', newValue, true);
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
          // Synchronous update — required for correct workspace deserialization.
          const type = lookupVariableType(self.workspace, newValue);
          updateValueInput(self, 'VALUE', type, true);
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
    if (this.isInFlyout) return;
    const varName = this.getFieldValue('VAR');
    const type = lookupVariableType(this.workspace, varName);
    // replaceShadow=false: don't create new shadows from onchange (only from explicit VAR change)
    updateValueInput(this, 'VALUE', type, false);
  },
};

// ── Get variable ──
Blockly.Blocks['typed_variable_get'] = {
  init: function (this: Blockly.Block) {
    const self = this;
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown(declaredVarOptions, function (newValue: string) {
        // Synchronous update
        const type = lookupVariableType(self.workspace, newValue);
        self.setOutput(true, typeToCheck(type));
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
      .appendField(new Blockly.FieldDropdown(numericVarOptions) as Blockly.Field, 'VAR')
      .appendField('en');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip('Incrementa o decrementa una variable numérica');
  },
};
