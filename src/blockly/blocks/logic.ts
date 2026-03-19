import * as Blockly from 'blockly';

// === Text Compare (HB compatibility) ===
Blockly.Blocks['text_compare'] = {
  init: function (this: Blockly.Block) {
    this.appendValueInput('TEXT1').setCheck('String');
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([
        ['=', 'equals'],
        ['\u2260', 'notEquals'],
      ]) as Blockly.Field, 'TYPE');
    this.appendValueInput('TEXT2').setCheck('String');
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setStyle('logic_blocks');
    this.setTooltip('Compara dos textos');
  },
};

Blockly.Blocks['logic_high_low'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([['ON', 'HIGH'], ['OFF', 'LOW']]) as Blockly.Field, 'STATE');
    this.setOutput(true, 'Boolean');
    this.setStyle('logic_blocks');
    this.setTooltip('Estado digital: ON (HIGH) u OFF (LOW)');
  },
};
