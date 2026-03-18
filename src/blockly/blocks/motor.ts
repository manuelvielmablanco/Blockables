import * as Blockly from 'blockly';

const DIGITAL_PINS: [string, string][] = [['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],['8','8'],['9','9'],['10','10'],['11','11'],['12','12'],['13','13']];
const PWM_PINS: [string, string][] = [['3','3'],['5','5'],['6','6'],['9','9'],['10','10'],['11','11']];

Blockly.Blocks['motor_dc'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('motor DC')
      .appendField('IN1').appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'IN1')
      .appendField('IN2').appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'IN2')
      .appendField('EN').appendField(new Blockly.FieldDropdown(PWM_PINS) as Blockly.Field, 'EN');
    this.appendDummyInput()
      .appendField('dirección')
      .appendField(new Blockly.FieldDropdown([['adelante','FORWARD'],['atrás','BACKWARD']]) as Blockly.Field, 'DIR');
    this.appendValueInput('SPEED').setCheck('Number').appendField('velocidad');
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('motor_blocks');
    this.setTooltip('Controla un motor DC con driver L298N/L293D');
  },
};

Blockly.Blocks['motor_dc_stop'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('parar motor DC')
      .appendField('IN1').appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'IN1')
      .appendField('IN2').appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'IN2')
      .appendField('EN').appendField(new Blockly.FieldDropdown(PWM_PINS) as Blockly.Field, 'EN');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('motor_blocks');
    this.setTooltip('Detiene el motor DC');
  },
};

// === Servo ===
Blockly.Blocks['motor_servo'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('ANGLE')
      .setCheck('Number')
      .appendField('servo PIN')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN')
      .appendField('ángulo');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('motor_blocks');
    this.setTooltip('Mueve un servomotor al ángulo indicado (0-180)');
  },
};

// === Stepper (28BYJ-48 / NEMA 17) ===
Blockly.Blocks['motor_stepper_init'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('configurar stepper');
    this.appendValueInput('STEPS_REV')
      .setCheck('Number')
      .appendField('pasos/vuelta');
    this.appendDummyInput()
      .appendField('PIN1').appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN1')
      .appendField('PIN2').appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN2')
      .appendField('PIN3').appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN3')
      .appendField('PIN4').appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN4');
    this.appendValueInput('SPEED')
      .setCheck('Number')
      .appendField('velocidad (RPM)');
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('motor_blocks');
    this.setTooltip('Configura un motor paso a paso (28BYJ-48, NEMA 17, etc.)');
  },
};

Blockly.Blocks['motor_stepper_setspeed'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('RPM')
      .setCheck('Number')
      .appendField('velocidad stepper (RPM)');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('motor_blocks');
    this.setTooltip('Cambia la velocidad del motor paso a paso');
  },
};

Blockly.Blocks['motor_stepper_step'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('STEPS')
      .setCheck('Number')
      .appendField('mover stepper pasos');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('motor_blocks');
    this.setTooltip('Mueve el stepper N pasos (positivo = horario, negativo = antihorario)');
  },
};
