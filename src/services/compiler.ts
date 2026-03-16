const COMPILER_URL = import.meta.env.VITE_COMPILER_URL || 'http://localhost:3100';

export interface CompileResponse {
  success: boolean;
  binary?: string;    // base64 encoded
  filename?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
  cached?: boolean;
  size?: number;
}

/**
 * Send code to the compilation server and receive the compiled binary.
 */
export async function compileCode(code: string, boardId: string): Promise<CompileResponse> {
  const response = await fetch(`${COMPILER_URL}/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, boardId }),
    signal: AbortSignal.timeout(120000), // 2 minute timeout for compilation
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || data.stderr || `Server error: ${response.status}`,
      stdout: data.stdout,
      stderr: data.stderr,
    };
  }

  return data;
}

/**
 * Convert a base64-encoded binary to a Uint8Array for flashing.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Check if the compiler server is available.
 */
export async function checkCompilerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${COMPILER_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}
