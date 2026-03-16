import * as Blockly from 'blockly';

const DIGITAL_PINS: [string, string][] = [['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],['8','8'],['9','9'],['10','10'],['11','11'],['12','12'],['13','13']];
const ANALOG_PINS: [string, string][] = [['A0','A0'],['A1','A1'],['A2','A2'],['A3','A3'],['A4','A4'],['A5','A5']];

Blockly.Blocks['sensor_button'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('pulsador PIN')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN')
      .appendField('lógica invertida')
      .appendField(new Blockly.FieldCheckbox('FALSE') as Blockly.Field, 'INVERTED');
    this.setOutput(true, 'Boolean');
    this.setStyle('sensor_blocks');
    this.setTooltip('Lee el estado de un pulsador');
  },
};

Blockly.Blocks['sensor_potentiometer'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('potenciómetro PIN')
      .appendField(new Blockly.FieldDropdown(ANALOG_PINS) as Blockly.Field, 'PIN')
      .appendField(new Blockly.FieldDropdown([['%','PERCENT'],['valor bruto','RAW']]) as Blockly.Field, 'MODE');
    this.setOutput(true, 'Number');
    this.setStyle('sensor_blocks');
    this.setTooltip('Lee el valor de un potenciómetro');
  },
};

Blockly.Blocks['sensor_light'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('sensor de luz PIN')
      .appendField(new Blockly.FieldDropdown(ANALOG_PINS) as Blockly.Field, 'PIN')
      .appendField(new Blockly.FieldDropdown([['%','PERCENT'],['valor bruto','RAW']]) as Blockly.Field, 'MODE');
    this.setOutput(true, 'Number');
    this.setStyle('sensor_blocks');
    this.setTooltip('Lee el valor del sensor de luz');
  },
};

Blockly.Blocks['sensor_dht_read'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([['DHT11','DHT11'],['DHT22','DHT22']]) as Blockly.Field, 'TYPE')
      .appendField('PIN')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN')
      .appendField('leer')
      .appendField(new Blockly.FieldDropdown([['temperatura °C','TEMP'],['humedad %','HUM']]) as Blockly.Field, 'VALUE');
    this.setOutput(true, 'Number');
    this.setStyle('sensor_blocks');
    this.setTooltip('Lee temperatura o humedad del sensor DHT');
  },
};

Blockly.Blocks['sensor_ultrasonic'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('ultrasonidos TRIG')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'TRIG')
      .appendField('ECHO')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'ECHO');
    this.appendDummyInput()
      .appendField('distancia en')
      .appendField(new Blockly.FieldDropdown([['cm','CM'],['pulgadas','INCH']]) as Blockly.Field, 'UNIT');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setStyle('sensor_blocks');
    this.setTooltip('Lee la distancia medida por el sensor ultrasónico HC-SR04');
  },
};

Blockly.Blocks['sensor_pir'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('sensor movimiento PIR PIN')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN');
    this.setOutput(true, 'Boolean');
    this.setStyle('sensor_blocks');
    this.setTooltip('Detecta movimiento con el sensor PIR');
  },
};

Blockly.Blocks['sensor_soil_moisture'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('humedad suelo PIN')
      .appendField(new Blockly.FieldDropdown(ANALOG_PINS) as Blockly.Field, 'PIN')
      .appendField(new Blockly.FieldDropdown([['%','PERCENT'],['valor bruto','RAW']]) as Blockly.Field, 'MODE');
    this.setOutput(true, 'Number');
    this.setStyle('sensor_blocks');
    this.setTooltip('Lee la humedad del suelo');
  },
};

Blockly.Blocks['sensor_sound'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('sensor sonido PIN')
      .appendField(new Blockly.FieldDropdown(ANALOG_PINS) as Blockly.Field, 'PIN');
    this.setOutput(true, 'Number');
    this.setStyle('sensor_blocks');
    this.setTooltip('Lee el nivel de sonido');
  },
};

Blockly.Blocks['sensor_tilt'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('sensor inclinación PIN')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN')
      .appendField('lógica invertida')
      .appendField(new Blockly.FieldCheckbox('FALSE') as Blockly.Field, 'INVERTED');
    this.setOutput(true, 'Boolean');
    this.setStyle('sensor_blocks');
    this.setTooltip('Detecta inclinación');
  },
};

Blockly.Blocks['sensor_joystick'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('joystick')
      .appendField(new Blockly.FieldDropdown([['eje X','X'],['eje Y','Y'],['botón','BTN']]) as Blockly.Field, 'AXIS')
      .appendField('PIN')
      .appendField(new Blockly.FieldDropdown([['A0','A0'],['A1','A1'],['A2','A2'],['A3','A3'],['A4','A4'],['A5','A5'],['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7']]) as Blockly.Field, 'PIN');
    this.setOutput(true, 'Number');
    this.setStyle('sensor_blocks');
    this.setTooltip('Lee el valor del joystick');
  },
};
