/**
 * Kits Ingeniables — programa original adaptado a Ingeniables Blocks.
 *
 * Estos workspaces son versiones equivalentes (no idénticas) de los programas
 * que originalmente venían empaquetados en formato Hello Blocks (.hb). Se
 * mantiene la arquitectura de pines y la funcionalidad esencial de cada kit
 * para que el alumno pueda recuperar un punto de partida funcional y luego
 * personalizarlo.
 *
 * Para kits exportados directamente desde Ingeniables Blocks (.ib) basta con
 * importar el JSON de su workspace tal cual; ver elastorWorkspace abajo.
 */

import elastorWorkspace from './kits-workspaces/elastor.json';

export interface KitProject {
  id: string;
  name: string;
  description: string;
  /** Ruta relativa a public/, ej. 'kits/franky.png'. Si falta, se muestra el emoji. */
  image: string;
  /** Emoji de respaldo si la imagen no carga. */
  emoji: string;
  /** Lista breve de funcionalidades (máx 4). */
  features: string[];
  boardId: string;
  workspace: object;
}

// ── Helpers para construir cadenas de bloques de forma legible ─────────
type B = Record<string, unknown>;
const stmt = (...blocks: B[]): B | null => {
  if (blocks.length === 0) return null;
  let head: B = blocks[0];
  let cur: B = head;
  for (let i = 1; i < blocks.length; i++) {
    cur.next = { block: blocks[i] };
    cur = blocks[i];
  }
  return head;
};
const num = (n: number): B => ({ type: 'math_number', fields: { NUM: n } });
const txt = (s: string): B => ({ type: 'text', fields: { TEXT: s } });
const bool = (v: boolean): B => ({ type: 'logic_boolean', fields: { BOOL: v ? 'TRUE' : 'FALSE' } });
const call = (name: string): B => ({
  type: 'procedures_callnoreturn',
  extraState: { name },
});
const proc = (name: string, body: B | null, x = 30, y = 30): B => {
  const def: B = { type: 'procedures_defnoreturn', x, y, fields: { NAME: name } };
  if (body) def.inputs = { STACK: { block: body } };
  return def;
};

