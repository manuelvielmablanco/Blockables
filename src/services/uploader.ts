/**
 * Firmware upload service.
 * Uses Web Serial API to flash compiled firmware to Arduino/ESP32 boards.
 * - AVR (Arduino Nano): STK500v1 protocol via serial
 * - ESP32: esptool-js library
 */

import { ESPLoader, Transport } from 'esptool-js';
import { serialService } from './serial';
import { base64ToUint8Array, intelHexToUint8Array } from './compiler';

export type UploadStatus = 'idle' | 'preparing' | 'uploading' | 'success' | 'error';
export type UploadProgress = {
  status: UploadStatus;
  percent: number;
  message: string;
};

type ProgressCallback = (progress: UploadProgress) => void;

/**
 * Upload compiled firmware binary to the connected board.
 */
export async function uploadFirmware(
  binaryBase64: string,
  boardId: string,
  onProgress: ProgressCallback
): Promise<void> {
  const platform = boardId.startsWith('esp32') ? 'esp32' : 'avr';

  onProgress({ status: 'preparing', percent: 0, message: 'Preparando la subida...' });

  if (platform === 'esp32') {
    await uploadESP32(binaryBase64, boardId, onProgress);
  } else {
    await uploadAVR(binaryBase64, onProgress);
  }
}

/**
 * Upload to ESP32 boards using esptool-js
 */
async function uploadESP32(
  binaryBase64: string,
  boardId: string,
  onProgress: ProgressCallback
): Promise<void> {
  const port = await serialService.getPortForUpload();
  if (!port) {
    throw new Error('No hay puerto serie conectado. Conecta la placa primero.');
  }

  try {
    onProgress({ status: 'preparing', percent: 5, message: 'Iniciando conexión con ESP32...' });

    // Close the port first - esptool needs to manage it
    await port.close();

    // Re-open for esptool
    const transport = new Transport(port);

    const esploader = new ESPLoader({
      transport,
      baudrate: 460800,
      romBaudrate: 115200,
      terminal: {
        clean: () => {},
        writeLine: (data: string) => {
          console.log('[esptool]', data);
        },
        write: (data: string) => {
          console.log('[esptool]', data);
        },
      },
    });

    onProgress({ status: 'preparing', percent: 10, message: 'Detectando chip ESP32...' });

    await esploader.main();
    const chipName = esploader.chipName;
    onProgress({ status: 'preparing', percent: 20, message: `Detectado: ${chipName}` });

    // Convert binary
    const binaryData = base64ToUint8Array(binaryBase64);
    const binaryStr = Array.from(binaryData).map(b => String.fromCharCode(b)).join('');

    // Flash address depends on the board
    const flashAddress = boardId === 'esp32-c3' ? 0x0 : 0x10000;

    onProgress({ status: 'uploading', percent: 25, message: 'Subiendo firmware...' });

    await esploader.writeFlash({
      fileArray: [{ data: binaryStr, address: flashAddress }],
      flashSize: 'keep',
      flashMode: 'keep',
      flashFreq: 'keep',
      eraseAll: false,
      compress: true,
      reportProgress: (_fileIndex: number, written: number, total: number) => {
        const pct = 25 + Math.round((written / total) * 70);
        onProgress({
          status: 'uploading',
          percent: pct,
          message: `Subiendo: ${Math.round((written / total) * 100)}%`,
        });
      },
    });

    onProgress({ status: 'uploading', percent: 97, message: 'Reiniciando placa...' });

    await esploader.hardReset();
    await transport.disconnect();

    // Re-open port for serial monitor
    await port.open({ baudRate: serialService.baudRate });
    await serialService.reattachAfterUpload();

    onProgress({ status: 'success', percent: 100, message: '¡Firmware subido correctamente!' });
  } catch (err) {
    // Try to recover port
    try {
      if (port.readable === null) {
        await port.open({ baudRate: serialService.baudRate });
      }
      await serialService.reattachAfterUpload();
    } catch { /* ignore recovery errors */ }

    const msg = err instanceof Error ? err.message : 'Error desconocido';
    onProgress({ status: 'error', percent: 0, message: `Error: ${msg}` });
    throw err;
  }
}

// ==========================================
// AVR (Arduino Nano) STK500v1 Uploader
// ==========================================

/**
 * Buffered serial reader that avoids dangling Promise.race reads.
 * Uses a single continuous read loop that fills a buffer.
 */
