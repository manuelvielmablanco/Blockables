/**
 * Web Serial API service for connecting to Arduino/ESP32 boards.
 * Handles port selection, connection, reading, writing, and board detection.
 */

// Known USB VID/PID pairs for board auto-detection
const KNOWN_BOARDS: { vendorId: number; productId?: number; boardId: string; name: string }[] = [
  // Arduino Nano (CH340)
  { vendorId: 0x1a86, productId: 0x7523, boardId: 'arduino-nano', name: 'Arduino Nano (CH340)' },
  // Arduino Nano (FTDI)
  { vendorId: 0x0403, productId: 0x6001, boardId: 'arduino-nano', name: 'Arduino Nano (FTDI)' },
  // Arduino Nano (ATmega16U2)
  { vendorId: 0x2341, productId: 0x0043, boardId: 'arduino-nano', name: 'Arduino Nano (Original)' },
  { vendorId: 0x2341, productId: 0x0001, boardId: 'arduino-nano', name: 'Arduino Nano (Original)' },
  // ESP32-C3 SuperMini (built-in USB)
  { vendorId: 0x303a, productId: 0x1001, boardId: 'esp32-c3', name: 'ESP32-C3 (USB)' },
  // ESP32-C3 with CH340
  { vendorId: 0x1a86, productId: 0x55d4, boardId: 'esp32-c3', name: 'ESP32-C3 (CH340)' },
  // ESP32 WROOM (CP2102)
  { vendorId: 0x10c4, productId: 0xea60, boardId: 'esp32-wroom', name: 'ESP32 WROOM (CP2102)' },
  // ESP32 with CH340
  { vendorId: 0x1a86, productId: 0x7523, boardId: 'esp32-wroom', name: 'ESP32 (CH340)' },
];

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SerialMessage {
  type: 'rx' | 'tx';
  data: string;
  timestamp: number;
}

type StatusListener = (status: ConnectionStatus) => void;
type DataListener = (data: string) => void;

