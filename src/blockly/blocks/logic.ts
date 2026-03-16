import * as Blockly from 'blockly';

Blockly.Blocks['logic_high_low'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([['ON', 'HIGH'], ['OFF', 'LOW']]) as Blockly.Field, 'STATE');
    this.setOutput(true, 'Boolean');
    this.setStyle('logic_blocks');
    this.setTooltip('Estado digital: ON (HIGH) u OFF (LOW)');
  },
};
