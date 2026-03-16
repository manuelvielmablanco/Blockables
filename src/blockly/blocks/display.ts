import * as Blockly from 'blockly';

Blockly.Blocks['lcd_init'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('iniciar LCD')
      .appendField(new Blockly.FieldDropdown([['16x2','16,2'],['20x4','20,4']]) as Blockly.Field, 'SIZE')
      .appendField('dirección I2C')
      .appendField(new Blockly.FieldDropdown([['0x27','0x27'],['0x3F','0x3F']]) as Blockly.Field, 'ADDR');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Inicializa la pantalla LCD I2C');
  },
};

Blockly.Blocks['lcd_print'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('TEXT').appendField('LCD escribir');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Escribe texto en la pantalla LCD');
  },
};

Blockly.Blocks['lcd_setcursor'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('LCD cursor columna')
      .appendField(new Blockly.FieldNumber(0, 0, 19) as Blockly.Field, 'COL')
      .appendField('fila')
      .appendField(new Blockly.FieldNumber(0, 0, 3) as Blockly.Field, 'ROW');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Posiciona el cursor en la pantalla LCD');
  },
};

Blockly.Blocks['lcd_clear'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('LCD borrar pantalla');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Borra el contenido de la pantalla LCD');
  },
};
