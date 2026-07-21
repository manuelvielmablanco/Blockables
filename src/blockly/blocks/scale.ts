import * as Blockly from 'blockly';

/**
 * Balanza con célula de carga + módulo HX711 (librería "HX711 Arduino Library"
 * de Bogdan). El objeto global se llama `balanza`.
 * Flujo típico de taller:
 *   1) iniciar balanza (DT, SCK)
 *   2) fijar factor de escala + tara
 *   3) leer peso (get_units)
 */

const DIGITAL_PINS: [string, string][] = [
  ['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],
  ['8','8'],['9','9'],['10','10'],['11','11'],['12','12'],['13','13'],
];

Blockly.Blocks['scale_begin'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('iniciar balanza HX711 · DT')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'DT')
      .appendField('SCK')
      .appendField(new Blockly.FieldDropdown(DIGITAL_PINS) as Blockly.Field, 'SCK');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('scale_blocks');
    this.setTooltip('Inicializa la balanza (célula de carga) con el módulo HX711 en los pines DT y SCK');
  },
};

Blockly.Blocks['scale_set_scale'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('FACTOR')
      .setCheck('Number')
      .appendField('balanza · fijar factor de escala');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('scale_blocks');
    this.setTooltip('Fija el factor de escala. Usa 1 para calibrar (lectura en bruto) y el valor calculado para pesar en gramos');
  },
};

Blockly.Blocks['scale_tare'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('balanza · tara (poner a cero)');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('scale_blocks');
    this.setTooltip('Pone la balanza a cero con el peso actual sobre ella');
  },
};

Blockly.Blocks['scale_get_units'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('COUNT')
      .setCheck('Number')
      .appendField('balanza · leer peso (promedio de');
    this.appendDummyInput().appendField('lecturas)');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setStyle('scale_blocks');
    this.setTooltip('Devuelve el peso medido (promedio del número de lecturas indicado)');
  },
};

Blockly.Blocks['scale_power'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField('balanza ·')
      .appendField(new Blockly.FieldDropdown([['apagar', 'down'], ['encender', 'up']]) as Blockly.Field, 'MODE')
      .appendField('módulo');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('scale_blocks');
    this.setTooltip('Apaga (ahorro) o enciende el módulo HX711');
  },
};
