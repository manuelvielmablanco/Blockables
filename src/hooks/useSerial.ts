import { useState, useEffect, useCallback, useRef } from 'react';
import { serialService } from '../services/serial';
import type { ConnectionStatus } from '../services/serial';

export interface SerialLine {
  text: string;
  type: 'rx' | 'tx' | 'system';
  timestamp: number;
}

const MAX_LINES = 500;

export function useSerial() {
  const [status, setStatus] = useState<ConnectionStatus>(serialService.status);
  const [lines, setLines] = useState<SerialLine[]>([]);
  const [baudRate, setBaudRate] = useState(9600);
  const bufferRef = useRef('');
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Flush incomplete buffer as a line after a quiet period. Necessary
    // when sketches use Serial.print without newline (e.g., the
    // "serie: escribir" block) — without this, values accumulate in the
    // buffer indefinitely and never render in the monitor.
    const FLUSH_QUIET_MS = 250;

    const flushPartial = () => {
      if (bufferRef.current.length > 0) {
        const text = bufferRef.current.replace(/\r$/, '');
        bufferRef.current = '';
        setLines((prev) => {
          const updated = [
            ...prev,
            { text, type: 'rx' as const, timestamp: Date.now() },
          ];
          return updated.length > MAX_LINES ? updated.slice(-MAX_LINES) : updated;
        });
      }
    };

    const scheduleFlush = () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = setTimeout(flushPartial, FLUSH_QUIET_MS);
    };

    const unsubStatus = serialService.onStatusChange((s) => setStatus(s));
    const unsubData = serialService.onData((data) => {
      // Buffer incoming data and split by newlines
      bufferRef.current += data;
      const parts = bufferRef.current.split('\n');
      // Keep the last part (may be incomplete)
      bufferRef.current = parts.pop() || '';

      if (parts.length > 0) {
        const newLines: SerialLine[] = parts.map((text) => ({
          text: text.replace(/\r$/, ''),
          type: 'rx' as const,
          timestamp: Date.now(),
        }));
        setLines((prev) => {
          const updated = [...prev, ...newLines];
          return updated.length > MAX_LINES ? updated.slice(-MAX_LINES) : updated;
        });
      }

      // (Re)schedule a flush of the trailing partial line
      if (bufferRef.current.length > 0) scheduleFlush();
      else if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    });

    return () => {
      unsubStatus();
      unsubData();
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      await serialService.connect(baudRate);
      setLines((prev) => [
        ...prev,
        { text: `Conectado a ${baudRate} baudios`, type: 'system', timestamp: Date.now() },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      setLines((prev) => [
        ...prev,
        { text: `Error: ${msg}`, type: 'system', timestamp: Date.now() },
      ]);
    }
  }, [baudRate]);

  const disconnect = useCallback(async () => {
    await serialService.disconnect();
    setLines((prev) => [
      ...prev,
      { text: 'Desconectado', type: 'system', timestamp: Date.now() },
    ]);
  }, []);

  const sendLine = useCallback(async (text: string) => {
    if (!serialService.isConnected) return;
    await serialService.sendLine(text);
    setLines((prev) => {
      const updated = [
        ...prev,
        { text, type: 'tx' as const, timestamp: Date.now() },
      ];
      return updated.length > MAX_LINES ? updated.slice(-MAX_LINES) : updated;
    });
  }, []);

  const changeBaudRate = useCallback(async (rate: number) => {
    setBaudRate(rate);
    if (serialService.isConnected) {
      await serialService.changeBaudRate(rate);
      setLines((prev) => [
        ...prev,
        { text: `Velocidad cambiada a ${rate} baudios`, type: 'system', timestamp: Date.now() },
      ]);
    }
  }, []);

  const clearLines = useCallback(() => {
    setLines([]);
    bufferRef.current = '';
  }, []);

  return {
    status,
    lines,
    baudRate,
    detectedBoardId: serialService.detectedBoardId,
    connect,
    disconnect,
    sendLine,
    changeBaudRate,
    clearLines,
    isSupported: 'serial' in navigator,
  };
}
