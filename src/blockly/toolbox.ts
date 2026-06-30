export const toolboxConfig = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Lógica',
      categorystyle: 'logic_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-logic' },
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'controls_if', extraState: { hasElse: true } },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_negate' },
        { kind: 'block', type: 'logic_boolean' },
        { kind: 'block', type: 'logic_high_low' },
      ],
    },
    {
      kind: 'category',
      name: 'Control',
      categorystyle: 'control_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-control' },
      contents: [
        { kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } },
        { kind: 'block', type: 'controls_whileUntil' },
        { kind: 'block', type: 'controls_for', fields: { VAR: 'i' }, inputs: { FROM: { shadow: { type: 'math_number', fields: { NUM: 1 } } }, TO: { shadow: { type: 'math_number', fields: { NUM: 10 } } }, BY: { shadow: { type: 'math_number', fields: { NUM: 1 } } } } },
        { kind: 'block', type: 'controls_flow_statements' },
      ],
    },
    {
      kind: 'category',
      name: 'Matemáticas',
      categorystyle: 'math_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-math' },
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
        { kind: 'block', type: 'math_single' },
        { kind: 'block', type: 'math_number_property' },
        { kind: 'block', type: 'math_round' },
        { kind: 'block', type: 'math_modulo' },
        { kind: 'block', type: 'math_constrain', inputs: { LOW: { shadow: { type: 'math_number', fields: { NUM: 1 } } }, HIGH: { shadow: { type: 'math_number', fields: { NUM: 100 } } } } },
        { kind: 'block', type: 'math_random_int', inputs: { FROM: { shadow: { type: 'math_number', fields: { NUM: 1 } } }, TO: { shadow: { type: 'math_number', fields: { NUM: 100 } } } } },
        { kind: 'block', type: 'math_map' },
      ],
    },
    {
      kind: 'category',
      name: 'Texto',
      categorystyle: 'text_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-text' },
      contents: [
        { kind: 'block', type: 'text' },
        { kind: 'block', type: 'text_join' },
        { kind: 'block', type: 'text_length' },
        { kind: 'block', type: 'text_isEmpty' },
      ],
    },
    {
      kind: 'category',
      name: 'Variables',
      categorystyle: 'variable_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-variables' },
      contents: [
        {
          kind: 'block',
          type: 'typed_variable_declare',
          inputs: { VALUE: { shadow: { type: 'math_number', fields: { NUM: 0 } } } },
        },
        { kind: 'block', type: 'typed_variable_set' },
        { kind: 'block', type: 'typed_variable_get' },
        { kind: 'block', type: 'typed_variable_change', inputs: { DELTA: { shadow: { type: 'math_number', fields: { NUM: 1 } } } } },
      ],
    },
    {
      kind: 'category',
      name: 'Listas',
      categorystyle: 'list_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-lists' },
      contents: [
        { kind: 'block', type: 'lists_create_empty' },
        { kind: 'block', type: 'lists_create_with' },
        { kind: 'block', type: 'lists_length' },
        { kind: 'block', type: 'lists_isEmpty' },
        { kind: 'block', type: 'lists_indexOf' },
        { kind: 'block', type: 'lists_getIndex' },
        { kind: 'block', type: 'lists_setIndex' },
      ],
    },
    {
      kind: 'category',
      name: 'Funciones',
      categorystyle: 'procedure_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-functions' },
      custom: 'PROCEDURE',
    },
    { kind: 'sep' },
    {
      kind: 'category',
      name: 'Entrada/Salida',
      categorystyle: 'io_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-io' },
      contents: [
        { kind: 'block', type: 'io_pinmode' },
        { kind: 'block', type: 'io_digitalwrite' },
        { kind: 'block', type: 'io_digitalread' },
        { kind: 'block', type: 'io_analogwrite', inputs: { VALUE: { shadow: { type: 'math_number', fields: { NUM: 128 } } } } },
        { kind: 'block', type: 'io_analogread' },
      ],
    },
    {
      kind: 'category',
      name: 'Tiempo',
      categorystyle: 'time_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-time' },
      contents: [
        { kind: 'block', type: 'time_delay', inputs: { MS: { shadow: { type: 'math_number', fields: { NUM: 1000 } } } } },
        { kind: 'block', type: 'time_delaymicros', inputs: { US: { shadow: { type: 'math_number', fields: { NUM: 100 } } } } },
        { kind: 'block', type: 'time_millis' },
        { kind: 'block', type: 'time_micros' },
      ],
    },
    {
      kind: 'category',
      name: 'Puerto Serie',
      categorystyle: 'serial_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-serial' },
      contents: [
        { kind: 'block', type: 'serial_begin' },
        { kind: 'block', type: 'serial_print' },
        { kind: 'block', type: 'serial_println' },
        { kind: 'block', type: 'serial_available' },
        { kind: 'block', type: 'serial_read' },
        { kind: 'block', type: 'serial_readstring' },
      ],
    },
    { kind: 'sep' },
    {
      kind: 'category',
      name: 'Sensores',
      categorystyle: 'sensor_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-sensors' },
      contents: [
        { kind: 'block', type: 'sensor_button' },
        { kind: 'block', type: 'sensor_potentiometer' },
        { kind: 'block', type: 'sensor_light' },
        { kind: 'block', type: 'sensor_dht_read' },
        { kind: 'block', type: 'sensor_ultrasonic' },
        { kind: 'block', type: 'sensor_tof_vl53l0x' },
        { kind: 'block', type: 'sensor_pir' },
        { kind: 'block', type: 'sensor_soil_moisture' },
        { kind: 'block', type: 'sensor_sound' },
        { kind: 'block', type: 'sensor_tilt' },
        { kind: 'block', type: 'sensor_joystick' },
      ],
    },
    {
      kind: 'category',
      name: 'Actuadores',
      categorystyle: 'actuator_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-actuators' },
      contents: [
        { kind: 'block', type: 'actuator_led' },
        { kind: 'block', type: 'actuator_led_pwm', inputs: { VALUE: { shadow: { type: 'math_number', fields: { NUM: 128 } } } } },
        {
          kind: 'block',
          type: 'actuator_led_rgb',
          inputs: {
            R: { shadow: { type: 'math_number', fields: { NUM: 255 } } },
            G: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
            B: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
          },
        },
        {
          kind: 'block',
          type: 'actuator_buzzer_tone',
          inputs: {
            FREQ: { shadow: { type: 'math_number', fields: { NUM: 1000 } } },
            DURATION: { shadow: { type: 'math_number', fields: { NUM: 500 } } },
          },
        },
        { kind: 'block', type: 'actuator_buzzer_melody' },
        { kind: 'block', type: 'actuator_relay' },
      ],
    },
    {
      kind: 'category',
      name: 'Motor',
      categorystyle: 'motor_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-motor' },
      contents: [
        { kind: 'block', type: 'motor_dc' },
        {
          kind: 'block',
          type: 'motor_dc_run',
          inputs: { SPEED: { shadow: { type: 'math_number', fields: { NUM: 255 } } } },
        },
        { kind: 'block', type: 'motor_dc_stop' },
        { kind: 'block', type: 'motor_servo', inputs: { ANGLE: { shadow: { type: 'math_number', fields: { NUM: 90 } } } } },
        {
          kind: 'block',
          type: 'motor_stepper_init',
          inputs: {
            STEPS_REV: { shadow: { type: 'math_number', fields: { NUM: 2048 } } },
            SPEED: { shadow: { type: 'math_number', fields: { NUM: 10 } } },
          },
        },
        { kind: 'block', type: 'motor_stepper_setspeed', inputs: { RPM: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } },
        { kind: 'block', type: 'motor_stepper_step', inputs: { STEPS: { shadow: { type: 'math_number', fields: { NUM: 100 } } } } },
      ],
    },
    {
      kind: 'category',
      name: 'Pantallas',
      categorystyle: 'display_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-display' },
      contents: [
        { kind: 'label', text: 'LCD I2C' },
        { kind: 'block', type: 'lcd_init' },
        { kind: 'block', type: 'lcd_print' },
        { kind: 'block', type: 'lcd_setcursor' },
        { kind: 'block', type: 'lcd_clear' },
        { kind: 'label', text: 'OLED SSD1306 128x64 I2C' },
        { kind: 'block', type: 'oled_init' },
        { kind: 'block', type: 'oled_clear' },
        { kind: 'block', type: 'oled_setcursor' },
        { kind: 'block', type: 'oled_textsize' },
        { kind: 'block', type: 'oled_print' },
        { kind: 'block', type: 'oled_display' },
        {
          kind: 'block',
          type: 'oled_drawline',
          inputs: {
            X1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
            Y1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
            X2: { shadow: { type: 'math_number', fields: { NUM: 127 } } },
            Y2: { shadow: { type: 'math_number', fields: { NUM: 63 } } },
          },
        },
        {
          kind: 'block',
          type: 'oled_drawrect',
          inputs: {
            X: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
            Y: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
            W: { shadow: { type: 'math_number', fields: { NUM: 20 } } },
            H: { shadow: { type: 'math_number', fields: { NUM: 20 } } },
          },
        },
        {
          kind: 'block',
          type: 'oled_drawcircle',
          inputs: {
            X: { shadow: { type: 'math_number', fields: { NUM: 64 } } },
            Y: { shadow: { type: 'math_number', fields: { NUM: 32 } } },
            R: { shadow: { type: 'math_number', fields: { NUM: 10 } } },
          },
        },
        {
          kind: 'block',
          type: 'oled_drawtriangle',
          inputs: {
            X1: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
            Y1: { shadow: { type: 'math_number', fields: { NUM: 63 } } },
            X2: { shadow: { type: 'math_number', fields: { NUM: 64 } } },
            Y2: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
            X3: { shadow: { type: 'math_number', fields: { NUM: 127 } } },
            Y3: { shadow: { type: 'math_number', fields: { NUM: 63 } } },
          },
        },
        { kind: 'block', type: 'oled_scroll' },
      ],
    },
    {
      kind: 'category',
      name: 'NeoPixel',
      categorystyle: 'neopixel_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-neopixel' },
      contents: [
        { kind: 'block', type: 'neopixel_init' },
        { kind: 'block', type: 'neopixel_setbrightness', inputs: { BRIGHTNESS: { shadow: { type: 'math_number', fields: { NUM: 100 } } } } },
        {
          kind: 'block',
          type: 'neopixel_setcolor',
          inputs: {
            INDEX: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
            R: { shadow: { type: 'math_number', fields: { NUM: 255 } } },
            G: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
            B: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
          },
        },
        { kind: 'block', type: 'neopixel_setcolor_picker' },
        { kind: 'block', type: 'neopixel_show' },
        { kind: 'block', type: 'neopixel_clear' },
        { kind: 'block', type: 'neopixel_effect' },
      ],
    },
    { kind: 'sep' },
    {
      kind: 'category',
      name: 'WiFi',
      categorystyle: 'wifi_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-wifi' },
      contents: [
        { kind: 'block', type: 'wifi_connect' },
        { kind: 'block', type: 'wifi_connected' },
        { kind: 'block', type: 'wifi_localip' },
        { kind: 'block', type: 'wifi_rssi' },
        { kind: 'block', type: 'wifi_disconnect' },
        { kind: 'block', type: 'wifi_http_get' },
        { kind: 'block', type: 'wifi_http_post' },
      ],
    },
    {
      kind: 'category',
      name: 'Bluetooth',
      categorystyle: 'bluetooth_category',
      cssConfig: { container: 'blocklyToolboxCategoryContainer cat-bluetooth' },
      contents: [
        { kind: 'block', type: 'bt_begin' },
        { kind: 'block', type: 'bt_rename' },
        { kind: 'block', type: 'bt_send' },
        { kind: 'block', type: 'bt_send_byte' },
        { kind: 'block', type: 'bt_available' },
        { kind: 'block', type: 'bt_receive_text' },
        { kind: 'block', type: 'bt_receive_number' },
        { kind: 'block', type: 'bt_receive_byte' },
        { kind: 'block', type: 'bt_set_timeout' },
      ],
    },
  ],
};

// ── Dynamic toolbox: filter categories by board features ──
import type { BoardProfile } from '../boards/types';

// Category names that require specific features
const FEATURE_CATEGORIES: Record<string, keyof BoardProfile['features']> = {
  'WiFi': 'wifi',
};

export function getToolboxForBoard(board: BoardProfile) {
  const filtered = toolboxConfig.contents.filter((item) => {
    if (item.kind === 'sep') return true;
    if (item.kind === 'category' && 'name' in item) {
      const requiredFeature = FEATURE_CATEGORIES[item.name as string];
      if (requiredFeature && !board.features[requiredFeature]) {
        return false;
      }
    }
    return true;
  });

  // Remove trailing separators
  while (filtered.length > 0 && filtered[filtered.length - 1].kind === 'sep') {
    filtered.pop();
  }

  return { ...toolboxConfig, contents: filtered };
}
