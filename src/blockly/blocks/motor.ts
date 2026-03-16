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
