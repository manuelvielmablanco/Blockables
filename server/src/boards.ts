/**
 * Board configuration for arduino-cli compilation.
 * Maps board IDs to their FQBN and required cores.
 */

export interface BoardConfig {
  fqbn: string;
  core: string;           // arduino-cli core to install
  outputExtension: string; // .hex for AVR, .bin for ESP32
  buildProps?: string[];   // Extra build properties
}

export const boardConfigs: Record<string, BoardConfig> = {
  'arduino-nano': {
    fqbn: 'arduino:avr:nano:cpu=atmega328',
    core: 'arduino:avr',
    outputExtension: '.hex',
  },
  'esp32-c3-supermini': {
    fqbn: 'esp32:esp32:esp32c3:CDCOnBoot=cdc',
    core: 'esp32:esp32',
    outputExtension: '.bin',
  },
  'esp32-wroom': {
    fqbn: 'esp32:esp32:esp32',
    core: 'esp32:esp32',
    outputExtension: '.bin',
  },
};

/**
 * Libraries to pre-install in the Docker image.
 * These cover the sensors/actuators available in the block editor.
 */
export const requiredLibraries = [
  'DHT sensor library',
  'Adafruit Unified Sensor',
  'Adafruit NeoPixel',
  'Adafruit SSD1306',
  'Adafruit GFX Library',
  'Servo',
  'IRremote',
  'LiquidCrystal I2C',
  'SD',
];

export function getBoardConfig(boardId: string): BoardConfig | undefined {
  return boardConfigs[boardId];
}
