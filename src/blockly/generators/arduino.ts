import * as Blockly from 'blockly';
import type { BoardProfile } from '../../boards/types';
import { defaultBoard } from '../../boards';

// Current board profile for code generation
let currentBoard: BoardProfile = defaultBoard;

export function setGeneratorBoard(board: BoardProfile) {
  currentBoard = board;
}

export function isESP32(): boolean {
  return currentBoard.platform === 'esp32';
}

// Stores for includes and setup code that blocks can add to
let includes: Set<string>;
let setupCode: string[];
let globalVars: string[];
let declaredVars: Set<string>;

function resetGeneratorState() {
  includes = new Set();
  setupCode = [];
  globalVars = [];
  declaredVars = new Set();
}

export function addInclude(include: string) {
  includes.add(include);
}

export function addSetupCode(code: string) {
  if (!setupCode.includes(code)) {
    setupCode.push(code);
  }
}

export function addGlobalVar(declaration: string) {
  if (!globalVars.includes(declaration)) {
    globalVars.push(declaration);
  }
}

// Create Arduino generator
const gen = new Blockly.Generator('Arduino');

// Override scrub_ to follow nextConnection chains
// Without this, only the first block in each statement stack is processed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(gen as any).scrub_ = function (block: Blockly.Block, code: string, opt_thisOnly?: boolean): string {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  if (nextBlock && !opt_thisOnly) {
    return code + gen.blockToCode(nextBlock);
  }
  return code;
};

// Precedence
const ORDER_ATOMIC = 0;
const ORDER_UNARY_POSTFIX = 1;
const ORDER_UNARY_PREFIX = 2;
const ORDER_MULTIPLICATIVE = 3;
const ORDER_ADDITIVE = 4;
const ORDER_RELATIONAL = 6;
const ORDER_EQUALITY = 7;
const ORDER_LOGICAL_AND = 11;
const ORDER_LOGICAL_OR = 12;
const ORDER_ASSIGNMENT = 14;
const ORDER_NONE = 99;

gen.ORDER_ATOMIC = ORDER_ATOMIC;
gen.ORDER_UNARY_POSTFIX = ORDER_UNARY_POSTFIX;
gen.ORDER_UNARY_PREFIX = ORDER_UNARY_PREFIX;
gen.ORDER_MULTIPLICATIVE = ORDER_MULTIPLICATIVE;
gen.ORDER_ADDITIVE = ORDER_ADDITIVE;
gen.ORDER_RELATIONAL = ORDER_RELATIONAL;
gen.ORDER_EQUALITY = ORDER_EQUALITY;
gen.ORDER_LOGICAL_AND = ORDER_LOGICAL_AND;
gen.ORDER_LOGICAL_OR = ORDER_LOGICAL_OR;
gen.ORDER_ASSIGNMENT = ORDER_ASSIGNMENT;
gen.ORDER_NONE = ORDER_NONE;

// === Setup & Loop ===
gen.forBlock['arduino_setup'] = function (block) {
  const statements = gen.statementToCode(block, 'SETUP');
  if (statements.trim()) addSetupCode(statements);
  return '';
};

gen.forBlock['arduino_loop'] = function (block) {
  return gen.statementToCode(block, 'LOOP');
};

// === Logic ===
gen.forBlock['controls_if'] = function (block) {
  let code = '';
  let n = 0;
  while (block.getInput('IF' + n)) {
    const cond = gen.valueToCode(block, 'IF' + n, ORDER_NONE) || 'false';
    const branch = gen.statementToCode(block, 'DO' + n);
    code += (n === 0 ? 'if' : ' else if') + ' (' + cond + ') {\n' + branch + '}';
    n++;
  }
  if (block.getInput('ELSE')) {
    code += ' else {\n' + gen.statementToCode(block, 'ELSE') + '}';
  }
  return code + '\n';
};

