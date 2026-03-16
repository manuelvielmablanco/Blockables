import type { BoardProfile } from './types';

export const esp32C3SuperMini: BoardProfile = {
  id: 'esp32-c3-supermini',
  name: 'ESP32-C3 SuperMini',
  shortName: 'C3 Mini',
  fqbn: 'esp32:esp32:esp32c3',
  platform: 'esp32',
  chip: 'ESP32-C3',
  pins: {
    digital: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '20', '21'],
    analog: ['0', '1', '2', '3', '4'],   // ADC1: GPIO0-4
    pwm: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '20', '21'], // All GPIOs support LEDC
    i2c: { sda: '8', scl: '9' },
    spi: { mosi: '6', miso: '5', sck: '4', ss: '7' },
    uart: { tx: '21', rx: '20' },
  },
  features: {
    wifi: true,
    bluetooth: true,     // BLE only
    touchPins: false,     // C3 does NOT have touch pins
    ledc: true,
    deepSleep: true,
    hallSensor: false,
    dac: false,           // C3 has no DAC
  },
  analogResolution: 4096,   // 12-bit ADC
  pwmResolution: 256,
  voltage: 3.3,
  flashSize: '4 MB',
  icon: '🟢',
};
