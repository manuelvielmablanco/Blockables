import * as Blockly from 'blockly';

Blockly.Blocks['arduino_setup'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('⚙️ Inicializar');
    this.appendStatementInput('SETUP').setCheck(null);
    this.setStyle('setup_blocks');
    this.setTooltip('Código que se ejecuta una vez al inicio');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['arduino_loop'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput().appendField('🔄 Bucle');
    this.appendStatementInput('LOOP').setCheck(null);
    this.setStyle('setup_blocks');
    this.setTooltip('Código que se repite continuamente');
    this.setHelpUrl('');
  },
};