class BufferedSerialReader {
  private buffer: number[] = [];
  private port: SerialPort;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private reading = false;
  private readPromise: Promise<void> | null = null;

  constructor(port: SerialPort) {
    this.port = port;
  }

  start(): void {
    if (this.reading) return;
    this.reading = true;
    this.reader = this.port.readable!.getReader();
    this.readPromise = this.readLoop();
  }

  private async readLoop(): Promise<void> {
    while (this.reading && this.reader) {
      try {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          const hex = Array.from(value).map(b => b.toString(16).padStart(2, '0')).join(' ');
          console.log(`[AVR RX] ${value.length} bytes: ${hex}`);
          this.buffer.push(...value);
        }
      } catch {
        break;
      }
    }
  }

  /** Wait for at least `count` bytes to be available, with timeout */
  async waitForBytes(count: number, timeoutMs: number): Promise<Uint8Array | null> {
    const deadline = Date.now() + timeoutMs;
    while (this.buffer.length < count) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) return null;
      await delay(5); // Small poll interval
    }
    const result = new Uint8Array(this.buffer.splice(0, count));
    return result;
  }

  /** Discard all buffered data */
  flush(): void {
    this.buffer.length = 0;
  }

  /** Debug: show current buffer contents as hex */
  debugBuffer(): string {
    return this.buffer.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ');
  }

  /** Get underlying writer */
  getWriter(): WritableStreamDefaultWriter<Uint8Array> {
    return this.port.writable!.getWriter();
  }

  async stop(): Promise<void> {
    this.reading = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }
    } catch { /* ignore */ }
    if (this.readPromise) {
      try { await this.readPromise; } catch { /* ignore */ }
    }
    this.buffer.length = 0;
  }
}

/**
 * Upload to AVR boards (Arduino Nano) using STK500v1 protocol.
 */
async function uploadAVR(
  binaryBase64: string,
  onProgress: ProgressCallback
): Promise<void> {
  const port = await serialService.getPortForUpload();
  if (!port) {
    throw new Error('No hay puerto serie conectado. Conecta la placa primero.');
  }

  // Try 115200 first (Optiboot, most modern boards), then 57600 (old bootloader)
  const baudRatesToTry = [115200, 57600];
  let lastError = '';

  // First pass: try auto-reset (DTR toggle)
  for (const progBaud of baudRatesToTry) {
    try {
      const success = await attemptAVRUpload(port, binaryBase64, progBaud, 'auto', onProgress);
      if (success) return;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Error desconocido';
      console.log(`[AVR Upload] Fallo a ${progBaud} baud: ${lastError}`);
      // Clean up for next attempt
      try {
        try { port.readable?.getReader().releaseLock(); } catch { /* */ }
        try { port.writable?.getWriter().releaseLock(); } catch { /* */ }
        if (port.readable !== null) await port.close();
      } catch { /* ignore */ }
    }
  }

  // Auto-reset failed — try manual reset mode
  // Ask user to press the physical RESET button on the Arduino
  console.log('[AVR] Auto-reset failed, trying manual reset mode');
  onProgress({
    status: 'preparing',
    percent: 5,
    message: '⚠️ Pulsa el botón RESET del Arduino Nano y espera...'
  });

  // Give user 5 seconds to press reset, while continuously trying to sync
  for (const progBaud of baudRatesToTry) {
    try {
      const success = await attemptAVRUpload(port, binaryBase64, progBaud, 'manual', onProgress);
      if (success) return;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Error desconocido';
      console.log(`[AVR Upload] Manual reset fallo a ${progBaud} baud: ${lastError}`);
      try {
        try { port.readable?.getReader().releaseLock(); } catch { /* */ }
        try { port.writable?.getWriter().releaseLock(); } catch { /* */ }
        if (port.readable !== null) await port.close();
      } catch { /* ignore */ }
    }
  }

  // All attempts failed — recover port and throw
  try {
    if (port.readable === null) {
      await port.open({ baudRate: serialService.baudRate });
    }
    await serialService.reattachAfterUpload();
  } catch { /* ignore recovery errors */ }

  onProgress({ status: 'error', percent: 0, message: 'Error: No se pudo conectar con el bootloader.' });
  throw new Error(`No se pudo conectar con el bootloader del Arduino Nano.`);
}

/**
 * Attempt AVR upload at a specific baud rate.
 * Uses close/reopen to reset the board (most reliable for CH340 adapters).
 */
