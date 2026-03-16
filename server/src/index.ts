import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { compileSketch, listPorts, uploadSketch } from './compiler';
import { boardConfigs } from './boards';

const app = express();
const PORT = parseInt(process.env.PORT || '3100', 10);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));

app.use(express.json({ limit: '1mb' }));

// Rate limiting: 30 compilations per minute per IP
const compileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Demasiadas peticiones. Inténtalo de nuevo en un minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Health check ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', boards: Object.keys(boardConfigs) });
});

// ── List available boards ──
app.get('/boards', (_req, res) => {
  res.json(boardConfigs);
});

// ── List serial ports ──
app.get('/ports', async (_req, res) => {
  try {
    const ports = await listPorts();
    res.json({ ports });
  } catch (error) {
    console.error('Error listing ports:', error);
    res.status(500).json({ error: 'Failed to list ports' });
  }
});

// ── Compile endpoint ──
app.post('/compile', compileLimiter, async (req, res) => {
  const { code, boardId } = req.body;

  // Validate input
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "code" field' });
    return;
  }

  if (!boardId || typeof boardId !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "boardId" field' });
    return;
  }

  if (code.length > 500000) {
    res.status(400).json({ error: 'Code exceeds maximum size (500KB)' });
    return;
  }

  // Basic sanitization: reject code with suspicious patterns
  const suspicious = ['system(', 'exec(', 'popen(', '__asm__', '#include <stdlib.h>'];
  if (suspicious.some(p => code.includes(p))) {
    res.status(400).json({ error: 'Code contains forbidden patterns' });
    return;
  }

  try {
    const result = await compileSketch({ code, boardId });

    if (result.success && result.binary) {
      res.json({
        success: true,
        binary: result.binary.toString('base64'),
        filename: result.filename,
        stdout: result.stdout || '',
        cached: result.cached || false,
        size: result.binary.length,
      });
    } else {
      res.status(422).json({
        success: false,
        error: 'Compilation failed',
        stdout: result.stdout || '',
        stderr: result.stderr || '',
      });
    }
  } catch (error) {
    console.error('Compilation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during compilation',
    });
  }
});

// ── Upload endpoint (compile + upload via arduino-cli) ──
app.post('/upload', compileLimiter, async (req, res) => {
  const { code, boardId, port } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "code" field' });
    return;
  }
  if (!boardId || typeof boardId !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "boardId" field' });
    return;
  }
  if (!port || typeof port !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "port" field' });
    return;
  }

  // Validate port format (COMx on Windows, /dev/ttyXXX on Linux/Mac)
  if (!/^(COM\d+|\/dev\/tty\w+)$/i.test(port)) {
    res.status(400).json({ error: 'Invalid port format' });
    return;
  }

  const suspicious = ['system(', 'exec(', 'popen(', '__asm__', '#include <stdlib.h>'];
  if (suspicious.some(p => code.includes(p))) {
    res.status(400).json({ error: 'Code contains forbidden patterns' });
    return;
  }

  try {
    const result = await uploadSketch({ code, boardId, port });

    if (result.success) {
      res.json({
        success: true,
        stdout: result.stdout || '',
        stderr: result.stderr || '',
      });
    } else {
      res.status(422).json({
        success: false,
        error: 'Upload failed',
        stdout: result.stdout || '',
        stderr: result.stderr || '',
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during upload',
    });
  }
});

// ── Start server ──
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔧 Ingeniables Blocks Compiler Server running on port ${PORT}`);
  console.log(`   Available boards: ${Object.keys(boardConfigs).join(', ')}`);
});
