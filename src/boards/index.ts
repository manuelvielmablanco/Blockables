import type { BoardProfile } from './types';
import { arduinoNano } from './arduino-nano';
import { esp32C3SuperMini } from './esp32-c3';
import { esp32Wroom } from './esp32-wroom';

export type { BoardProfile } from './types';

export const boards: BoardProfile[] = [
  arduinoNano,
  esp32C3SuperMini,
  esp32Wroom,
];

export const defaultBoard = arduinoNano;

export function getBoardById(id: string): BoardProfile {
  return boards.find(b => b.id === id) || defaultBoard;
}

/**
 * Returns pin options as [label, value] tuples for Blockly dropdowns.
 */
export function getDigitalPinOptions(board: BoardProfile): [string, string][] {
  return board.pins.digital.map(p => {
    const label = board.platform === 'avr' ? `D${p}` : `GPIO${p}`;
    return [label, p];
  });
}

export function getAnalogPinOptions(board: BoardProfile): [string, string][] {
  return board.pins.analog.map(p => {
    const label = board.platform === 'avr' ? p : `GPIO${p}`;
    return [label, p];
  });
}

export function getPwmPinOptions(board: BoardProfile): [string, string][] {
  return board.pins.pwm.map(p => {
    const label = board.platform === 'avr' ? `D${p}` : `GPIO${p}`;
    return [label, p];
  });
}
