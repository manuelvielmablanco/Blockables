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
 * Parse Intel HEX format (used by AVR arduino-cli output) into raw binary.
 * Intel HEX records: `:LLAAAATT[DD...]CC`
 *   LL = byte count, AAAA = address, TT = type (00=data, 01=EOF), DD = data, CC = checksum
 */
export function intelHexToUint8Array(base64Hex: string): Uint8Array {
  const hexString = atob(base64Hex);

  // Parse all data records to find the address range
  const records: { address: number; data: number[] }[] = [];
  let minAddr = Infinity;
  let maxAddr = 0;
  let baseAddress = 0; // Extended address (for >64KB, type 02/04 records)

  const lines = hexString.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed[0] !== ':') continue;

    const byteCount = parseInt(trimmed.substring(1, 3), 16);
    const address = parseInt(trimmed.substring(3, 7), 16);
    const recordType = parseInt(trimmed.substring(7, 9), 16);

    if (recordType === 0x01) break; // EOF
    if (recordType === 0x02) {
      // Extended segment address
      baseAddress = parseInt(trimmed.substring(9, 13), 16) << 4;
      continue;
    }
    if (recordType === 0x04) {
      // Extended linear address
      baseAddress = parseInt(trimmed.substring(9, 13), 16) << 16;
      continue;
    }
    if (recordType !== 0x00) continue; // Only process data records

    const fullAddress = baseAddress + address;
    const data: number[] = [];
    for (let i = 0; i < byteCount; i++) {
      data.push(parseInt(trimmed.substring(9 + i * 2, 11 + i * 2), 16));
    }

    records.push({ address: fullAddress, data });
    minAddr = Math.min(minAddr, fullAddress);
    maxAddr = Math.max(maxAddr, fullAddress + data.length);
  }

  if (records.length === 0) {
    throw new Error('No data records found in Intel HEX file');
  }

  // Create binary array filled with 0xFF (unprogrammed flash)
  const size = maxAddr - minAddr;
  const binary = new Uint8Array(size).fill(0xFF);

  // Copy data records into binary
  for (const record of records) {
    const offset = record.address - minAddr;
    for (let i = 0; i < record.data.length; i++) {
      binary[offset + i] = record.data[i];
    }
  }

  console.log(`[HEX] Parsed Intel HEX: ${records.length} records, ${size} bytes (0x${minAddr.toString(16)}-0x${maxAddr.toString(16)})`);
  return binary;
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
