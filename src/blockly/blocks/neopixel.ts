import * as Blockly from 'blockly';

const DIGITAL_PINS: [string, string][] = [['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],['8','8'],['9','9'],['10','10'],['11','11'],['12','12'],['13','13'],['A0','A0'],['A1','A1'],['A2','A2'],['A3','A3'],['A4','A4'],['A5','A5']];

Blockly.Blocks['neopixel_init'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('iniciar NeoPixel PIN')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'PIN')
      .appendField('nº LEDs')
      .appendField(new Blockly.FieldNumber(8, 1, 300) as Blockly.Field, 'NUM');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('neopixel_blocks');
    this.setTooltip('Inicializa una tira de NeoPixel');
  },
};

Blockly.Blocks['neopixel_setcolor'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('INDEX').setCheck('Number').appendField('NeoPixel LED nº');
    this.appendValueInput('R').setCheck('Number').appendField('R');
    this.appendValueInput('G').setCheck('Number').appendField('G');
    this.appendValueInput('B').setCheck('Number').appendField('B');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('neopixel_blocks');
    this.setTooltip('Establece el color de un LED NeoPixel');
  },
};

Blockly.Blocks['neopixel_setbrightness'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('BRIGHTNESS')
      .setCheck('Number')
      .appendField('NeoPixel brillo');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('neopixel_blocks');
    this.setTooltip('Ajusta el brillo de la tira NeoPixel (0-255)');
  },
};

Blockly.Blocks['neopixel_setcolor_picker'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('LEDNUMBER')
      .setCheck('Number')
      .appendField('NeoPixel LED nº');
    this.appendValueInput('COLOUR')
      .setCheck('Colour')
      .appendField('color');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('neopixel_blocks');
    this.setTooltip('Establece el color de un LED NeoPixel con selector de color');
  },
};

Blockly.Blocks['neopixel_effect'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('NeoPixel efecto')
      .appendField(new Blockly.FieldDropdown([
        ['Arcoíris', 'RAINBOW'],
        ['Arcoíris cíclico', 'RAINBOW_CYCLE'],
        ['Color aleatorio', 'RANDOM'],
      ]) as Blockly.Field, 'EFFECT');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('neopixel_blocks');
    this.setTooltip('Aplica un efecto predefinido a la tira NeoPixel');
  },
};

Blockly.Blocks['neopixel_show'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('NeoPixel mostrar');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('neopixel_blocks');
    this.setTooltip('Actualiza los colores de la tira NeoPixel');
  },
};

Blockly.Blocks['neopixel_clear'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('NeoPixel apagar todos');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('neopixel_blocks');
    this.setTooltip('Apaga todos los LEDs NeoPixel');
  },
};