class SerialService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private readLoop: boolean = false;
  private _status: ConnectionStatus = 'disconnected';
  private statusListeners: Set<StatusListener> = new Set();
  private dataListeners: Set<DataListener> = new Set();
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();
  private _baudRate: number = 9600;
  private _detectedBoardId: string | null = null;

  get status(): ConnectionStatus {
    return this._status;
  }

  get baudRate(): number {
    return this._baudRate;
  }

  get isConnected(): boolean {
    return this._status === 'connected';
  }

  get detectedBoardId(): string | null {
    return this._detectedBoardId;
  }

  /** Check if the browser supports Web Serial API */
  static isSupported(): boolean {
    return 'serial' in navigator;
  }

  /** Subscribe to connection status changes */
  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  /** Subscribe to incoming data */
  onData(listener: DataListener): () => void {
    this.dataListeners.add(listener);
    return () => this.dataListeners.delete(listener);
  }

  private setStatus(status: ConnectionStatus) {
    this._status = status;
    this.statusListeners.forEach((l) => l(status));
  }

  private emitData(data: string) {
    this.dataListeners.forEach((l) => l(data));
  }

  /** Try to detect which board is connected based on USB VID/PID */
  private detectBoard(portInfo: SerialPortInfo): string | null {
    const { usbVendorId, usbProductId } = portInfo;
    if (!usbVendorId) return null;

    const match = KNOWN_BOARDS.find(
      (b) => b.vendorId === usbVendorId && (!b.productId || b.productId === usbProductId)
    );
    return match?.boardId ?? null;
  }

  /** Request a serial port from the user and connect */
  async connect(baudRate: number = 9600): Promise<boolean> {
    if (!SerialService.isSupported()) {
      throw new Error('Tu navegador no soporta Web Serial. Usa Chrome o Edge.');
    }

    try {
      this.setStatus('connecting');
      this._baudRate = baudRate;

      // Request port with known filters (shows relevant devices first)
      const filters = KNOWN_BOARDS.map((b) => ({
        usbVendorId: b.vendorId,
        ...(b.productId ? { usbProductId: b.productId } : {}),
      }));

      this.port = await navigator.serial.requestPort({ filters });

      // Try to detect the board
      const portInfo = this.port.getInfo();
      this._detectedBoardId = this.detectBoard(portInfo);

      // Open the port
      await this.port.open({ baudRate });

      // Set up reader
      if (this.port.readable) {
        this.reader = this.port.readable.getReader();
        this.startReading();
      }

      // Set up writer
      if (this.port.writable) {
        this.writer = this.port.writable.getWriter();
      }

      this.setStatus('connected');
      return true;
    } catch (err) {
      // User cancelled the port picker
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        this.setStatus('disconnected');
        return false;
      }
      console.error('Serial connection error:', err);
      this.setStatus('error');
      throw err;
    }
  }

  /** Disconnect from the serial port */
  async disconnect(): Promise<void> {
    this.readLoop = false;

    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }
    } catch {
      // Ignore errors during cleanup
    }

    try {
      if (this.writer) {
        this.writer.releaseLock();
        this.writer = null;
      }
    } catch {
      // Ignore errors during cleanup
    }

    try {
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch {
      // Ignore errors during cleanup
    }

    this._detectedBoardId = null;
    this.setStatus('disconnected');
  }

  /** Send data through the serial port */
  async send(data: string): Promise<void> {
    if (!this.writer) throw new Error('Puerto serie no conectado');
    const encoded = this.encoder.encode(data);
    await this.writer.write(encoded);
  }

  /** Send data with newline */
  async sendLine(data: string): Promise<void> {
    await this.send(data + '\n');
  }

  /** Read loop for incoming serial data */
  private async startReading(): Promise<void> {
    this.readLoop = true;
    while (this.readLoop && this.reader) {
      try {
        const { value, done } = await this.reader.read();
        if (done) {
          this.readLoop = false;
          break;
        }
        if (value) {
          const text = this.decoder.decode(value);
          this.emitData(text);
        }
      } catch (err) {
        if (this.readLoop) {
          console.error('Serial read error:', err);
          this.readLoop = false;
          this.setStatus('error');
        }
        break;
      }
    }
  }

  /** Get the raw serial port for upload (need to disconnect reader/writer first) */
  async getPortForUpload(): Promise<SerialPort | null> {
    if (!this.port) return null;

    // Release reader and writer but keep port open
    this.readLoop = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }
    } catch { /* ignore */ }

    try {
      if (this.writer) {
        this.writer.releaseLock();
        this.writer = null;
      }
    } catch { /* ignore */ }

    return this.port;
  }

  /** Re-attach reader/writer after upload */
  async reattachAfterUpload(): Promise<void> {
    if (!this.port) return;

    if (this.port.readable) {
      this.reader = this.port.readable.getReader();
      this.startReading();
    }
    if (this.port.writable) {
      this.writer = this.port.writable.getWriter();
    }
    this.setStatus('connected');
  }

  /** Change baud rate (requires disconnect/reconnect) */
  async changeBaudRate(baudRate: number): Promise<void> {
    if (!this.port) return;
    this._baudRate = baudRate;

    // Close and re-open with new baud rate
    this.readLoop = false;
    try { if (this.reader) { await this.reader.cancel(); this.reader.releaseLock(); this.reader = null; } } catch { /* */ }
    try { if (this.writer) { this.writer.releaseLock(); this.writer = null; } } catch { /* */ }

    await this.port.close();
    await this.port.open({ baudRate });

    if (this.port.readable) {
      this.reader = this.port.readable.getReader();
      this.startReading();
    }
    if (this.port.writable) {
      this.writer = this.port.writable.getWriter();
    }
  }
}

// Singleton instance
export const serialService = new SerialService();
