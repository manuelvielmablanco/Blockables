/**
 * Firmware upload service.
 * Uses Web Serial API to flash compiled firmware to Arduino/ESP32 boards.
 * - AVR (Arduino Nano): STK500v1 protocol via serial
 * - ESP32: esptool-js library
 */

import { ESPLoader, Transport } from 'esptool-js';
import { serialService } from './serial';
import { base64ToUint8Array } from './compiler';

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

/**
 * Upload to AVR boards (Arduino Nano) using STK500v1 protocol.
 * This implements a minimal STK500v1 programmer via Web Serial.
 */
async function uploadAVR(
  binaryBase64: string,
  onProgress: ProgressCallback
): Promise<void> {
  const port = await serialService.getPortForUpload();
  if (!port) {
    throw new Error('No hay puerto serie conectado. Conecta la placa primero.');
  }

  // Try both baud rates: 57600 (old bootloader, most clones) first, then 115200 (new/Optiboot)
  const baudRatesToTry = [57600, 115200];
  let lastError = '';

  for (const progBaud of baudRatesToTry) {
    try {
      const success = await attemptAVRUpload(port, binaryBase64, progBaud, onProgress);
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

  // All attempts failed — recover port and throw
  try {
    if (port.readable === null) {
      await port.open({ baudRate: serialService.baudRate });
    }
    await serialService.reattachAfterUpload();
  } catch { /* ignore recovery errors */ }

  onProgress({ status: 'error', percent: 0, message: `Error: No se pudo conectar con el bootloader a ninguna velocidad. ${lastError}` });
  throw new Error(`No se pudo conectar con el bootloader del Arduino Nano.`);
}

/**
 * Attempt AVR upload at a specific baud rate.
 * Returns true on success, throws on failure.
 */
async function attemptAVRUpload(
  port: SerialPort,
  binaryBase64: string,
  progBaud: number,
  onProgress: ProgressCallback
): Promise<boolean> {
  // Close if open, then re-open at programming baud rate
  try { await port.close(); } catch { /* might already be closed */ }
  await port.open({ baudRate: progBaud });

  const writer = port.writable!.getWriter();
  const reader = port.readable!.getReader();
  const firmware = base64ToUint8Array(binaryBase64);

  onProgress({ status: 'preparing', percent: 5, message: `Probando bootloader a ${progBaud} baud...` });

  // Toggle DTR to reset the board into bootloader
  await port.setSignals({ dataTerminalReady: false, requestToSend: false });
  await delay(100);
  await port.setSignals({ dataTerminalReady: true, requestToSend: true });
  await delay(100);
  await port.setSignals({ dataTerminalReady: false, requestToSend: false });
  // Wait for bootloader to start (old bootloader needs more time)
  await delay(progBaud === 57600 ? 400 : 200);

  // Flush any pending data
  await flushReader(reader);

  onProgress({ status: 'preparing', percent: 10, message: `Conectando con bootloader (${progBaud})...` });

  // Sync with bootloader — send STK_GET_SYNC multiple times
  let synced = false;
  for (let attempt = 0; attempt < 8; attempt++) {
    // Send sync command
    await writer.write(new Uint8Array([0x30, 0x20])); // STK_GET_SYNC + CRC_EOP
    const resp = await readWithTimeout(reader, 2, 300);
    if (resp && resp[0] === 0x14 && resp[1] === 0x10) {
      synced = true;
      break;
    }
    // Flush garbage and retry
    await flushReader(reader);
    await delay(50);
  }

  if (!synced) {
    reader.releaseLock();
    writer.releaseLock();
    throw new Error(`Sin respuesta del bootloader a ${progBaud} baud`);
  }

  onProgress({ status: 'preparing', percent: 20, message: `Bootloader conectado (${progBaud} baud)` });

  // Get signature to verify it's an ATmega328P
  await writer.write(new Uint8Array([0x75, 0x20])); // STK_READ_SIGN
  const sigResp = await readWithTimeout(reader, 5, 1000);
  if (sigResp && sigResp[0] === 0x14) {
    const sig = `${sigResp[1].toString(16)}-${sigResp[2].toString(16)}-${sigResp[3].toString(16)}`;
    console.log(`[AVR] Signature: ${sig}`);
  }

  // Enter programming mode
  await writer.write(new Uint8Array([0x50, 0x20])); // STK_ENTER_PROGMODE
  const enterResp = await readWithTimeout(reader, 2, 1000);
  if (!enterResp || enterResp[0] !== 0x14) {
    reader.releaseLock();
    writer.releaseLock();
    throw new Error('Error entrando en modo de programación');
  }

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
    await writer.write(new Uint8Array([0x55, addrLow, addrHigh, 0x20]));
    const addrResp = await readWithTimeout(reader, 2, 500);
    if (!addrResp || addrResp[0] !== 0x14) {
      reader.releaseLock();
      writer.releaseLock();
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

    await writer.write(pageCmd);
    const progResp = await readWithTimeout(reader, 2, 2000);
    if (!progResp || progResp[0] !== 0x14) {
      reader.releaseLock();
      writer.releaseLock();
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
  await readWithTimeout(reader, 2, 500);

  // Release locks
  reader.releaseLock();
  writer.releaseLock();

  // Re-open at original baud rate for serial monitor
  await port.close();
  await port.open({ baudRate: serialService.baudRate });
  await serialService.reattachAfterUpload();

  onProgress({ status: 'success', percent: 100, message: '¡Firmware subido correctamente!' });
  return true;
}

// --- Utility functions ---

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readWithTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  expectedBytes: number,
  timeoutMs: number
): Promise<Uint8Array | null> {
  const result: number[] = [];
  const deadline = Date.now() + timeoutMs;

  while (result.length < expectedBytes && Date.now() < deadline) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;

    const timeoutPromise = new Promise<{ value: undefined; done: true }>((resolve) =>
      setTimeout(() => resolve({ value: undefined, done: true }), remaining)
    );

    const readResult = await Promise.race([reader.read(), timeoutPromise]);
    if (readResult.done || !readResult.value) break;
    result.push(...readResult.value);
  }

  return result.length >= expectedBytes ? new Uint8Array(result.slice(0, expectedBytes)) : null;
}

async function flushReader(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  // Read all pending data with a short timeout
  const deadline = Date.now() + 200;
  while (Date.now() < deadline) {
    const timeout = new Promise<{ done: true; value: undefined }>((r) =>
      setTimeout(() => r({ done: true, value: undefined }), 50)
    );
    const result = await Promise.race([reader.read(), timeout]);
    if (result.done || !result.value) break;
  }
}
