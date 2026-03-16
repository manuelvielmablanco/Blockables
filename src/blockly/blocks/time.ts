import * as Blockly from 'blockly';

Blockly.Blocks['time_delay'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('MS').setCheck('Number').appendField('esperar');
    this.appendDummyInput().appendField('ms');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('time_blocks');
    this.setTooltip('Pausa la ejecución durante los milisegundos indicados');
  },
};

Blockly.Blocks['time_delaymicros'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('US').setCheck('Number').appendField('esperar');
    this.appendDummyInput().appendField('μs');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('time_blocks');
    this.setTooltip('Pausa la ejecución durante los microsegundos indicados');
  },
};

Blockly.Blocks['time_millis'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('milisegundos transcurridos');
    this.setOutput(true, 'Number');
    this.setStyle('time_blocks');
    this.setTooltip('Devuelve los milisegundos desde que se inició el programa');
  },
};

Blockly.Blocks['time_micros'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('microsegundos transcurridos');
    this.setOutput(true, 'Number');
    this.setStyle('time_blocks');
    this.setTooltip('Devuelve los microsegundos desde que se inició el programa');
  },
};