async function attemptAVRUpload(
  port: SerialPort,
  binaryBase64: string,
  progBaud: number,
  resetMode: 'auto' | 'manual',
  onProgress: ProgressCallback
): Promise<boolean> {
  // AVR uses Intel HEX format — parse it to raw binary
  const firmware = intelHexToUint8Array(binaryBase64);
  console.log(`[AVR] Firmware: ${firmware.length} bytes`);

  // Helper: send STK500 command and wait for response
  async function stkCommand(
    w: WritableStreamDefaultWriter<Uint8Array>,
    r: BufferedSerialReader,
    cmd: Uint8Array,
    responseLen: number,
    timeoutMs: number
  ): Promise<Uint8Array | null> {
    await w.write(cmd);
    return await r.waitForBytes(responseLen, timeoutMs);
  }

  let serialReader: BufferedSerialReader | null = null;
  let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  let progReady = false; // true = synced AND entered progmode

  const maxResets = resetMode === 'auto' ? 6 : 1;

  for (let resetAttempt = 0; resetAttempt < maxResets && !progReady; resetAttempt++) {
    if (resetMode === 'auto') {
      // Close port — on CH340 this deasserts DTR (pin goes HIGH)
      try { await port.close(); } catch { /* */ }
      await delay(100); // Longer pause for clean state

      // Open at programming baud rate — CH340 may assert DTR on open (falling edge → reset)
      await port.open({ baudRate: progBaud });

      // Explicit DTR toggle for reset (covers all CH340 driver behaviors).
      // We try both polarities: true→false AND false→true.
      // One creates the falling edge that triggers reset via cap coupling.
      try {
        await port.setSignals({ dataTerminalReady: false, requestToSend: false });
        await delay(50);
        await port.setSignals({ dataTerminalReady: true, requestToSend: true });
      } catch (e) {
        console.log('[AVR] setSignals failed, relying on port open/close for reset');
      }

      // Wait for bootloader to initialize.
      // ATmega328P: ~65ms from reset edge to UART ready.
      // Vary delay per attempt to sweep the timing window.
      const bootDelay = 30 + (resetAttempt * 30); // 30, 60, 90, 120, 150, 180ms
      console.log(`[AVR] Reset ${resetAttempt + 1}: bootDelay=${bootDelay}ms`);
      await delay(bootDelay);
    } else {
      // Manual mode — just open the port, user will press reset
      try { await port.close(); } catch { /* */ }
      await delay(50);
      await port.open({ baudRate: progBaud });
    }

    // Start reader — absorb any noise from the application
    serialReader = new BufferedSerialReader(port);
    writer = serialReader.getWriter();
    serialReader.start();
    // Wait briefly to let any app output arrive, then flush it all
    await delay(20);
    serialReader.flush();

    const resetTimestamp = Date.now();
    onProgress({
      status: 'preparing', percent: 10,
      message: resetMode === 'auto'
        ? `Conectando con bootloader (${progBaud}, intento ${resetAttempt + 1})...`
        : `⚠️ Pulsa RESET en el Arduino y espera... (${progBaud} baud)`
    });

    // Send GET_SYNC and wait for response
    await writer.write(new Uint8Array([0x30, 0x20])); // STK_GET_SYNC + CRC_EOP
    const syncResp = await serialReader.waitForBytes(2, 300);

    if (syncResp && syncResp[0] === 0x14 && syncResp[1] === 0x10) {
      const elapsed = Date.now() - resetTimestamp;
      console.log(`[AVR] Got 0x14 0x10 at ${elapsed}ms — verifying bootloader with READ_SIGN...`);

      // CRITICAL: Verify this is the REAL bootloader, not the application
      // sending fake 0x14 0x10. READ_SIGN returns 5 bytes: [0x14, sig1, sig2, sig3, 0x10]
      // ATmega328P signature: 0x1E, 0x95, 0x0F
      // The application would return [0x14, 0x10, 0x14, 0x10, 0x14] (its repeating pattern)
      serialReader.flush();
      await writer.write(new Uint8Array([0x75, 0x20])); // STK_READ_SIGN + CRC_EOP
      const signResp = await serialReader.waitForBytes(5, 300);
      const elapsed2 = Date.now() - resetTimestamp;

      if (signResp) {
        const hex = Array.from(signResp).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ');
        console.log(`[AVR] READ_SIGN (${elapsed2}ms): [${hex}]`);

        // Verify: byte[0]=0x14 (INSYNC), byte[4]=0x10 (OK), middle bytes = chip signature
        const isBootloader = signResp[0] === 0x14
          && signResp[4] === 0x10
          && !(signResp[1] === 0x10 && signResp[2] === 0x14); // NOT the app's repeating pattern

        if (isBootloader) {
          const sig = `${signResp[1].toString(16)}:${signResp[2].toString(16)}:${signResp[3].toString(16)}`;
          console.log(`[AVR] ✓ BOOTLOADER CONFIRMED! Chip signature: ${sig}`);

          // Now send ENTER_PROGMODE
          serialReader.flush();
          await writer.write(new Uint8Array([0x50, 0x20])); // STK_ENTER_PROGMODE + CRC_EOP
          const enterResp = await serialReader.waitForBytes(2, 300);

          if (enterResp && enterResp[0] === 0x14) {
            progReady = true;
            console.log(`[AVR] ✓ ENTER_PROGMODE OK — ready to flash at ${progBaud} baud`);
          } else {
            console.log(`[AVR] ENTER_PROGMODE failed after verified bootloader`);
          }
        } else {
          console.log(`[AVR] ✗ NOT bootloader — application is sending fake 0x14 0x10 pattern`);
        }
      } else {
        console.log(`[AVR] READ_SIGN timeout at ${elapsed2}ms`);
      }
    } else {
      const elapsed = Date.now() - resetTimestamp;
      console.log(`[AVR] No sync at ${progBaud} baud (reset ${resetAttempt + 1}, ${elapsed}ms)`);
    }

    if (!progReady) {
      await serialReader.stop();
      try { writer.releaseLock(); } catch { /* */ }
      serialReader = null;
      writer = null;
    }
  }

  if (!progReady || !serialReader || !writer) {
    throw new Error(`Sin respuesta del bootloader a ${progBaud} baud`);
  }

  try {
    // === Bootloader in programming mode — start flashing ===
    onProgress({ status: 'uploading', percent: 25, message: 'Escribiendo firmware...' });

    // Write firmware in 128-byte pages
    const pageSize = 128;
    const totalPages = Math.ceil(firmware.length / pageSize);

    for (let page = 0; page < totalPages; page++) {
      const offset = page * pageSize;
      const chunk = firmware.slice(offset, offset + pageSize);
      const address = offset >> 1; // Word address for AVR

      // Set address (STK_LOAD_ADDRESS)
      const addrLow = address & 0xff;
      const addrHigh = (address >> 8) & 0xff;
      const addrResp = await stkCommand(writer, serialReader, new Uint8Array([0x55, addrLow, addrHigh, 0x20]), 2, 500);
      if (!addrResp || addrResp[0] !== 0x14) {
        throw new Error(`Error al establecer dirección en página ${page + 1}`);
      }

      // Program page (STK_PROG_PAGE)
      const pageCmd = new Uint8Array(5 + chunk.length);
      pageCmd[0] = 0x64; // STK_PROG_PAGE
      pageCmd[1] = (chunk.length >> 8) & 0xff;
      pageCmd[2] = chunk.length & 0xff;
      pageCmd[3] = 0x46; // 'F' for Flash
      pageCmd.set(chunk, 4);
      pageCmd[4 + chunk.length] = 0x20; // CRC_EOP

      const progResp = await stkCommand(writer, serialReader, pageCmd, 2, 2000);
      if (!progResp || progResp[0] !== 0x14) {
        throw new Error(`Error escribiendo página ${page + 1}/${totalPages}`);
      }

      const pct = 25 + Math.round(((page + 1) / totalPages) * 70);
      onProgress({
        status: 'uploading',
        percent: pct,
        message: `Escribiendo: ${Math.round(((page + 1) / totalPages) * 100)}%`,
      });
    }

    onProgress({ status: 'uploading', percent: 97, message: 'Finalizando...' });

    // Leave programming mode
    await writer.write(new Uint8Array([0x51, 0x20])); // STK_LEAVE_PROGMODE
    await serialReader.waitForBytes(2, 500);

    // Clean up
    await serialReader.stop();
    try { writer.releaseLock(); } catch { /* */ }

    // Re-open at original baud rate for serial monitor
    await port.close();
    await port.open({ baudRate: serialService.baudRate });
    await serialService.reattachAfterUpload();

    onProgress({ status: 'success', percent: 100, message: '¡Firmware subido correctamente!' });
    return true;

  } catch (err) {
    // Clean up on error
    await serialReader.stop();
    try { writer.releaseLock(); } catch { /* */ }
    throw err;
  }
}

// --- Utility ---
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
