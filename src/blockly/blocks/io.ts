import * as Blockly from 'blockly';

const DIGITAL_PINS: [string, string][] = [['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],['8','8'],['9','9'],['10','10'],['11','11'],['12','12'],['13','13']];
const ANALOG_PINS: [string, string][] = [['A0','A0'],['A1','A1'],['A2','A2'],['A3','A3'],['A4','A4'],['A5','A5']];
const PWM_PINS: [string, string][] = [['3','3'],['5','5'],['6','6'],['9','9'],['10','10'],['11','11']];

Blockly.Blocks['io_pinmode'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('configurar PIN')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN')
      .appendField('como')
      .appendField(new Blockly.FieldDropdown([['ENTRADA', 'INPUT'], ['SALIDA', 'OUTPUT'], ['ENTRADA PULLUP', 'INPUT_PULLUP']]) as Blockly.Field, 'MODE');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('io_blocks');
    this.setTooltip('Configura un pin como entrada o salida');
  },
};

Blockly.Blocks['io_digitalwrite'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('VALUE')
      .setCheck('Boolean')
      .appendField('escribir digital PIN')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('io_blocks');
    this.setTooltip('Escribe un valor digital en un pin');
  },
};

Blockly.Blocks['io_digitalread'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('leer digital PIN')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN');
    this.setOutput(true, 'Boolean');
    this.setStyle('io_blocks');
    this.setTooltip('Lee el valor digital de un pin');
  },
};

Blockly.Blocks['io_analogwrite'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('VALUE')
      .setCheck('Number')
      .appendField('escribir analógico PIN')
      .appendField(new Blockly.FieldDropdown(PWM_PINS) as Blockly.Field, 'PIN');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('io_blocks');
    this.setTooltip('Escribe un valor analógico (PWM 0-255) en un pin');
  },
};

Blockly.Blocks['io_analogread'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('leer analógico PIN')
      .appendField(new Blockly.FieldDropdown(ANALOG_PINS) as Blockly.Field, 'PIN');
    this.setOutput(true, 'Number');
    this.setStyle('io_blocks');
    this.setTooltip('Lee el valor analógico de un pin (0-1023)');
  },
};
