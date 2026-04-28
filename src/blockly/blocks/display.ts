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

// === OLED SSD1306 128x64 I2C ===
const OLED_I2C_ADDRS: [string, string][] = [
  ['0x3C', '0x3C'],
  ['0x3D', '0x3D'],
];

Blockly.Blocks['oled_init'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('iniciar OLED SSD1306 128x64 I2C')
      .appendField('dirección')
      .appendField(new Blockly.FieldDropdown(OLED_I2C_ADDRS) as Blockly.Field, 'ADDR');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Inicializa la pantalla OLED SSD1306 128x64 por I2C');
  },
};

Blockly.Blocks['oled_clear'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('OLED borrar pantalla');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Borra el contenido del buffer OLED');
  },
};

Blockly.Blocks['oled_setcursor'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('OLED cursor X')
      .appendField(new Blockly.FieldNumber(0, 0, 127) as Blockly.Field, 'X')
      .appendField('Y')
      .appendField(new Blockly.FieldNumber(0, 0, 63) as Blockly.Field, 'Y');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Posiciona el cursor en la pantalla OLED (en píxeles)');
  },
};

Blockly.Blocks['oled_textsize'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('OLED tamaño de texto')
      .appendField(new Blockly.FieldDropdown([['1','1'],['2','2'],['3','3'],['4','4']]) as Blockly.Field, 'SIZE');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Cambia el tamaño del texto en la pantalla OLED');
  },
};

Blockly.Blocks['oled_print'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('TEXT').appendField('OLED escribir');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Escribe texto en el buffer de la OLED');
  },
};

Blockly.Blocks['oled_display'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('OLED actualizar pantalla');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Vuelca el buffer al hardware (display.display())');
  },
};
