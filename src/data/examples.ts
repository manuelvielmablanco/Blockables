/**
 * Example projects for Ingeniables Blocks.
 * Each example is a minimal Blockly workspace state JSON.
 */

export interface ExampleProject {
  id: string;
  name: string;
  description: string;
  boardId: string;
  icon: string;
  difficulty: 'principiante' | 'intermedio' | 'avanzado';
  workspace: object; // Blockly serialization state
}

export const examples: ExampleProject[] = [
  {
    id: 'blink',
    name: 'LED parpadeante',
    description: 'Enciende y apaga un LED cada segundo. El proyecto más clásico de Arduino.',
    boardId: 'arduino-nano',
    icon: '💡',
    difficulty: 'principiante',
    workspace: {
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
                block: {
                  type: 'io_pinmode',
                  fields: { PIN: '13', MODE: 'OUTPUT' },
                },
              },
            },
          },
          {
            type: 'arduino_loop',
            x: 30,
            y: 200,
            deletable: false,
            inputs: {
              LOOP: {
                block: {
                  type: 'io_digitalwrite',
                  fields: { PIN: '13', STATE: 'HIGH' },
                  next: {
                    block: {
                      type: 'time_delay',
                      fields: { TIME: 1000 },
                      next: {
                        block: {
                          type: 'io_digitalwrite',
                          fields: { PIN: '13', STATE: 'LOW' },
                          next: {
                            block: {
                              type: 'time_delay',
                              fields: { TIME: 1000 },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
  {
    id: 'button-led',
    name: 'Botón y LED',
    description: 'Controla un LED con un botón pulsador. Aprende entradas y salidas digitales.',
    boardId: 'arduino-nano',
    icon: '🔘',
    difficulty: 'principiante',
    workspace: {
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
                block: {
                  type: 'io_pinmode',
                  fields: { PIN: '13', MODE: 'OUTPUT' },
                  next: {
                    block: {
                      type: 'io_pinmode',
                      fields: { PIN: '2', MODE: 'INPUT_PULLUP' },
                    },
                  },
                },
              },
            },
          },
          {
            type: 'arduino_loop',
            x: 30,
            y: 250,
            deletable: false,
            inputs: {
              LOOP: {
                block: {
                  type: 'controls_if',
                  inputs: {
                    IF0: {
                      block: {
                        type: 'logic_compare',
                        fields: { OP: 'EQ' },
                        inputs: {
                          A: { block: { type: 'io_digitalread', fields: { PIN: '2' } } },
                          B: { block: { type: 'logic_high_low', fields: { STATE: 'LOW' } } },
                        },
                      },
                    },
                    DO0: {
                      block: {
                        type: 'io_digitalwrite',
                        fields: { PIN: '13', STATE: 'HIGH' },
                      },
                    },
                    ELSE: {
                      block: {
                        type: 'io_digitalwrite',
                        fields: { PIN: '13', STATE: 'LOW' },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
  {
    id: 'temperature',
    name: 'Sensor de temperatura',
    description: 'Lee la temperatura con un sensor DHT11 y la muestra por el puerto serie.',
    boardId: 'arduino-nano',
    icon: '🌡️',
    difficulty: 'intermedio',
    workspace: {
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
                block: {
                  type: 'serial_begin',
                  fields: { BAUD: '9600' },
                },
              },
            },
          },
          {
            type: 'arduino_loop',
            x: 30,
            y: 200,
            deletable: false,
            inputs: {
              LOOP: {
                block: {
                  type: 'serial_println',
                  inputs: {
                    VALUE: {
                      block: {
                        type: 'sensor_dht_read',
                        fields: { PIN: '2', TYPE: 'DHT11', VALUE: 'temperature' },
                      },
                    },
                  },
                  next: {
                    block: {
                      type: 'time_delay',
                      fields: { TIME: 2000 },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
  {
    id: 'servo-pot',
    name: 'Servo con potenciómetro',
    description: 'Controla la posición de un servo motor con un potenciómetro.',
    boardId: 'arduino-nano',
    icon: '🎛️',
    difficulty: 'intermedio',
    workspace: {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'arduino_setup',
            x: 30,
            y: 30,
            deletable: false,
          },
          {
            type: 'arduino_loop',
            x: 30,
            y: 150,
            deletable: false,
            inputs: {
              LOOP: {
                block: {
                  type: 'actuator_servo',
                  fields: { PIN: '9' },
                  inputs: {
                    ANGLE: {
                      block: {
                        type: 'math_map',
                        inputs: {
                          VALUE: { block: { type: 'io_analogread', fields: { PIN: 'A0' } } },
                          FROM_LOW: { block: { type: 'math_number', fields: { NUM: 0 } } },
                          FROM_HIGH: { block: { type: 'math_number', fields: { NUM: 1023 } } },
                          TO_LOW: { block: { type: 'math_number', fields: { NUM: 0 } } },
                          TO_HIGH: { block: { type: 'math_number', fields: { NUM: 180 } } },
                        },
                      },
                    },
                  },
                  next: {
                    block: {
                      type: 'time_delay',
                      fields: { TIME: 15 },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
  {
    id: 'neopixel-rainbow',
    name: 'NeoPixel arcoíris',
    description: 'Crea un efecto arcoíris con una tira de LEDs NeoPixel.',
    boardId: 'arduino-nano',
    icon: '🌈',
    difficulty: 'avanzado',
    workspace: {
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
                block: {
                  type: 'neopixel_init',
                  fields: { PIN: '6', NUM: '8' },
                },
              },
            },
          },
          {
            type: 'arduino_loop',
            x: 30,
            y: 200,
            deletable: false,
            inputs: {
              LOOP: {
                block: {
                  type: 'controls_for',
                  fields: { VAR: 'i' },
                  inputs: {
                    FROM: { block: { type: 'math_number', fields: { NUM: 0 } } },
                    TO: { block: { type: 'math_number', fields: { NUM: 7 } } },
                    BY: { block: { type: 'math_number', fields: { NUM: 1 } } },
                    DO: {
                      block: {
                        type: 'neopixel_setcolor',
                        fields: { COLOR: '#ff0000' },
                        inputs: {
                          INDEX: { block: { type: 'variables_get', fields: { VAR: 'i' } } },
                        },
                      },
                    },
                  },
                  next: {
                    block: {
                      type: 'neopixel_show',
                      next: {
                        block: {
                          type: 'time_delay',
                          fields: { TIME: 100 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
  {
    id: 'wifi-sensor',
    name: 'Sensor WiFi',
    description: 'Conecta un ESP32 a WiFi y envía datos de un sensor por HTTP.',
    boardId: 'esp32-wroom',
    icon: '📡',
    difficulty: 'avanzado',
    workspace: {
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
                block: {
                  type: 'serial_begin',
                  fields: { BAUD: '115200' },
                  next: {
                    block: {
                      type: 'wifi_connect',
                      fields: { SSID: 'Tu_Red_WiFi', PASSWORD: 'tu_contraseña' },
                    },
                  },
                },
              },
            },
          },
          {
            type: 'arduino_loop',
            x: 30,
            y: 300,
            deletable: false,
            inputs: {
              LOOP: {
                block: {
                  type: 'serial_println',
                  inputs: {
                    VALUE: {
                      block: { type: 'wifi_localip' },
                    },
                  },
                  next: {
                    block: {
                      type: 'time_delay',
                      fields: { TIME: 5000 },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
];