// ────────────────────────────────────────────────────────────────────────
//  KIT 1 — Ingeniables Franky
//  Robot car con control Bluetooth + modo autónomo + NeoPixel cíclico.
//  Driver: TB6612FNG/DRV8833 (2 pines PWM por motor, sin EN).
//  Pines: motor1=6,9 · motor2=10,11 · NeoPixel=A4 · BT(RX,TX)=4,2 · US(trig,echo)=5,3
// ────────────────────────────────────────────────────────────────────────
const frankyWorkspace = {
  blocks: {
    languageVersion: 0,
    blocks: [
      // SETUP
      {
        type: 'arduino_setup',
        x: 30,
        y: 30,
        deletable: false,
        inputs: {
          SETUP: {
            block: stmt(
              { type: 'motor_dc', fields: { ID: '1', PIN1: '6', PIN2: '9' } },
              { type: 'motor_dc', fields: { ID: '2', PIN1: '10', PIN2: '11' } },
              { type: 'neopixel_init', fields: { PIN: 'A4', NUM: 3 } },
              { type: 'neopixel_clear' },
              { type: 'neopixel_show' },
              { type: 'bt_begin', fields: { RX: '4', TX: '2', BAUD: '9600' } },
              { type: 'serial_begin', fields: { BAUD: '9600' } },
            )!,
          },
        },
      },

      // PROCEDURES
      proc('adelante', stmt(
        { type: 'motor_dc_run', fields: { ID: '1', DIR: 'FORWARD' }, inputs: { SPEED: { shadow: num(255) } } },
        { type: 'motor_dc_run', fields: { ID: '2', DIR: 'FORWARD' }, inputs: { SPEED: { shadow: num(255) } } },
      ), 820,30),

      proc('atras', stmt(
        { type: 'motor_dc_run', fields: { ID: '1', DIR: 'BACKWARD' }, inputs: { SPEED: { shadow: num(255) } } },
        { type: 'motor_dc_run', fields: { ID: '2', DIR: 'BACKWARD' }, inputs: { SPEED: { shadow: num(255) } } },
      ), 820,260),

      proc('izquierda', stmt(
        { type: 'motor_dc_stop', fields: { ID: '1' } },
        { type: 'motor_dc_run', fields: { ID: '2', DIR: 'FORWARD' }, inputs: { SPEED: { shadow: num(255) } } },
      ), 820,490),

      proc('derecha', stmt(
        { type: 'motor_dc_run', fields: { ID: '1', DIR: 'FORWARD' }, inputs: { SPEED: { shadow: num(255) } } },
        { type: 'motor_dc_stop', fields: { ID: '2' } },
      ), 820,720),

      proc('parar', stmt(
        { type: 'motor_dc_stop', fields: { ID: '1' } },
        { type: 'motor_dc_stop', fields: { ID: '2' } },
      ), 820,950),

      // Modo autónomo: si hay obstáculo a < 20cm, retrocede y gira.
      proc('modoAuto', {
        type: 'controls_if',
        extraState: { hasElse: true },
        inputs: {
          IF0: {
            block: {
              type: 'logic_compare',
              fields: { OP: 'LT' },
              inputs: {
                A: {
                  block: { type: 'sensor_ultrasonic', fields: { TRIG: '5', ECHO: '3', UNIT: 'CM' } },
                },
                B: { block: num(20) },
              },
            },
          },
          DO0: {
            block: stmt(
              call('parar'),
              { type: 'time_delay', inputs: { MS: { shadow: num(400) } } },
              call('atras'),
              { type: 'time_delay', inputs: { MS: { shadow: num(500) } } },
              call('izquierda'),
              { type: 'time_delay', inputs: { MS: { shadow: num(500) } } },
            )!,
          },
          ELSE: {
            block: call('adelante'),
          },
        },
      }, 1380, 30),

      // LOOP
      {
        type: 'arduino_loop',
        x: 30,
        y: 480,
        deletable: false,
        inputs: {
          LOOP: {
            block: {
              type: 'controls_if',
              inputs: {
                IF0: { block: { type: 'bt_available' } },
                DO0: {
                  block: ifElseChain([
                    [eqString({ type: 'bt_receive_text', fields: { UNTIL_NL: 'TRUE' } }, 'F'), call('adelante')],
                    [eqString({ type: 'bt_receive_text', fields: { UNTIL_NL: 'TRUE' } }, 'G'), call('atras')],
                    [eqString({ type: 'bt_receive_text', fields: { UNTIL_NL: 'TRUE' } }, 'L'), call('izquierda')],
                    [eqString({ type: 'bt_receive_text', fields: { UNTIL_NL: 'TRUE' } }, 'R'), call('derecha')],
                    [eqString({ type: 'bt_receive_text', fields: { UNTIL_NL: 'TRUE' } }, 'S'), call('parar')],
                    [eqString({ type: 'bt_receive_text', fields: { UNTIL_NL: 'TRUE' } }, 'D'), call('modoAuto')],
                  ]),
                },
              },
            },
          },
        },
      },
    ],
  },
};

// Cadena if / else if equivalente a un switch sobre String comparisons.
function eqString(left: B, right: string): B {
  return {
    type: 'logic_compare',
    fields: { OP: 'EQ' },
    inputs: {
      A: { block: left },
      B: { block: txt(right) },
    },
  };
}
function ifElseChain(branches: Array<[B, B]>): B {
  if (branches.length === 0) return { type: 'controls_if' };
  const elseifCount = branches.length - 1;
  const block: B = {
    type: 'controls_if',
    extraState: elseifCount > 0 ? { elseIfCount: elseifCount } : undefined,
    inputs: {},
  };
  const inputs = block.inputs as Record<string, { block: B }>;
  branches.forEach(([cond, body], i) => {
    inputs[`IF${i}`] = { block: cond };
    inputs[`DO${i}`] = { block: body };
  });
  return block;
}

