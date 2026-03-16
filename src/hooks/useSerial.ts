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

  useEffect(() => {
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
    });

    return () => {
      unsubStatus();
      unsubData();
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
