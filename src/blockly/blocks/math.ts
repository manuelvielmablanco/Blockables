import * as Blockly from 'blockly';

// === Math Change (increment variable) ===
Blockly.Blocks['math_change'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('cambiar')
      .appendField(new Blockly.FieldVariable('item') as Blockly.Field, 'VAR')
      .appendField('por');
    this.appendValueInput('DELTA').setCheck('Number');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('math_blocks');
    this.setTooltip('Incrementa una variable por un valor');
  },
};

Blockly.Blocks['math_map'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('VALUE').setCheck('Number').appendField('mapear');
    this.appendValueInput('FROM_LOW').setCheck('Number').appendField('de');
    this.appendValueInput('FROM_HIGH').setCheck('Number').appendField('-');
    this.appendValueInput('TO_LOW').setCheck('Number').appendField('a');
    this.appendValueInput('TO_HIGH').setCheck('Number').appendField('-');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setStyle('math_blocks');
    this.setTooltip('Mapea un valor de un rango a otro');
  },
};