// ────────────────────────────────────────────────────────────────────────
//  KIT 2 — Ingeniables Tellurion
//  Sistema solar mecánico: 3 botones táctiles controlan rotación del
//  stepper y un anillo NeoPixel que ilumina la esfera del Sol.
//  Pines: stepper IN1-4 = 5,4,3,2 (28BYJ-48, 2048 pasos/vuelta) ·
//  NeoPixel = A3 (7 LEDs) · botones táctiles = 7,8,9
// ────────────────────────────────────────────────────────────────────────
const tellurionWorkspace = {
  // 'i' es la variable Blockly estándar del controls_for.
  // colorIndex es una variable tipada Arduino (typed_variable_declare).
  variables: [
    { name: 'i', id: 'i_id', type: '' },
  ],
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: 'arduino_setup',
        x: 30,
        y: 30,
        deletable: false,
        inputs: {
          SETUP: {
            block: stmt(
              {
                type: 'motor_stepper_init',
                fields: { PIN1: '5', PIN2: '4', PIN3: '3', PIN4: '2' },
                inputs: {
                  STEPS_REV: { shadow: num(2048) },
                  SPEED: { shadow: num(10) },
                },
              },
              { type: 'neopixel_init', fields: { PIN: 'A3', NUM: 7 } },
              { type: 'serial_begin', fields: { BAUD: '9600' } },
              { type: 'io_pinmode', fields: { PIN: '7', MODE: 'INPUT' } },
              { type: 'io_pinmode', fields: { PIN: '8', MODE: 'INPUT' } },
              { type: 'io_pinmode', fields: { PIN: '9', MODE: 'INPUT' } },
              {
                type: 'typed_variable_declare',
                fields: { TYPE: 'int', VAR: 'colorIndex' },
                inputs: { VALUE: { shadow: num(0) } },
              },
              { type: 'neopixel_clear' },
              { type: 'neopixel_show' },
            )!,
          },
        },
      },

      // PROCEDURE pintarSol — pinta los 7 NeoPixel según colorIndex (rojo/verde/azul/blanco)
      proc('pintarSol', stmt(
        {
          type: 'controls_for',
          fields: { VAR: 'i' },
          inputs: {
            FROM: { shadow: num(0) },
            TO: { shadow: num(6) },
            BY: { shadow: num(1) },
            DO: {
              block: ifElseChain([
                [
                  {
                    type: 'logic_compare',
                    fields: { OP: 'EQ' },
                    inputs: {
                      A: { block: { type: 'typed_variable_get', fields: { VAR: 'colorIndex' } } },
                      B: { block: num(0) },
                    },
                  },
                  {
                    type: 'neopixel_setcolor',
                    inputs: {
                      INDEX: { block: { type: 'variables_get', fields: { VAR: 'i' } } },
                      R: { block: num(255) },
                      G: { block: num(60) },
                      B: { block: num(0) },
                    },
                  },
                ],
                [
                  {
                    type: 'logic_compare',
                    fields: { OP: 'EQ' },
                    inputs: {
                      A: { block: { type: 'typed_variable_get', fields: { VAR: 'colorIndex' } } },
                      B: { block: num(1) },
                    },
                  },
                  {
                    type: 'neopixel_setcolor',
                    inputs: {
                      INDEX: { block: { type: 'variables_get', fields: { VAR: 'i' } } },
                      R: { block: num(0) },
                      G: { block: num(220) },
                      B: { block: num(120) },
                    },
                  },
                ],
                [
                  {
                    type: 'logic_compare',
                    fields: { OP: 'EQ' },
                    inputs: {
                      A: { block: { type: 'typed_variable_get', fields: { VAR: 'colorIndex' } } },
                      B: { block: num(2) },
                    },
                  },
                  {
                    type: 'neopixel_setcolor',
                    inputs: {
                      INDEX: { block: { type: 'variables_get', fields: { VAR: 'i' } } },
                      R: { block: num(60) },
                      G: { block: num(120) },
                      B: { block: num(255) },
                    },
                  },
                ],
                [
                  bool(true),
                  {
                    type: 'neopixel_setcolor',
                    inputs: {
                      INDEX: { block: { type: 'variables_get', fields: { VAR: 'i' } } },
                      R: { block: num(255) },
                      G: { block: num(255) },
                      B: { block: num(180) },
                    },
                  },
                ],
              ]),
            },
          },
        },
        { type: 'neopixel_show' },
      ), 700, 30),

      // LOOP
      {
        type: 'arduino_loop',
        x: 30,
        y: 720,
        deletable: false,
        inputs: {
          LOOP: {
            block: stmt(
              // Botón táctil 1 (pin 7): cicla color del Sol (0→1→2→3→0…)
              {
                type: 'controls_if',
                inputs: {
                  IF0: { block: { type: 'io_digitalread', fields: { PIN: '7' } } },
                  DO0: {
                    block: stmt(
                      {
                        type: 'typed_variable_set',
                        fields: { VAR: 'colorIndex' },
                        inputs: {
                          VALUE: {
                            block: {
                              type: 'math_modulo',
                              inputs: {
                                DIVIDEND: {
                                  block: {
                                    type: 'math_arithmetic',
                                    fields: { OP: 'ADD' },
                                    inputs: {
                                      A: { block: { type: 'typed_variable_get', fields: { VAR: 'colorIndex' } } },
                                      B: { block: num(1) },
                                    },
                                  },
                                },
                                DIVISOR: { block: num(4) },
                              },
                            },
                          },
                        },
                      },
                      call('pintarSol'),
                      { type: 'time_delay', inputs: { MS: { shadow: num(300) } } },
                    )!,
                  },
                },
              },
              // Botón táctil 2 (pin 8): rotar stepper en sentido horario
              {
                type: 'controls_if',
                inputs: {
                  IF0: { block: { type: 'io_digitalread', fields: { PIN: '8' } } },
                  DO0: {
                    block: { type: 'motor_stepper_step', inputs: { STEPS: { shadow: num(20) } } },
                  },
                },
              },
              // Botón táctil 3 (pin 9): rotar stepper en sentido antihorario
              {
                type: 'controls_if',
                inputs: {
                  IF0: { block: { type: 'io_digitalread', fields: { PIN: '9' } } },
                  DO0: {
                    block: { type: 'motor_stepper_step', inputs: { STEPS: { shadow: num(-20) } } },
                  },
                },
              },
            )!,
          },
        },
      },
    ],
  },
};

