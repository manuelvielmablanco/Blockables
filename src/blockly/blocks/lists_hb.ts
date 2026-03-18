/**
 * Hello Blocks compatible list blocks.
 * These handle typed list operations from .hb imports:
 * - lists_create_with_number: create a named number array with N items
 * - lists_getIndex_number: get element from a named number array by index
 */
import * as Blockly from 'blockly';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
Blockly.Blocks['lists_create_with_number'] = {
  itemCount_: 3,

  init: function (this: Blockly.Block & { itemCount_: number; updateShape_: () => void }) {
    this.appendDummyInput('HEADER')
      .appendField('crear lista')
      .appendField(new Blockly.FieldVariable('miLista') as Blockly.Field, 'VAR');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('list_blocks');
    this.updateShape_();
  },

  // XML mutation serialization (needed for .hb import)
  mutationToDom: function (this: { itemCount_: number }): Element {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('items', String(this.itemCount_));
    return container;
  },

  domToMutation: function (this: Blockly.Block & { itemCount_: number; updateShape_: () => void }, xmlElement: Element): void {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items') || '3', 10);
    this.updateShape_();
  },

  // JSON mutation serialization
  saveExtraState: function (this: { itemCount_: number }) {
    return { itemCount: this.itemCount_ };
  },

  loadExtraState: function (this: Blockly.Block & { itemCount_: number; updateShape_: () => void }, state: { itemCount: number }) {
    this.itemCount_ = state.itemCount || 3;
    this.updateShape_();
  },

  updateShape_: function (this: Blockly.Block & { itemCount_: number }): void {
    // Remove old ADD inputs
    let i = 0;
    while (this.getInput('ADD' + i)) {
      this.removeInput('ADD' + i);
      i++;
    }
    // Add new inputs
    for (let j = 0; j < this.itemCount_; j++) {
      this.appendValueInput('ADD' + j).setCheck('Number');
    }
  },
};

Blockly.Blocks['lists_getIndex_number'] = {
  init: function (this: Blockly.Block) {
    this.appendDummyInput()
      .appendField(new Blockly.FieldVariable('miLista') as Blockly.Field, 'VAR');
    this.appendValueInput('AT')
      .setCheck('Number')
      .appendField('[');
    this.appendDummyInput()
      .appendField(']');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setStyle('list_blocks');
    this.setTooltip('Obtiene un elemento de la lista por índice');
  },
};
