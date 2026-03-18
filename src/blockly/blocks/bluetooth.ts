import * as Blockly from 'blockly';

const DIGITAL_PINS: [string, string][] = [
  ['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],
  ['8','8'],['9','9'],['10','10'],['11','11'],['12','12'],['13','13'],
];

const BAUD_RATES: [string, string][] = [
  ['9600','9600'],['38400','38400'],['57600','57600'],['115200','115200'],
];

// ── BT Begin ──
Blockly.Blocks['bt_begin'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('Bluetooth')
      .appendField('\u{1F7E6}')
      .appendField('Iniciar')
      .appendField('RX').appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'RX')
      .appendField('TX').appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'TX')
      .appendField(new Blockly.FieldDropdown(BAUD_RATES) as Blockly.Field, 'BAUD')
      .appendField('Baudios');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Inicia la comunicación Bluetooth (HC-05/HC-06) en los pines indicados');
  },
};

// ── BT Rename ──
Blockly.Blocks['bt_rename'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('NAME')
      .setCheck('String')
      .appendField('Bluetooth')
      .appendField('\u{1F7E6}')
      .appendField('Cambiar nombre');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Cambia el nombre del módulo Bluetooth (AT command)');
  },
};

// ── BT Send ──
Blockly.Blocks['bt_send'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('VALUE')
      .setCheck(null)
      .appendField('Bluetooth')
      .appendField('\u{1F7E6}')
      .appendField('Enviar');
    this.appendDummyInput()
      .appendField('Salto de línea')
      .appendField(new Blockly.FieldCheckbox('TRUE') as Blockly.Field, 'NEWLINE');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Envía datos por Bluetooth');
  },
};

// ── BT Send Byte ──
Blockly.Blocks['bt_send_byte'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('BYTE')
      .setCheck('Number')
      .appendField('Bluetooth')
      .appendField('\u{1F7E6}')
      .appendField('Enviar byte');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Envía un byte por Bluetooth');
  },
};

// ── BT Available ──
Blockly.Blocks['bt_available'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('Bluetooth')
      .appendField('\u{1F7E6}')
      .appendField('¿Datos recibidos?');
    this.setOutput(true, 'Boolean');
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Comprueba si hay datos disponibles por Bluetooth');
  },
};

// ── BT Receive Text ──
Blockly.Blocks['bt_receive_text'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('Bluetooth')
      .appendField('\u{1F7E6}')
      .appendField('Recibir texto')
      .appendField('Hasta salto de línea')
      .appendField(new Blockly.FieldCheckbox('TRUE') as Blockly.Field, 'UNTIL_NL');
    this.setOutput(true, 'String');
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Lee texto recibido por Bluetooth');
  },
};

// ── BT Receive Number ──
Blockly.Blocks['bt_receive_number'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('Bluetooth')
      .appendField('\u{1F7E6}')
      .appendField('Recibir como número')
      .appendField('Hasta salto de línea')
      .appendField(new Blockly.FieldCheckbox('TRUE') as Blockly.Field, 'UNTIL_NL');
    this.setOutput(true, 'Number');
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Lee un número recibido por Bluetooth');
  },
};

// ── BT Receive Byte ──
Blockly.Blocks['bt_receive_byte'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('Bluetooth')
      .appendField('\u{1F7E6}')
      .appendField('Recibir byte');
    this.setOutput(true, 'Number');
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Lee un byte recibido por Bluetooth');
  },
};

// ── BT Set Timeout ──
Blockly.Blocks['bt_set_timeout'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('TIMEOUT')
      .setCheck('Number')
      .appendField('Bluetooth')
      .appendField('\u{1F7E6}')
      .appendField('Fijar tiempo máximo');
    this.appendDummyInput().appendField('ms');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('bluetooth_blocks');
    this.setTooltip('Establece el timeout para lecturas Bluetooth (ms)');
  },
};
