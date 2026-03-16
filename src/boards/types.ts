export interface PinConfig {
  digital: string[];
  analog: string[];
  pwm: string[];
  i2c: { sda: string; scl: string };
  spi: { mosi: string; miso: string; sck: string; ss: string };
  uart: { tx: string; rx: string };
}

export interface BoardFeatures {
  wifi: boolean;
  bluetooth: boolean;
  touchPins: boolean;
  ledc: boolean;       // ESP32 LEDC PWM
  deepSleep: boolean;
  hallSensor: boolean;
  dac: boolean;
}

export interface BoardProfile {
  id: string;
  name: string;
  shortName: string;
  fqbn: string;         // Fully Qualified Board Name for arduino-cli
  platform: 'avr' | 'esp32';
  chip: string;
  pins: PinConfig;
  features: BoardFeatures;
  analogResolution: number;  // 10 bit = 1024, 12 bit = 4096
  pwmResolution: number;     // 8 bit = 256
  voltage: number;           // 3.3 or 5
  flashSize: string;
  icon: string;              // emoji for quick identification
}
