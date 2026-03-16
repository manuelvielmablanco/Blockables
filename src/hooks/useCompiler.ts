import { useState, useCallback } from 'react';
import { compileCode, checkCompilerHealth } from '../services/compiler';
import type { CompileResponse } from '../services/compiler';

export type CompileStatus = 'idle' | 'compiling' | 'success' | 'error' | 'server-offline';

export function useCompiler() {
  const [status, setStatus] = useState<CompileStatus>('idle');
  const [result, setResult] = useState<CompileResponse | null>(null);
  const [binary, setBinary] = useState<string | null>(null); // base64

  const compile = useCallback(async (code: string, boardId: string) => {
    setStatus('compiling');
    setResult(null);
    setBinary(null);

    // Check server health first
    const isOnline = await checkCompilerHealth();
    if (!isOnline) {
      setStatus('server-offline');
      setResult({
        success: false,
        error: 'El servidor de compilación no está disponible. Asegúrate de que esté ejecutándose (docker run).',
      });
      return null;
    }

    try {
      const response = await compileCode(code, boardId);
      setResult(response);

      if (response.success && response.binary) {
        setBinary(response.binary);
        setStatus('success');
        return response.binary;
      } else {
        setStatus('error');
        return null;
      }
    } catch (err) {
      setStatus('error');
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Error de conexión con el servidor',
      });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setBinary(null);
  }, []);

  return { status, result, binary, compile, reset };
}