// ────────────────────────────────────────────────────────────────────────
//  Catálogo
// ────────────────────────────────────────────────────────────────────────
export const kits: KitProject[] = [
  {
    id: 'tellurion',
    name: 'Ingeniables Tellurion',
    description:
      'Sistema solar mecánico motorizado. Tres botones táctiles controlan la rotación del planeta y la iluminación del Sol con NeoPixels.',
    image: 'kits/tellurion.png',
    emoji: '🌍',
    features: [
      'Motor paso a paso 28BYJ-48',
      '3 sensores táctiles capacitivos',
      'Anillo NeoPixel de 7 LEDs',
      'Ciclo de 4 colores para el Sol',
    ],
    boardId: 'arduino-nano',
    workspace: tellurionWorkspace,
  },
  {
    id: 'franky',
    name: 'Ingeniables Franky',
    description:
      'Robot móvil con control Bluetooth y modo autónomo. Esquiva obstáculos con sensor ultrasónico y reacciona con NeoPixels.',
    image: 'kits/franky.png',
    emoji: '🤖',
    features: [
      '2 motores DC con driver puente H',
      'Control Bluetooth (HC-05/06)',
      'Modo autónomo con ultrasonidos',
      'Anillo NeoPixel de 3 LEDs',
    ],
    boardId: 'arduino-nano',
    workspace: frankyWorkspace,
  },
  {
    id: 'elastor',
    name: 'Ingeniables Elastor',
    description:
      'Lanzador / brazo articulado controlado por Bluetooth. Dos servos orientan la dirección y altura, y un motor DC dispara el mecanismo elástico.',
    image: 'kits/elastor.png',
    emoji: '🎯',
    features: [
      '2 servomotores (orientación + altura)',
      'Motor DC con driver puente H',
      'Control Bluetooth (HC-05/06)',
      'Procedimientos: Subir, Bajar, Rotar…',
    ],
    boardId: 'arduino-nano',
    workspace: elastorWorkspace,
  },
];
