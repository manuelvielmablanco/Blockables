import * as Blockly from 'blockly';

Blockly.Blocks['serial_begin'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('iniciar puerto serie a')
      .appendField(new Blockly.FieldDropdown([['9600','9600'],['115200','115200'],['57600','57600'],['38400','38400'],['19200','19200'],['4800','4800']]) as Blockly.Field, 'BAUD')
      .appendField('baudios');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('serial_blocks');
    this.setTooltip('Inicia la comunicación serie a la velocidad indicada');
  },
};

Blockly.Blocks['serial_print'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('VALUE').appendField('serie: escribir');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('serial_blocks');
    this.setTooltip('Envía datos por el puerto serie (sin salto de línea)');
  },
};

Blockly.Blocks['serial_println'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('VALUE').appendField('serie: escribir línea');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('serial_blocks');
    this.setTooltip('Envía datos por el puerto serie (con salto de línea)');
  },
};

Blockly.Blocks['serial_available'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('serie: datos disponibles');
    this.setOutput(true, 'Boolean');
    this.setStyle('serial_blocks');
    this.setTooltip('Comprueba si hay datos disponibles en el puerto serie');
  },
};

Blockly.Blocks['serial_read'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('serie: leer carácter');
    this.setOutput(true, 'Number');
    this.setStyle('serial_blocks');
    this.setTooltip('Lee un byte del puerto serie');
  },
};

Blockly.Blocks['serial_readstring'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('serie: leer texto');
    this.setOutput(true, 'String');
    this.setStyle('serial_blocks');
    this.setTooltip('Lee una cadena de texto del puerto serie');
  },
};
