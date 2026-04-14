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

// ── Declare variable ──
Blockly.Blocks['typed_variable_declare'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('crear variable')
      .appendField(new Blockly.FieldDropdown(VAR_TYPES) as Blockly.Field, 'TYPE')
      .appendField(new Blockly.FieldTextInput('miVariable') as Blockly.Field, 'VAR');
    this.appendValueInput('VALUE')
      .appendField('=');
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
