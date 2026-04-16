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
  const block = (this as any).getSourceBlock?.();
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
 * Map Arduino/C++ type to Blockly input check type.
 */
function typeToCheck(type: string): string | null {
  switch (type) {
    case 'bool': return 'Boolean';
    case 'String': return 'String';
    case 'char': return null; // allow anything (char is tricky)
    default: return 'Number'; // int, float, long, byte
  }
}

/**
 * Update the VALUE input's check and its shadow block based on the selected TYPE.
 */
function updateValueInputForType(block: Blockly.Block, type: string) {
  const input = block.getInput('VALUE');
  if (!input) return;
  const check = typeToCheck(type);
  input.setCheck(check);

  // Replace shadow block with one appropriate for the type
  const target = input.connection?.targetBlock();
  // Only replace if current target is a shadow (auto-generated default)
  if (target && target.isShadow()) {
    target.dispose(false);
  }
  if (!input.connection?.targetBlock()) {
    let shadowType = 'math_number';
    let fields: Record<string, string | number> = { NUM: 0 };
    if (type === 'bool') {
      shadowType = 'logic_boolean';
      fields = { BOOL: 'FALSE' };
    } else if (type === 'String') {
      shadowType = 'text';
      fields = { TEXT: '' };
    }
    try {
      const ws = block.workspace;
      const shadow = ws.newBlock(shadowType);
      shadow.setShadow(true);
      for (const [fname, fval] of Object.entries(fields)) {
        shadow.setFieldValue(String(fval), fname);
      }
      if ((shadow as any).initSvg) (shadow as any).initSvg();
      if ((shadow as any).render) (shadow as any).render();
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
          setTimeout(() => updateValueInputForType(self, newValue), 0);
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
    this.appendValueInput('VALUE')
      .appendField('establecer')
      .appendField(new Blockly.FieldDropdown(declaredVarOptions) as Blockly.Field, 'VAR')
      .appendField('=');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip('Asigna un valor a una variable existente');
  },
};

// ── Get variable ──
Blockly.Blocks['typed_variable_get'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown(declaredVarOptions) as Blockly.Field, 'VAR');
    this.setOutput(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip('Obtiene el valor de una variable');
  },
};

// ── Increment / Decrement variable ──
Blockly.Blocks['typed_variable_change'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('DELTA')
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
