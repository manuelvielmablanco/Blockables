import * as Blockly from 'blockly';

const DIGITAL_PINS: [string, string][] = [['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],['8','8'],['9','9'],['10','10'],['11','11'],['12','12'],['13','13'],['A0','A0'],['A1','A1'],['A2','A2'],['A3','A3'],['A4','A4'],['A5','A5']];
const PWM_PINS: [string, string][] = [['3','3'],['5','5'],['6','6'],['9','9'],['10','10'],['11','11']];

Blockly.Blocks['actuator_led'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('LED PIN')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN')
      .appendField('estado')
      .appendField(new Blockly.FieldDropdown([['ON','HIGH'],['OFF','LOW']]) as Blockly.Field, 'STATE');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('actuator_blocks');
    this.setTooltip('Enciende o apaga un LED');
  },
};

Blockly.Blocks['actuator_led_pwm'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('VALUE')
      .setCheck('Number')
      .appendField('LED (PWM) PIN')
      .appendField(new Blockly.FieldDropdown(PWM_PINS) as Blockly.Field, 'PIN')
      .appendField('brillo');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('actuator_blocks');
    this.setTooltip('Controla el brillo del LED (0-255)');
  },
};

Blockly.Blocks['actuator_led_rgb'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('LED RGB')
      .appendField(new Blockly.FieldDropdown([['cátodo','CATHODE'],['ánodo','ANODE']]) as Blockly.Field, 'TYPE')
      .appendField('común');
    this.appendDummyInput()
      .appendField('R')
      .appendField(new Blockly.FieldDropdown(PWM_PINS) as Blockly.Field, 'PIN_R')
      .appendField('G')
      .appendField(new Blockly.FieldDropdown(PWM_PINS) as Blockly.Field, 'PIN_G')
      .appendField('B')
      .appendField(new Blockly.FieldDropdown(PWM_PINS) as Blockly.Field, 'PIN_B');
    this.appendValueInput('R').setCheck('Number').appendField('R');
    this.appendValueInput('G').setCheck('Number').appendField('G');
    this.appendValueInput('B').setCheck('Number').appendField('B');
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('actuator_blocks');
    this.setTooltip('Controla un LED RGB');
  },
};

Blockly.Blocks['actuator_buzzer_tone'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('zumbador PIN')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN');
    this.appendValueInput('FREQ').setCheck('Number').appendField('frecuencia (Hz)');
    this.appendValueInput('DURATION').setCheck('Number').appendField('duración (ms)');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('actuator_blocks');
    this.setTooltip('Emite un tono con el zumbador');
  },
};

Blockly.Blocks['actuator_buzzer_melody'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('zumbador PIN')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN')
      .appendField('melodía')
      .appendField(new Blockly.FieldDropdown([['Tetris','tetris'],['Mario Bros','mario'],['Star Wars','starwars'],['Jingle Bells','jingle']]) as Blockly.Field, 'MELODY');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('actuator_blocks');
    this.setTooltip('Reproduce una melodía predefinida');
  },
};

// actuator_servo moved to motor.ts as motor_servo
// Generator kept in arduino.ts for backwards compatibility

Blockly.Blocks['actuator_relay'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('relé PIN')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN')
      .appendField('estado')
      .appendField(new Blockly.FieldDropdown([['ON','HIGH'],['OFF','LOW']]) as Blockly.Field, 'STATE');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('actuator_blocks');
    this.setTooltip('Activa o desactiva un módulo relé');
  },
};
