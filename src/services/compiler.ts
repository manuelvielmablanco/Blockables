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

export interface PortInfo {
  address: string;
  protocol: string;
  board_name?: string;
  fqbn?: string;
}

export interface UploadResponse {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
}

/**
 * Send code to the compilation server and receive the compiled binary.
 */
export async function compileCode(code: string, boardId: string): Promise<CompileResponse> {
  const response = await fetch(`${COMPILER_URL}/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, boardId }),
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
 * List available serial ports from the server.
 */
export async function listPorts(): Promise<PortInfo[]> {
  try {
    const response = await fetch(`${COMPILER_URL}/ports`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return [];
    const data = await response.json();
    return data.ports || [];
  } catch {
    return [];
  }
}

/**
 * Upload code to a board via the server (compile + upload using arduino-cli).
 */
export async function uploadCode(code: string, boardId: string, port: string): Promise<UploadResponse> {
  const response = await fetch(`${COMPILER_URL}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, boardId, port }),
    signal: AbortSignal.timeout(180000), // 3 minute timeout
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
