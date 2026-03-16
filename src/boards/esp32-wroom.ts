import type { BoardProfile } from './types';

export const esp32Wroom: BoardProfile = {
  id: 'esp32-wroom',
  name: 'ESP32 WROOM',
  shortName: 'ESP32',
  fqbn: 'esp32:esp32:esp32',
  platform: 'esp32',
  chip: 'ESP32-WROOM-32',
  pins: {
    digital: [
      '2', '4', '5', '12', '13', '14', '15', '16', '17', '18', '19',
      '21', '22', '23', '25', '26', '27', '32', '33',
    ],
    analog: ['32', '33', '34', '35', '36', '39'],   // ADC1: 32-39; 34-39 input-only
    pwm: [
      '2', '4', '5', '12', '13', '14', '15', '16', '17', '18', '19',
      '21', '22', '23', '25', '26', '27', '32', '33',
    ],
    i2c: { sda: '21', scl: '22' },
    spi: { mosi: '23', miso: '19', sck: '18', ss: '5' },
    uart: { tx: '1', rx: '3' },
  },
  features: {
    wifi: true,
    bluetooth: true,     // Classic BT + BLE
    touchPins: true,      // T0-T9
    ledc: true,
    deepSleep: true,
    hallSensor: true,
    dac: true,            // GPIO25, GPIO26
  },
  analogResolution: 4096,   // 12-bit ADC
  pwmResolution: 256,
  voltage: 3.3,
  flashSize: '4 MB',
  icon: '🟠',
};
