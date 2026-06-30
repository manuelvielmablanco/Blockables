/**
 * Firmware original del kit Theremin (Ingeniables), troceado para que los
 * bloques `theremin_init` / `theremin_run` emitan EXACTAMENTE el mismo código
 * Arduino que el .ino de fábrica.
 *
 * El .ino usa cosas sin equivalente en bloques (buzzer por Timer1 con ISR,
 * tablas de melodía en PROGMEM, registros AVR, sensor ToF VL53L0X, HSV…), así
 * que en lugar de descomponerlo en bloques genéricos lo encapsulamos: dos
 * bloques propios del kit cuyo generador vuelca el firmware real. Importamos
 * el .ino y frecuencias.h como texto crudo y los partimos aquí, para no tener
 * que mantener el código duplicado a mano.
 */
import inoRaw from '../data/kits-workspaces/theremin.ino?raw';
import notesRaw from '../data/kits-workspaces/theremin-frecuencias.h?raw';

/** Extrae el cuerpo (sin las llaves externas) de una función por su firma. */
function extractBody(src: string, signature: string): string {
  const start = src.indexOf(signature);
  if (start < 0) return '';
  const open = src.indexOf('{', start);
  if (open < 0) return '';
  let depth = 0;
  let i = open;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  return src.slice(open + 1, i).replace(/^\r?\n/, '').replace(/\s+$/, '');
}

// Solo las líneas #define de frecuencias.h (sin el bloque de comentario).
const noteDefines = notesRaw
  .split('\n')
  .map((l) => l.replace(/\r$/, ''))
  .filter((l) => l.trim().startsWith('#define'))
  .join('\n');

/** Includes de librería (frecuencias.h se inserta inline como #defines). */
export const thereminIncludes = [
  '#include <Adafruit_NeoPixel.h>',
  '#include <Wire.h>',
  '#include <VL53L0X.h>',
  '#include <avr/io.h>',
  '#include <avr/interrupt.h>',
];

// Preámbulo = todo lo que va entre los includes y `void setup(`: struct,
// constantes de pines, objetos globales (strip, tofSensor), variables de
// estado, la ISR del Timer1 y TODAS las funciones auxiliares. Le quitamos las
// líneas #include (van por addInclude) y le anteponemos los #define de notas.
const setupIdx = inoRaw.indexOf('void setup(');
const head = inoRaw.slice(0, setupIdx);
const headNoIncludes = head
  .split('\n')
  .map((l) => l.replace(/\r$/, ''))
  .filter((l) => !l.trim().startsWith('#include'))
  .join('\n')
  .trim();

export const thereminPreamble = noteDefines + '\n\n' + headNoIncludes;
export const thereminSetupBody = extractBody(inoRaw, 'void setup(');
export const thereminLoopBody = extractBody(inoRaw, 'void loop(');
