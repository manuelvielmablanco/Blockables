import * as Blockly from 'blockly';

// ── BT Serial Begin ──
Blockly.Blocks['bt_begin'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('NAME')
      .setCheck('String')
      .appendField('iniciar Bluetooth con nombre');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Inicia el Bluetooth Serial con el nombre dado');
  },
};

// ── BT Available ──
Blockly.Blocks['bt_available'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('Bluetooth: datos disponibles');
    this.setOutput(true, 'Boolean');
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Comprueba si hay datos disponibles por Bluetooth');
  },
};

// ── BT Read ──
Blockly.Blocks['bt_read'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('Bluetooth: leer carácter');
    this.setOutput(true, 'Number');
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Lee un byte recibido por Bluetooth');
  },
};

// ── BT Read String ──
Blockly.Blocks['bt_readstring'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('Bluetooth: leer texto');
    this.setOutput(true, 'String');
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Lee una cadena recibida por Bluetooth');
  },
};

// ── BT Print ──
Blockly.Blocks['bt_print'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('VALUE')
      .appendField('Bluetooth: enviar');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Envía datos por Bluetooth');
  },
};

// ── BT Println ──
Blockly.Blocks['bt_println'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('VALUE')
      .appendField('Bluetooth: enviar línea');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Envía datos por Bluetooth con salto de línea');
  },
};

// ── BT Connected ──
Blockly.Blocks['bt_connected'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('Bluetooth: conectado?');
    this.setOutput(true, 'Boolean');
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Comprueba si hay un dispositivo Bluetooth conectado');
  },
};
