import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getBoardConfig } from './boards';

const execFileAsync = promisify(execFile);

// Directory for temporary sketch files
const TEMP_DIR = process.env.TEMP_DIR || (process.platform === 'win32'
  ? path.join(process.env.TEMP || 'C:\\Temp', 'ingeniables-sketches')
  : '/tmp/sketches');
// Cache compiled binaries by code hash + board
const CACHE_DIR = process.env.CACHE_DIR || (process.platform === 'win32'
  ? path.join(process.env.TEMP || 'C:\\Temp', 'ingeniables-cache')
  : '/tmp/compile-cache');
// Arduino CLI path
const ARDUINO_CLI = process.env.ARDUINO_CLI || 'arduino-cli';

export interface CompileRequest {
  code: string;
  boardId: string;
}

export interface CompileResult {
  success: boolean;
  binary?: Buffer;
  stdout?: string;
  stderr?: string;
  filename?: string;
  cached?: boolean;
}

/**
 * Generate a cache key from code + board combination.
 */
function getCacheKey(code: string, boardId: string): string {
  return crypto.createHash('sha256').update(code + '||' + boardId).digest('hex');
}

/**
 * Compile an Arduino sketch using arduino-cli.
 */
export async function compileSketch(request: CompileRequest): Promise<CompileResult> {
  const { code, boardId } = request;

  // Validate board
  const boardConfig = getBoardConfig(boardId);
  if (!boardConfig) {
    return { success: false, stderr: `Unknown board: ${boardId}` };
  }

  // Check cache
  const cacheKey = getCacheKey(code, boardId);
  const cachedFile = path.join(CACHE_DIR, cacheKey + boardConfig.outputExtension);
  try {
    const cached = await fs.readFile(cachedFile);
    console.log(`Cache hit for ${cacheKey.substring(0, 8)}...`);
    return {
      success: true,
      binary: cached,
      filename: `sketch${boardConfig.outputExtension}`,
      cached: true,
    };
  } catch {
    // Cache miss, continue with compilation
  }

  // Create temp directory for this compilation
  const buildId = uuidv4();
  const sketchDir = path.join(TEMP_DIR, buildId, 'sketch');
  const buildDir = path.join(TEMP_DIR, buildId, 'build');

  try {
    await fs.mkdir(sketchDir, { recursive: true });
    await fs.mkdir(buildDir, { recursive: true });

    // Write sketch file
    const sketchFile = path.join(sketchDir, 'sketch.ino');
    await fs.writeFile(sketchFile, code, 'utf-8');

    console.log(`Compiling sketch for ${boardId} (${boardConfig.fqbn})...`);

    // Build args
    const args = [
      'compile',
      '--fqbn', boardConfig.fqbn,
      '--build-path', buildDir,
      '--warnings', 'default',
      sketchDir,
    ];

    // Add extra build properties if any
    if (boardConfig.buildProps) {
      for (const prop of boardConfig.buildProps) {
        args.push('--build-property', prop);
      }
    }

    // Run arduino-cli
    const { stdout, stderr } = await execFileAsync(ARDUINO_CLI, args, {
      timeout: 120000, // 2 minute timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    // Find the output binary
    const outputFilename = boardConfig.outputExtension === '.hex'
      ? 'sketch.ino.hex'
      : 'sketch.ino.bin';

    const outputPath = path.join(buildDir, outputFilename);

    try {
      const binary = await fs.readFile(outputPath);

      // Cache the result
      await fs.mkdir(CACHE_DIR, { recursive: true });
      await fs.writeFile(cachedFile, binary);

      return {
        success: true,
        binary,
        stdout,
        stderr,
        filename: `sketch${boardConfig.outputExtension}`,
      };
    } catch {
      // Output file not found — compilation probably failed silently
      return {
        success: false,
        stdout,
        stderr: stderr || 'Compilation completed but output binary not found.',
      };
    }
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; message?: string };
    return {
      success: false,
      stdout: execError.stdout || '',
      stderr: execError.stderr || execError.message || 'Unknown compilation error',
    };
  } finally {
    // Cleanup temp files
    try {
      await fs.rm(path.join(TEMP_DIR, buildId), { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ── Serial port listing ──

export interface PortInfo {
  address: string;
  protocol: string;
  board_name?: string;
  fqbn?: string;
}

/**
 * List connected serial ports using arduino-cli.
 */
export async function listPorts(): Promise<PortInfo[]> {
  try {
    const { stdout } = await execFileAsync(ARDUINO_CLI, ['board', 'list', '--format', 'json'], {
      timeout: 10000,
    });

    const data = JSON.parse(stdout);
    // arduino-cli v1.x returns { detected_ports: [...] }
    const detectedPorts = data.detected_ports || data || [];
    const ports: PortInfo[] = [];

    for (const entry of detectedPorts) {
      const port = entry.port;
      if (!port || !port.address) continue;
      // Only show serial ports
      if (port.protocol !== 'serial') continue;

      const boards = entry.matching_boards || [];
      ports.push({
        address: port.address,
        protocol: port.protocol,
        board_name: boards[0]?.name,
        fqbn: boards[0]?.fqbn,
      });
    }

    return ports;
  } catch (error: unknown) {
    console.error('Error listing ports:', error);
    return [];
  }
}

// ── Upload firmware ──

export interface UploadRequest {
  code: string;
  boardId: string;
  port: string;
}

export interface UploadResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
}

/**
 * Compile and upload sketch to a board using arduino-cli.
 */
export async function uploadSketch(request: UploadRequest): Promise<UploadResult> {
  const { code, boardId, port } = request;

  const boardConfig = getBoardConfig(boardId);
  if (!boardConfig) {
    return { success: false, stderr: `Unknown board: ${boardId}` };
  }

  // Create temp directory
  const buildId = uuidv4();
  const sketchDir = path.join(TEMP_DIR, buildId, 'sketch');
  const buildDir = path.join(TEMP_DIR, buildId, 'build');

  try {
    await fs.mkdir(sketchDir, { recursive: true });
    await fs.mkdir(buildDir, { recursive: true });

    // Write sketch file
    const sketchFile = path.join(sketchDir, 'sketch.ino');
    await fs.writeFile(sketchFile, code, 'utf-8');

    console.log(`Compiling + uploading for ${boardId} on ${port}...`);

    // Compile first
    const compileArgs = [
      'compile',
      '--fqbn', boardConfig.fqbn,
      '--build-path', buildDir,
      sketchDir,
    ];

    try {
      await execFileAsync(ARDUINO_CLI, compileArgs, {
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; message?: string };
      return {
        success: false,
        stdout: execError.stdout || '',
        stderr: execError.stderr || execError.message || 'Compilation failed',
      };
    }

    // Upload using arduino-cli
    const uploadArgs = [
      'upload',
      '--fqbn', boardConfig.fqbn,
      '--port', port,
      '--input-dir', buildDir,
    ];

    const { stdout, stderr } = await execFileAsync(ARDUINO_CLI, uploadArgs, {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });

    return {
      success: true,
      stdout: stdout || '',
      stderr: stderr || '',
    };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; message?: string };
    return {
      success: false,
      stdout: execError.stdout || '',
      stderr: execError.stderr || execError.message || 'Upload failed',
    };
  } finally {
    try {
      await fs.rm(path.join(TEMP_DIR, buildId), { recursive: true, force: true });
    } catch { /* ignore */ }
  }
}