gen.forBlock['logic_compare'] = function (block) {
  const ops: Record<string, string> = { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
  const op = ops[block.getFieldValue('OP')];
  const a = gen.valueToCode(block, 'A', ORDER_RELATIONAL) || '0';
  const b = gen.valueToCode(block, 'B', ORDER_RELATIONAL) || '0';
  return [a + ' ' + op + ' ' + b, ORDER_RELATIONAL];
};

gen.forBlock['logic_operation'] = function (block) {
  const op = block.getFieldValue('OP') === 'AND' ? '&&' : '||';
  const order = op === '&&' ? ORDER_LOGICAL_AND : ORDER_LOGICAL_OR;
  const a = gen.valueToCode(block, 'A', order) || 'false';
  const b = gen.valueToCode(block, 'B', order) || 'false';
  return [a + ' ' + op + ' ' + b, order];
};

gen.forBlock['logic_negate'] = function (block) {
  const a = gen.valueToCode(block, 'BOOL', ORDER_UNARY_PREFIX) || 'true';
  return ['!' + a, ORDER_UNARY_PREFIX];
};

gen.forBlock['logic_boolean'] = function (block) {
  return [block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false', ORDER_ATOMIC];
};

gen.forBlock['logic_high_low'] = function (block) {
  return [block.getFieldValue('STATE'), ORDER_ATOMIC];
};

// === Math ===
gen.forBlock['math_number'] = function (block) {
  return [String(block.getFieldValue('NUM')), ORDER_ATOMIC];
};

gen.forBlock['math_arithmetic'] = function (block) {
  const ops: Record<string, [string, number]> = {
    ADD: ['+', ORDER_ADDITIVE], MINUS: ['-', ORDER_ADDITIVE],
    MULTIPLY: ['*', ORDER_MULTIPLICATIVE], DIVIDE: ['/', ORDER_MULTIPLICATIVE],
    POWER: ['pow', ORDER_UNARY_PREFIX]
  };
  const t = ops[block.getFieldValue('OP')];
  const a = gen.valueToCode(block, 'A', t[1]) || '0';
  const b = gen.valueToCode(block, 'B', t[1]) || '0';
  if (block.getFieldValue('OP') === 'POWER') return ['pow(' + a + ', ' + b + ')', ORDER_UNARY_POSTFIX];
  return [a + ' ' + t[0] + ' ' + b, t[1]];
};

gen.forBlock['math_modulo'] = function (block) {
  const a = gen.valueToCode(block, 'DIVIDEND', ORDER_MULTIPLICATIVE) || '0';
  const b = gen.valueToCode(block, 'DIVISOR', ORDER_MULTIPLICATIVE) || '1';
  return [a + ' % ' + b, ORDER_MULTIPLICATIVE];
};

gen.forBlock['math_constrain'] = function (block) {
  const v = gen.valueToCode(block, 'VALUE', ORDER_NONE) || '0';
  const lo = gen.valueToCode(block, 'LOW', ORDER_NONE) || '0';
  const hi = gen.valueToCode(block, 'HIGH', ORDER_NONE) || '100';
  return ['constrain(' + v + ', ' + lo + ', ' + hi + ')', ORDER_UNARY_POSTFIX];
};

gen.forBlock['math_random_int'] = function (block) {
  const from = gen.valueToCode(block, 'FROM', ORDER_NONE) || '0';
  const to = gen.valueToCode(block, 'TO', ORDER_NONE) || '100';
  return ['random(' + from + ', ' + to + ' + 1)', ORDER_UNARY_POSTFIX];
};

gen.forBlock['math_map'] = function (block) {
  const v = gen.valueToCode(block, 'VALUE', ORDER_NONE) || '0';
  const fl = gen.valueToCode(block, 'FROM_LOW', ORDER_NONE) || '0';
  const fh = gen.valueToCode(block, 'FROM_HIGH', ORDER_NONE) || '1023';
  const tl = gen.valueToCode(block, 'TO_LOW', ORDER_NONE) || '0';
  const th = gen.valueToCode(block, 'TO_HIGH', ORDER_NONE) || '255';
  return ['map(' + v + ', ' + fl + ', ' + fh + ', ' + tl + ', ' + th + ')', ORDER_UNARY_POSTFIX];
};

gen.forBlock['math_single'] = function (block) {
  const op = block.getFieldValue('OP');
  const v = gen.valueToCode(block, 'NUM', ORDER_NONE) || '0';
  const funcs: Record<string, string> = {
    ROOT: 'sqrt', ABS: 'abs', NEG: '-', LN: 'log', LOG10: 'log10',
    EXP: 'exp', POW10: 'pow(10,'
  };
  if (op === 'NEG') return ['-' + v, ORDER_UNARY_PREFIX];
  if (op === 'POW10') return ['pow(10, ' + v + ')', ORDER_UNARY_POSTFIX];
  return [(funcs[op] || 'abs') + '(' + v + ')', ORDER_UNARY_POSTFIX];
};

gen.forBlock['math_round'] = function (block) {
  const op = block.getFieldValue('OP');
  const v = gen.valueToCode(block, 'NUM', ORDER_NONE) || '0';
  const funcs: Record<string, string> = { ROUND: 'round', ROUNDUP: 'ceil', ROUNDDOWN: 'floor' };
  return [(funcs[op] || 'round') + '(' + v + ')', ORDER_UNARY_POSTFIX];
};

gen.forBlock['math_number_property'] = function (block) {
  const v = gen.valueToCode(block, 'NUMBER_TO_CHECK', ORDER_NONE) || '0';
  const prop = block.getFieldValue('PROPERTY');
  if (prop === 'EVEN') return ['(' + v + ' % 2 == 0)', ORDER_EQUALITY];
  if (prop === 'ODD') return ['(' + v + ' % 2 != 0)', ORDER_EQUALITY];
  if (prop === 'POSITIVE') return ['(' + v + ' > 0)', ORDER_RELATIONAL];
  if (prop === 'NEGATIVE') return ['(' + v + ' < 0)', ORDER_RELATIONAL];
  return ['true', ORDER_ATOMIC];
};

// === Text ===
gen.forBlock['text'] = function (block) {
  const t = block.getFieldValue('TEXT').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return ['"' + t + '"', ORDER_ATOMIC];
};

gen.forBlock['text_join'] = function (block) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const n = (block as any).itemCount_ || 2;
  let code = 'String("")';
  for (let i = 0; i < n; i++) {
    code += ' + String(' + (gen.valueToCode(block, 'ADD' + i, ORDER_NONE) || '""') + ')';
  }
  return [code, ORDER_ADDITIVE];
};

gen.forBlock['text_length'] = function (block) {
  const t = gen.valueToCode(block, 'VALUE', ORDER_UNARY_POSTFIX) || '""';
  return ['String(' + t + ').length()', ORDER_UNARY_POSTFIX];
};

gen.forBlock['text_isEmpty'] = function (block) {
  const t = gen.valueToCode(block, 'VALUE', ORDER_UNARY_POSTFIX) || '""';
  return ['String(' + t + ').length() == 0', ORDER_EQUALITY];
};

// === Control ===
gen.forBlock['controls_repeat_ext'] = function (block) {
  const times = gen.valueToCode(block, 'TIMES', ORDER_NONE) || '10';
  return 'for (int i = 0; i < ' + times + '; i++) {\n' + gen.statementToCode(block, 'DO') + '}\n';
};

gen.forBlock['controls_whileUntil'] = function (block) {
  const until = block.getFieldValue('MODE') === 'UNTIL';
  const cond = gen.valueToCode(block, 'BOOL', ORDER_NONE) || 'false';
  const branch = gen.statementToCode(block, 'DO');
  return 'while (' + (until ? '!' : '') + cond + ') {\n' + branch + '}\n';
};

gen.forBlock['controls_for'] = function (block) {
  const v = getVarName(block, 'VAR', 'i');
  const from = gen.valueToCode(block, 'FROM', ORDER_NONE) || '1';
  const to = gen.valueToCode(block, 'TO', ORDER_NONE) || '10';
  const by = gen.valueToCode(block, 'BY', ORDER_NONE) || '1';
  return 'for (int ' + v + ' = ' + from + '; ' + v + ' <= ' + to + '; ' + v + ' += ' + by + ') {\n' + gen.statementToCode(block, 'DO') + '}\n';
};

gen.forBlock['controls_flow_statements'] = function (block) {
  return block.getFieldValue('FLOW') === 'BREAK' ? 'break;\n' : 'continue;\n';
};

// === Variables (built-in, kept for compatibility) ===
// Helper: getFieldValue('VAR') on FieldVariable returns the variable's internal ID,
// not its human-readable name. We resolve the name via the workspace variable map.
function getVarName(block: any, fieldName: string, fallback: string): string {
  const id = block.getFieldValue(fieldName);
  if (id && block.workspace) {
    const variable = Blockly.Variables.getVariable(block.workspace, id);
    if (variable) return variable.name;
  }
  return fallback;
}

gen.forBlock['variables_get'] = function (block) {
  return [getVarName(block, 'VAR', 'variable'), ORDER_ATOMIC];
};

gen.forBlock['variables_set'] = function (block) {
  const v = getVarName(block, 'VAR', 'variable');
  const val = gen.valueToCode(block, 'VALUE', ORDER_ASSIGNMENT) || '0';
  // Auto-declare variable as global if not already declared
  if (!declaredVars.has(v)) {
    declaredVars.add(v);
    const child = block.getInputTargetBlock('VALUE');
    let varType = 'int';
    if (child) {
      if (child.type === 'logic_boolean' || child.type === 'logic_negate') varType = 'bool';
      else if (child.type === 'text') varType = 'String';
    }
    addGlobalVar(varType + ' ' + v + ';');
  }
  return v + ' = ' + val + ';\n';
};

// === Typed Variables ===
const TYPE_DEFAULTS: Record<string, string> = {
  int: '0', float: '0.0', String: '""', bool: 'false', char: "'\\0'", byte: '0', long: '0'
};

gen.forBlock['typed_variable_declare'] = function (block) {
  const type = block.getFieldValue('TYPE') || 'int';
  const name = block.getFieldValue('VAR') || 'miVariable';
  const value = gen.valueToCode(block, 'VALUE', ORDER_ASSIGNMENT) || TYPE_DEFAULTS[type] || '0';
  return type + ' ' + name + ' = ' + value + ';\n';
};

gen.forBlock['typed_variable_set'] = function (block) {
  const name = block.getFieldValue('VAR') || 'miVariable';
  const value = gen.valueToCode(block, 'VALUE', ORDER_ASSIGNMENT) || '0';
  return name + ' = ' + value + ';\n';
};

gen.forBlock['typed_variable_get'] = function (block) {
  return [block.getFieldValue('VAR') || 'miVariable', ORDER_ATOMIC];
};

gen.forBlock['typed_variable_change'] = function (block) {
  const name = block.getFieldValue('VAR') || 'miVariable';
  const op = block.getFieldValue('OP') || '+=';
  const delta = gen.valueToCode(block, 'DELTA', ORDER_ASSIGNMENT) || '1';
  return name + ' ' + op + ' ' + delta + ';\n';
};

// === I/O ===
gen.forBlock['io_pinmode'] = function (block) {
  return 'pinMode(' + block.getFieldValue('PIN') + ', ' + block.getFieldValue('MODE') + ');\n';
};

gen.forBlock['io_digitalwrite'] = function (block) {
  const v = gen.valueToCode(block, 'VALUE', ORDER_NONE) || 'HIGH';
  return 'digitalWrite(' + block.getFieldValue('PIN') + ', ' + v + ');\n';
};

gen.forBlock['io_digitalread'] = function (block) {
  return ['digitalRead(' + block.getFieldValue('PIN') + ')', ORDER_UNARY_POSTFIX];
};

gen.forBlock['io_analogwrite'] = function (block) {
  const pin = block.getFieldValue('PIN');
  const v = gen.valueToCode(block, 'VALUE', ORDER_NONE) || '0';
  // ESP32 Arduino Core 3.x uses analogWrite directly (LEDC under the hood)
  // ESP32 Arduino Core 2.x would need ledcSetup/ledcAttachPin/ledcWrite
  // We target Core 3.x which supports analogWrite natively
  return 'analogWrite(' + pin + ', ' + v + ');\n';
};

gen.forBlock['io_analogread'] = function (block) {
  const pin = block.getFieldValue('PIN');
  const maxVal = isESP32() ? '4095' : '1023';
  // Add a comment about the resolution difference
  return ['analogRead(' + pin + ') /* 0-' + maxVal + ' */', ORDER_UNARY_POSTFIX];
};

// === Time ===
gen.forBlock['time_delay'] = function (block) {
  return 'delay(' + (gen.valueToCode(block, 'MS', ORDER_NONE) || '1000') + ');\n';
};

gen.forBlock['time_delaymicros'] = function (block) {
  return 'delayMicroseconds(' + (gen.valueToCode(block, 'US', ORDER_NONE) || '100') + ');\n';
};

gen.forBlock['time_millis'] = function () {
  return ['millis()', ORDER_UNARY_POSTFIX];
};

gen.forBlock['time_micros'] = function () {
  return ['micros()', ORDER_UNARY_POSTFIX];
};

// === Serial ===
gen.forBlock['serial_begin'] = function (block) {
  return 'Serial.begin(' + block.getFieldValue('BAUD') + ');\n';
};

gen.forBlock['serial_print'] = function (block) {
  return 'Serial.print(' + (gen.valueToCode(block, 'VALUE', ORDER_NONE) || '""') + ');\n';
};

gen.forBlock['serial_println'] = function (block) {
  return 'Serial.println(' + (gen.valueToCode(block, 'VALUE', ORDER_NONE) || '""') + ');\n';
};

gen.forBlock['serial_available'] = function () {
  return ['Serial.available()', ORDER_UNARY_POSTFIX];
};

gen.forBlock['serial_read'] = function () {
  return ['Serial.read()', ORDER_UNARY_POSTFIX];
};

gen.forBlock['serial_readstring'] = function () {
  return ['Serial.readString()', ORDER_UNARY_POSTFIX];
};

// === Sensors ===
gen.forBlock['sensor_button'] = function (block) {
  const pin = block.getFieldValue('PIN');
  const inv = block.getFieldValue('INVERTED') === 'TRUE';
  addSetupCode('  pinMode(' + pin + ', INPUT_PULLUP);\n');
  const read = 'digitalRead(' + pin + ')';
  return [inv ? read : '!' + read, ORDER_UNARY_PREFIX];
};

gen.forBlock['sensor_potentiometer'] = function (block) {
  const pin = block.getFieldValue('PIN');
  if (block.getFieldValue('MODE') === 'PERCENT') return ['map(analogRead(' + pin + '), 0, 1023, 0, 100)', ORDER_UNARY_POSTFIX];
  return ['analogRead(' + pin + ')', ORDER_UNARY_POSTFIX];
};

gen.forBlock['sensor_light'] = function (block) {
  const pin = block.getFieldValue('PIN');
  if (block.getFieldValue('MODE') === 'PERCENT') return ['map(analogRead(' + pin + '), 0, 1023, 0, 100)', ORDER_UNARY_POSTFIX];
  return ['analogRead(' + pin + ')', ORDER_UNARY_POSTFIX];
};

gen.forBlock['sensor_dht_read'] = function (block) {
  const type = block.getFieldValue('TYPE');
  const pin = block.getFieldValue('PIN');
  const val = block.getFieldValue('VALUE');
  addInclude('#include <DHT.h>');
  addGlobalVar('DHT dht(' + pin + ', ' + type + ');');
  addSetupCode('  dht.begin();\n');
  return [val === 'TEMP' ? 'dht.readTemperature()' : 'dht.readHumidity()', ORDER_UNARY_POSTFIX];
};

gen.forBlock['sensor_ultrasonic'] = function (block) {
  const trig = block.getFieldValue('TRIG');
  const echo = block.getFieldValue('ECHO');
  const unit = block.getFieldValue('UNIT');
  const fn = 'readUltrasonic_' + trig + '_' + echo;
  addSetupCode('  pinMode(' + trig + ', OUTPUT);\n');
  addSetupCode('  pinMode(' + echo + ', INPUT);\n');
  addGlobalVar(
    'long ' + fn + '() {\n' +
    '  digitalWrite(' + trig + ', LOW);\n  delayMicroseconds(2);\n' +
    '  digitalWrite(' + trig + ', HIGH);\n  delayMicroseconds(10);\n' +
    '  digitalWrite(' + trig + ', LOW);\n' +
    '  long duration = pulseIn(' + echo + ', HIGH);\n' +
    '  return duration * 0.034 / 2;\n}'
  );
  if (unit === 'INCH') return [fn + '() / 2.54', ORDER_MULTIPLICATIVE];
  return [fn + '()', ORDER_UNARY_POSTFIX];
};

gen.forBlock['sensor_pir'] = function (block) {
  const pin = block.getFieldValue('PIN');
  addSetupCode('  pinMode(' + pin + ', INPUT);\n');
  return ['digitalRead(' + pin + ')', ORDER_UNARY_POSTFIX];
};

gen.forBlock['sensor_soil_moisture'] = function (block) {
  const pin = block.getFieldValue('PIN');
  if (block.getFieldValue('MODE') === 'PERCENT') return ['map(analogRead(' + pin + '), 0, 1023, 100, 0)', ORDER_UNARY_POSTFIX];
  return ['analogRead(' + pin + ')', ORDER_UNARY_POSTFIX];
};

gen.forBlock['sensor_sound'] = function (block) {
  return ['analogRead(' + block.getFieldValue('PIN') + ')', ORDER_UNARY_POSTFIX];
};

gen.forBlock['sensor_tilt'] = function (block) {
  const pin = block.getFieldValue('PIN');
  addSetupCode('  pinMode(' + pin + ', INPUT_PULLUP);\n');
  const read = 'digitalRead(' + pin + ')';
  return [block.getFieldValue('INVERTED') === 'TRUE' ? read : '!' + read, ORDER_UNARY_PREFIX];
};

gen.forBlock['sensor_joystick'] = function (block) {
  const axis = block.getFieldValue('AXIS');
  const pin = block.getFieldValue('PIN');
  if (axis === 'BTN') {
    addSetupCode('  pinMode(' + pin + ', INPUT_PULLUP);\n');
    return ['!digitalRead(' + pin + ')', ORDER_UNARY_PREFIX];
  }
  return ['analogRead(' + pin + ')', ORDER_UNARY_POSTFIX];
};

// === Actuators ===
gen.forBlock['actuator_led'] = function (block) {
  const pin = block.getFieldValue('PIN');
  addSetupCode('  pinMode(' + pin + ', OUTPUT);\n');
  return 'digitalWrite(' + pin + ', ' + block.getFieldValue('STATE') + ');\n';
};

gen.forBlock['actuator_led_pwm'] = function (block) {
  const pin = block.getFieldValue('PIN');
  addSetupCode('  pinMode(' + pin + ', OUTPUT);\n');
  return 'analogWrite(' + pin + ', ' + (gen.valueToCode(block, 'VALUE', ORDER_NONE) || '128') + ');\n';
};

gen.forBlock['actuator_led_rgb'] = function (block) {
  const pR = block.getFieldValue('PIN_R'), pG = block.getFieldValue('PIN_G'), pB = block.getFieldValue('PIN_B');
  const r = gen.valueToCode(block, 'R', ORDER_NONE) || '0';
  const g = gen.valueToCode(block, 'G', ORDER_NONE) || '0';
  const b = gen.valueToCode(block, 'B', ORDER_NONE) || '0';
  addSetupCode('  pinMode(' + pR + ', OUTPUT);\n');
  addSetupCode('  pinMode(' + pG + ', OUTPUT);\n');
  addSetupCode('  pinMode(' + pB + ', OUTPUT);\n');
  return 'analogWrite(' + pR + ', ' + r + ');\nanalogWrite(' + pG + ', ' + g + ');\nanalogWrite(' + pB + ', ' + b + ');\n';
};

gen.forBlock['actuator_buzzer_tone'] = function (block) {
  const pin = block.getFieldValue('PIN');
  const freq = gen.valueToCode(block, 'FREQ', ORDER_NONE) || '440';
  const dur = gen.valueToCode(block, 'DURATION', ORDER_NONE) || '500';
  return 'tone(' + pin + ', ' + freq + ', ' + dur + ');\n';
};

gen.forBlock['actuator_buzzer_melody'] = function (block) {
  return 'playMelody(' + block.getFieldValue('PIN') + ', "' + block.getFieldValue('MELODY') + '");\n';
};

gen.forBlock['actuator_servo'] = function (block) {
  const pin = block.getFieldValue('PIN');
  const angle = gen.valueToCode(block, 'ANGLE', ORDER_NONE) || '90';
  const varName = 'servo_' + pin;
  addInclude('#include <Servo.h>');
  addGlobalVar('Servo ' + varName + ';');
  addSetupCode('  ' + varName + '.attach(' + pin + ');\n');
  return varName + '.write(' + angle + ');\n';
};

gen.forBlock['actuator_relay'] = function (block) {
  const pin = block.getFieldValue('PIN');
  addSetupCode('  pinMode(' + pin + ', OUTPUT);\n');
  return 'digitalWrite(' + pin + ', ' + block.getFieldValue('STATE') + ');\n';
};

// === Motor ===
gen.forBlock['motor_dc'] = function (block) {
  const in1 = block.getFieldValue('IN1'), in2 = block.getFieldValue('IN2'), en = block.getFieldValue('EN');
  const dir = block.getFieldValue('DIR');
  const speed = gen.valueToCode(block, 'SPEED', ORDER_NONE) || '255';
  addSetupCode('  pinMode(' + in1 + ', OUTPUT);\n');
  addSetupCode('  pinMode(' + in2 + ', OUTPUT);\n');
  addSetupCode('  pinMode(' + en + ', OUTPUT);\n');
  let code = dir === 'FORWARD'
    ? 'digitalWrite(' + in1 + ', HIGH);\ndigitalWrite(' + in2 + ', LOW);\n'
    : 'digitalWrite(' + in1 + ', LOW);\ndigitalWrite(' + in2 + ', HIGH);\n';
  code += 'analogWrite(' + en + ', ' + speed + ');\n';
  return code;
};

gen.forBlock['motor_dc_stop'] = function (block) {
  const in1 = block.getFieldValue('IN1'), in2 = block.getFieldValue('IN2'), en = block.getFieldValue('EN');
  return 'digitalWrite(' + in1 + ', LOW);\ndigitalWrite(' + in2 + ', LOW);\nanalogWrite(' + en + ', 0);\n';
};

gen.forBlock['motor_servo'] = function (block) {
  const pin = block.getFieldValue('PIN');
  const angle = gen.valueToCode(block, 'ANGLE', ORDER_NONE) || '90';
  const varName = 'servo_' + pin;
  addInclude('#include <Servo.h>');
  addGlobalVar('Servo ' + varName + ';');
  addSetupCode('  ' + varName + '.attach(' + pin + ');\n');
  return varName + '.write(' + angle + ');\n';
};

gen.forBlock['motor_stepper_init'] = function (block) {
  const stepsRev = gen.valueToCode(block, 'STEPS_REV', ORDER_NONE) || '2048';
  const p1 = block.getFieldValue('PIN1'), p2 = block.getFieldValue('PIN2');
  const p3 = block.getFieldValue('PIN3'), p4 = block.getFieldValue('PIN4');
  const speed = gen.valueToCode(block, 'SPEED', ORDER_NONE) || '10';
  addInclude('#include <Stepper.h>');
  addGlobalVar('Stepper stepper(' + stepsRev + ', ' + p1 + ', ' + p3 + ', ' + p2 + ', ' + p4 + ');');
  addSetupCode('  stepper.setSpeed(' + speed + ');\n');
  return '';
};

gen.forBlock['motor_stepper_setspeed'] = function (block) {
  const rpm = gen.valueToCode(block, 'RPM', ORDER_NONE) || '10';
  return 'stepper.setSpeed(' + rpm + ');\n';
};

gen.forBlock['motor_stepper_step'] = function (block) {
  const steps = gen.valueToCode(block, 'STEPS', ORDER_NONE) || '100';
  return 'stepper.step(' + steps + ');\n';
};

// === Display ===
gen.forBlock['lcd_init'] = function (block) {
  const [cols, rows] = block.getFieldValue('SIZE').split(',');
  const addr = block.getFieldValue('ADDR');
  addInclude('#include <Wire.h>');
  addInclude('#include <LiquidCrystal_I2C.h>');
  addGlobalVar('LiquidCrystal_I2C lcd(' + addr + ', ' + cols + ', ' + rows + ');');
  return 'lcd.init();\nlcd.backlight();\n';
};

gen.forBlock['lcd_print'] = function (block) {
  return 'lcd.print(' + (gen.valueToCode(block, 'TEXT', ORDER_NONE) || '""') + ');\n';
};

gen.forBlock['lcd_setcursor'] = function (block) {
  return 'lcd.setCursor(' + block.getFieldValue('COL') + ', ' + block.getFieldValue('ROW') + ');\n';
};

gen.forBlock['lcd_clear'] = function () {
  return 'lcd.clear();\n';
};

// === NeoPixel ===
gen.forBlock['neopixel_init'] = function (block) {
  const pin = block.getFieldValue('PIN'), num = block.getFieldValue('NUM');
  addInclude('#include <Adafruit_NeoPixel.h>');
  addGlobalVar('Adafruit_NeoPixel strip(' + num + ', ' + pin + ', NEO_GRB + NEO_KHZ800);');
  return 'strip.begin();\nstrip.show();\n';
};

gen.forBlock['neopixel_setcolor'] = function (block) {
  const idx = gen.valueToCode(block, 'INDEX', ORDER_NONE) || '0';
  const r = gen.valueToCode(block, 'R', ORDER_NONE) || '0';
  const g = gen.valueToCode(block, 'G', ORDER_NONE) || '0';
  const b = gen.valueToCode(block, 'B', ORDER_NONE) || '0';
  return 'strip.setPixelColor(' + idx + ', strip.Color(' + r + ', ' + g + ', ' + b + '));\n';
};

gen.forBlock['neopixel_show'] = function () {
  return 'strip.show();\n';
};

gen.forBlock['neopixel_clear'] = function () {
  return 'strip.clear();\nstrip.show();\n';
};

gen.forBlock['neopixel_setbrightness'] = function (block) {
  const brightness = gen.valueToCode(block, 'BRIGHTNESS', ORDER_NONE) || '50';
  return 'strip.setBrightness(' + brightness + ');\n';
};

gen.forBlock['neopixel_effect'] = function (block) {
  const effect = block.getFieldValue('EFFECT');
  // Helper function emitted once as global
  if (effect === 'RAINBOW' || effect === 'RAINBOW_CYCLE') {
    addGlobalVar(
      'uint32_t Wheel(byte WheelPos) {\n'
      + '  WheelPos = 255 - WheelPos;\n'
      + '  if (WheelPos < 85) return strip.Color(255 - WheelPos * 3, 0, WheelPos * 3);\n'
      + '  if (WheelPos < 170) { WheelPos -= 85; return strip.Color(0, WheelPos * 3, 255 - WheelPos * 3); }\n'
      + '  WheelPos -= 170; return strip.Color(WheelPos * 3, 255 - WheelPos * 3, 0);\n'
      + '}'
    );
  }
  if (effect === 'RAINBOW') {
    addGlobalVar(
      'void rainbow(uint8_t wait) {\n'
      + '  for (uint16_t j = 0; j < 256; j++) {\n'
      + '    for (uint16_t i = 0; i < strip.numPixels(); i++) {\n'
      + '      strip.setPixelColor(i, Wheel((i + j) & 255));\n'
      + '    }\n'
      + '    strip.show();\n'
      + '    delay(wait);\n'
      + '  }\n'
      + '}'
    );
    return 'rainbow(20);\n';
  } else if (effect === 'RAINBOW_CYCLE') {
    addGlobalVar(
      'void rainbowCycle(uint8_t wait) {\n'
      + '  for (uint16_t j = 0; j < 256 * 5; j++) {\n'
      + '    for (uint16_t i = 0; i < strip.numPixels(); i++) {\n'
      + '      strip.setPixelColor(i, Wheel(((i * 256 / strip.numPixels()) + j) & 255));\n'
      + '    }\n'
      + '    strip.show();\n'
      + '    delay(wait);\n'
      + '  }\n'
      + '}'
    );
    return 'rainbowCycle(20);\n';
  } else {
    // RANDOM
    return 'for (uint16_t i = 0; i < strip.numPixels(); i++) {\n'
      + '  strip.setPixelColor(i, strip.Color(random(256), random(256), random(256)));\n'
      + '}\nstrip.show();\n';
  }
};

gen.forBlock['neopixel_setcolor_picker'] = function (block) {
  const idx = gen.valueToCode(block, 'LEDNUMBER', ORDER_NONE) || '0';
  const colour = gen.valueToCode(block, 'COLOUR', ORDER_NONE) || "'#ff0000'";
  // Convert hex colour string to RGB at runtime
  return 'strip.setPixelColor(' + idx + ', strip.Color(\n'
    + '  (int)strtol(String(' + colour + ').substring(1, 3).c_str(), NULL, 16),\n'
    + '  (int)strtol(String(' + colour + ').substring(3, 5).c_str(), NULL, 16),\n'
    + '  (int)strtol(String(' + colour + ').substring(5, 7).c_str(), NULL, 16)));\n';
};

// === Lists ===
gen.forBlock['lists_create_empty'] = function () {
  return ['{}', ORDER_ATOMIC];
};

gen.forBlock['lists_length'] = function (block) {
  const l = gen.valueToCode(block, 'VALUE', ORDER_NONE) || '{}';
  return ['sizeof(' + l + ') / sizeof(' + l + '[0])', ORDER_MULTIPLICATIVE];
};

// Hello Blocks compatible typed lists
gen.forBlock['lists_create_with_number'] = function (block) {
  const varName = getVarName(block, 'VAR', 'arr');
  const items: string[] = [];
  for (let i = 0; block.getInput('ADD' + i); i++) {
    items.push(gen.valueToCode(block, 'ADD' + i, ORDER_NONE) || '0');
  }
  declaredVars.add(varName);
  addGlobalVar('int ' + varName + '[] = {' + items.join(', ') + '};');
  return '';
};

gen.forBlock['lists_getIndex_number'] = function (block) {
  const varName = getVarName(block, 'VAR', 'arr');
  const index = gen.valueToCode(block, 'AT', ORDER_NONE) || '0';
  return [varName + '[' + index + ']', ORDER_ATOMIC];
};

// === Procedures ===
gen.forBlock['procedures_defnoreturn'] = function (block) {
  const name = block.getFieldValue('NAME') || 'miFuncion';
  addGlobalVar('void ' + name + '() {\n' + gen.statementToCode(block, 'STACK') + '}');
  return '';
};

gen.forBlock['procedures_defreturn'] = function (block) {
  const name = block.getFieldValue('NAME') || 'miFuncion';
  const ret = gen.valueToCode(block, 'RETURN', ORDER_NONE) || '0';
  addGlobalVar('int ' + name + '() {\n' + gen.statementToCode(block, 'STACK') + '  return ' + ret + ';\n}');
  return '';
};

gen.forBlock['procedures_callnoreturn'] = function (block) {
  return (block.getFieldValue('NAME') || 'miFuncion') + '();\n';
};

gen.forBlock['procedures_callreturn'] = function (block) {
  return [(block.getFieldValue('NAME') || 'miFuncion') + '()', ORDER_UNARY_POSTFIX];
};

// === WiFi ===
gen.forBlock['wifi_connect'] = function (block) {
  const ssid = gen.valueToCode(block, 'SSID', ORDER_NONE) || '"MiRed"';
  const pass = gen.valueToCode(block, 'PASS', ORDER_NONE) || '"12345678"';
  addInclude('#include <WiFi.h>');
  return 'WiFi.begin(' + ssid + ', ' + pass + ');\nwhile (WiFi.status() != WL_CONNECTED) {\n  delay(500);\n  Serial.print(".");\n}\nSerial.println("");\nSerial.println("WiFi conectado");\nSerial.println(WiFi.localIP());\n';
};

gen.forBlock['wifi_connected'] = function () {
  addInclude('#include <WiFi.h>');
  return ['WiFi.status() == WL_CONNECTED', ORDER_EQUALITY];
};

gen.forBlock['wifi_localip'] = function () {
  addInclude('#include <WiFi.h>');
  return ['WiFi.localIP().toString()', ORDER_UNARY_POSTFIX];
};

gen.forBlock['wifi_rssi'] = function () {
  addInclude('#include <WiFi.h>');
  return ['WiFi.RSSI()', ORDER_UNARY_POSTFIX];
};

gen.forBlock['wifi_disconnect'] = function () {
  addInclude('#include <WiFi.h>');
  return 'WiFi.disconnect();\n';
};

gen.forBlock['wifi_http_get'] = function (block) {
  const url = gen.valueToCode(block, 'URL', ORDER_NONE) || '"http://example.com"';
  addInclude('#include <WiFi.h>');
  addInclude('#include <HTTPClient.h>');
  addGlobalVar(
    'String httpGET(String url) {\n' +
    '  HTTPClient http;\n' +
    '  http.begin(url);\n' +
    '  int httpCode = http.GET();\n' +
    '  String payload = "";\n' +
    '  if (httpCode > 0) { payload = http.getString(); }\n' +
    '  http.end();\n' +
    '  return payload;\n' +
    '}'
  );
  return ['httpGET(' + url + ')', ORDER_UNARY_POSTFIX];
};

gen.forBlock['wifi_http_post'] = function (block) {
  const url = gen.valueToCode(block, 'URL', ORDER_NONE) || '"http://example.com"';
  const body = gen.valueToCode(block, 'BODY', ORDER_NONE) || '""';
  addInclude('#include <WiFi.h>');
  addInclude('#include <HTTPClient.h>');
  addGlobalVar(
    'String httpPOST(String url, String body) {\n' +
    '  HTTPClient http;\n' +
    '  http.begin(url);\n' +
    '  http.addHeader("Content-Type", "application/json");\n' +
    '  int httpCode = http.POST(body);\n' +
    '  String payload = "";\n' +
    '  if (httpCode > 0) { payload = http.getString(); }\n' +
    '  http.end();\n' +
    '  return payload;\n' +
    '}'
  );
  return ['httpPOST(' + url + ', ' + body + ')', ORDER_UNARY_POSTFIX];
};

// === Bluetooth ===
gen.forBlock['bt_begin'] = function (block) {
  const name = gen.valueToCode(block, 'NAME', ORDER_NONE) || '"ESP32"';
  addInclude('#include "BluetoothSerial.h"');
  addGlobalVar('BluetoothSerial SerialBT;');
  return 'SerialBT.begin(' + name + ');\n';
};

gen.forBlock['bt_available'] = function () {
  return ['SerialBT.available()', ORDER_UNARY_POSTFIX];
};

gen.forBlock['bt_read'] = function () {
  return ['SerialBT.read()', ORDER_UNARY_POSTFIX];
};

gen.forBlock['bt_readstring'] = function () {
  return ['SerialBT.readString()', ORDER_UNARY_POSTFIX];
};

gen.forBlock['bt_print'] = function (block) {
  const v = gen.valueToCode(block, 'VALUE', ORDER_NONE) || '""';
  return 'SerialBT.print(' + v + ');\n';
};

gen.forBlock['bt_println'] = function (block) {
  const v = gen.valueToCode(block, 'VALUE', ORDER_NONE) || '""';
  return 'SerialBT.println(' + v + ');\n';
};

gen.forBlock['bt_connected'] = function () {
  return ['SerialBT.connected()', ORDER_UNARY_POSTFIX];
};

// === Main generation function ===
export function generateArduinoCode(workspace: Blockly.Workspace, board?: BoardProfile): string {
  if (board) setGeneratorBoard(board);
  resetGeneratorState();

  // Declare all workspace variables as globals (default to int)
  const allVars = Blockly.Variables.allUsedVarModels(workspace);
  for (const v of allVars) {
    const name = v.name;
    // Infer type from initial value: scan all variables_set blocks
    let varType = 'int';
    for (const b of workspace.getAllBlocks(false)) {
      if (b.type === 'variables_set') {
        const id = b.getFieldValue('VAR');
        const resolved = Blockly.Variables.getVariable(workspace, id);
        if (resolved && resolved.name === name) {
          const child = b.getInputTargetBlock('VALUE');
          if (child) {
            if (child.type === 'logic_boolean' || child.type === 'logic_negate') varType = 'bool';
            else if (child.type === 'math_number') varType = 'int';
            else if (child.type === 'text') varType = 'String';
            else if (child.type === 'math_arithmetic' || child.type === 'math_number_property') varType = 'int';
          }
          break;
        }
      }
    }
    declaredVars.add(name);
    addGlobalVar(varType + ' ' + name + ';');
  }

  const allBlocks = workspace.getTopBlocks(true);
  let setupStatements = '';
  let loopStatements = '';

  for (const block of allBlocks) {
    if (block.type === 'arduino_setup') {
      setupStatements = gen.statementToCode(block, 'SETUP');
    } else if (block.type === 'arduino_loop') {
      loopStatements = gen.statementToCode(block, 'LOOP');
    } else {
      gen.blockToCode(block);
    }
  }

  let code = '';

  if (includes.size > 0) code += Array.from(includes).join('\n') + '\n\n';
  if (globalVars.length > 0) code += globalVars.join('\n') + '\n\n';

  code += 'void setup() {\n';
  for (const sc of setupCode) code += sc;
  if (setupStatements.trim()) code += setupStatements;
  code += '}\n\n';

  code += 'void loop() {\n';
  if (loopStatements.trim()) code += loopStatements;
  code += '}\n';

  return code;
}
