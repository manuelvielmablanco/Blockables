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

const OLED_FILL: [string, string][] = [
  ['línea', 'line'],
  ['lleno', 'fill'],
];

Blockly.Blocks['oled_drawline'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('OLED dibujar línea');
    this.appendValueInput('X1').setCheck('Number').appendField('de X1');
    this.appendValueInput('Y1').setCheck('Number').appendField('Y1');
    this.appendValueInput('X2').setCheck('Number').appendField('a X2');
    this.appendValueInput('Y2').setCheck('Number').appendField('Y2');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Dibuja una línea entre dos puntos en la OLED');
  },
};

Blockly.Blocks['oled_drawrect'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('OLED rectángulo')
      .appendField(new Blockly.FieldDropdown(OLED_FILL) as Blockly.Field, 'MODE');
    this.appendValueInput('X').setCheck('Number').appendField('X');
    this.appendValueInput('Y').setCheck('Number').appendField('Y');
    this.appendValueInput('W').setCheck('Number').appendField('ancho');
    this.appendValueInput('H').setCheck('Number').appendField('alto');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Dibuja un rectángulo (línea o lleno) en la OLED');
  },
};

Blockly.Blocks['oled_drawcircle'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('OLED círculo')
      .appendField(new Blockly.FieldDropdown(OLED_FILL) as Blockly.Field, 'MODE');
    this.appendValueInput('X').setCheck('Number').appendField('centro X');
    this.appendValueInput('Y').setCheck('Number').appendField('Y');
    this.appendValueInput('R').setCheck('Number').appendField('radio');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Dibuja un círculo (línea o lleno) en la OLED');
  },
};

Blockly.Blocks['oled_drawtriangle'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('OLED triángulo')
      .appendField(new Blockly.FieldDropdown(OLED_FILL) as Blockly.Field, 'MODE');
    this.appendValueInput('X1').setCheck('Number').appendField('X1');
    this.appendValueInput('Y1').setCheck('Number').appendField('Y1');
    this.appendValueInput('X2').setCheck('Number').appendField('X2');
    this.appendValueInput('Y2').setCheck('Number').appendField('Y2');
    this.appendValueInput('X3').setCheck('Number').appendField('X3');
    this.appendValueInput('Y3').setCheck('Number').appendField('Y3');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Dibuja un triángulo (línea o lleno) en la OLED');
  },
};

Blockly.Blocks['oled_scroll'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('OLED desplazar')
      .appendField(
        new Blockly.FieldDropdown([
          ['→ derecha', 'right'],
          ['← izquierda', 'left'],
          ['↗ diagonal derecha', 'diagright'],
          ['↖ diagonal izquierda', 'diagleft'],
          ['■ detener', 'stop'],
        ]) as Blockly.Field,
        'DIR',
      );
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('display_blocks');
    this.setTooltip('Activa el desplazamiento (scroll) por hardware de la OLED');
  },
};
