import * as Blockly from 'blockly';

// ── WiFi Connect ──
Blockly.Blocks['wifi_connect'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('conectar WiFi');
    this.appendValueInput('SSID')
      .setCheck('String')
      .appendField('SSID');
    this.appendValueInput('PASS')
      .setCheck('String')
      .appendField('contraseña');
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('wifi_blocks');
    this.setTooltip('Conecta a una red WiFi');
  },
};

// ── WiFi Status ──
Blockly.Blocks['wifi_connected'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('WiFi conectado?');
    this.setOutput(true, 'Boolean');
    this.setStyle('wifi_blocks');
    this.setTooltip('Comprueba si está conectado al WiFi');
  },
};

// ── WiFi Local IP ──
Blockly.Blocks['wifi_localip'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('WiFi dirección IP');
    this.setOutput(true, 'String');
    this.setStyle('wifi_blocks');
    this.setTooltip('Obtiene la dirección IP local');
  },
};

// ── WiFi Disconnect ──
Blockly.Blocks['wifi_disconnect'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('desconectar WiFi');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('wifi_blocks');
    this.setTooltip('Desconecta del WiFi');
  },
};

// ── WiFi RSSI (signal strength) ──
Blockly.Blocks['wifi_rssi'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('WiFi intensidad señal (RSSI)');
    this.setOutput(true, 'Number');
    this.setStyle('wifi_blocks');
    this.setTooltip('Devuelve la intensidad de la señal WiFi en dBm');
  },
};

// ── HTTP GET ──
Blockly.Blocks['wifi_http_get'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('URL')
      .setCheck('String')
      .appendField('HTTP GET');
    this.setOutput(true, 'String');
    this.setStyle('wifi_blocks');
    this.setTooltip('Realiza una petición HTTP GET y devuelve la respuesta');
  },
};

// ── HTTP POST ──
Blockly.Blocks['wifi_http_post'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('URL')
      .setCheck('String')
      .appendField('HTTP POST');
    this.appendValueInput('BODY')
      .setCheck('String')
      .appendField('datos');
    this.setInputsInline(false);
    this.setOutput(true, 'String');
    this.setStyle('wifi_blocks');
    this.setTooltip('Realiza una petición HTTP POST');
  },
};
