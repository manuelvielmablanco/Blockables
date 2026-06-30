import * as Blockly from 'blockly';

/**
 * Bloques propios del kit Theremin. Encapsulan el firmware original (ver
 * src/blockly/theremin-firmware.ts): `theremin_init` va dentro de Inicializar
 * y `theremin_run` dentro de Bucle. Su generador (arduino.ts) vuelca el código
 * real del .ino, así que al cargar el kit el alumno recupera el programa de
 * fábrica tal cual.
 */

Blockly.Blocks['theremin_init'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('🎵 Theremin · iniciar (sensor, luz y sonido)');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('sensor_blocks');
    this.setTooltip(
      'Inicializa el Theremin: tira NeoPixel, sensor de distancia ToF (VL53L0X), ' +
        'buzzer por Timer1 y entradas táctiles. Carga el programa original del kit.',
    );
  },
};

Blockly.Blocks['theremin_run'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('🎵 Theremin · ejecutar');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('sensor_blocks');
    this.setTooltip(
      'Lógica principal del Theremin: modos de luz y sonido por distancia, ' +
        'melodías y cambio de escalas con los táctiles (pulsación corta/larga).',
    );
  },
};
