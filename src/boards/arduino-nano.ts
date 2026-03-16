import type { BoardProfile } from './types';

export const arduinoNano: BoardProfile = {
  id: 'arduino-nano',
  name: 'Arduino Nano',
  shortName: 'Nano',
  fqbn: 'arduino:avr:nano',
  platform: 'avr',
  chip: 'ATmega328P',
  pins: {
    digital: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
    analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'],
    pwm: ['3', '5', '6', '9', '10', '11'],
    i2c: { sda: 'A4', scl: 'A5' },
    spi: { mosi: '11', miso: '12', sck: '13', ss: '10' },
    uart: { tx: '1', rx: '0' },
  },
  features: {
    wifi: false,
    bluetooth: false,
    touchPins: false,
    ledc: false,
    deepSleep: false,
    hallSensor: false,
    dac: false,
  },
  analogResolution: 1024,
  pwmResolution: 256,
  voltage: 5,
  flashSize: '32 KB',
  icon: '🔵',
};
