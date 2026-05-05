import { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Lightbulb,
} from 'lucide-react';
import { compileCode } from '../../services/compiler';
import { uploadFirmware } from '../../services/uploader';
import type { UploadProgress } from '../../services/uploader';
import { serialService } from '../../services/serial';
import Minin from '../ui/Minin';

type UploadStep = 'ready' | 'compiling' | 'flashing' | 'success' | 'error';

interface UploadDialogProps {
  open: boolean;
  code: string;
  boardId: string;
  onClose: () => void;
}

export default function UploadDialog({ open, code, boardId, onClose }: UploadDialogProps) {
  const [step, setStep] = useState<UploadStep>('ready');
  const [flashProgress, setFlashProgress] = useState<UploadProgress>({
    status: 'idle', percent: 0, message: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  // Reset state every time the dialog opens
  useEffect(() => {
    if (open) {
      setStep('ready');
      setFlashProgress({ status: 'idle', percent: 0, message: '' });
      setErrorMsg('');
      setErrorDetails('');
    }
  }, [open]);

  const isSerialConnected = serialService.isConnected;

  const handleUpload = useCallback(async () => {
    setErrorMsg('');
    setErrorDetails('');

    // Step 1: Compile on server
    setStep('compiling');
    try {
      const compileResult = await compileCode(code, boardId);
      if (!compileResult.success || !compileResult.binary) {
        setErrorMsg('Error de compilación');
        setErrorDetails(compileResult.stderr || compileResult.error || 'Error desconocido');
        setStep('error');
        return;
      }

      // Step 2: Flash via Web Serial
      setStep('flashing');
      await uploadFirmware(compileResult.binary, boardId, setFlashProgress);
      setStep('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      if (!errorMsg) setErrorMsg(msg);
      setStep('error');
    }
  }, [code, boardId, errorMsg]);

  const handleRetry = useCallback(() => {
    setStep('ready');
    setFlashProgress({ status: 'idle', percent: 0, message: '' });
    setErrorMsg('');
    setErrorDetails('');
  }, []);

  if (!open) return null;

  const isWorking = step === 'compiling' || step === 'flashing';

  const titleByStep: Record<UploadStep, string> = {
    ready: 'Subir a la placa',
    compiling: 'Compilando…',
    flashing: 'Subiendo firmware…',
    success: '¡Subida exitosa!',
    error: 'Error en la subida',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,63,70,0.42)',
        backdropFilter: 'blur(3px)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: 520,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--teal-bg)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Upload className="w-[18px] h-[18px]" style={{ color: 'var(--teal-contrast)' }} />
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                margin: 0,
                color: 'var(--ink)',
              }}
            >
              {titleByStep[step]}
            </h3>
          </div>
          {!isWorking && (
            <button
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,.7)',
                border: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--fg-2)',
              }}
            >
              <X className="w-[16px] h-[16px]" />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '22px 24px' }}>
          {/* Ready state */}
          {step === 'ready' && (
            <div className="flex flex-col items-center gap-4">
              <Minin pose="cables" size={140} animation="float" />
              <div style={{ width: '100%' }}>
                {!isSerialConnected ? (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--yellow-depth)',
                      background: 'var(--yellow-bg)',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                      Placa no conectada
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4, marginBottom: 0 }}>
                      Haz clic en <strong>Conectar</strong> en la barra superior antes de subir.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--teal)',
                      background: 'var(--teal-bg)',
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal-contrast)', margin: 0 }}>
                      Placa conectada
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4, marginBottom: 0 }}>
                      Se compilará el código en el servidor y se subirá a la placa por USB.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compiling */}
          {step === 'compiling' && (
            <div className="flex flex-col items-center gap-3" style={{ padding: '18px 0' }}>
              <Minin pose="programando" size={120} animation="think" />
              <Loader2 className="anim-spin" style={{ width: 28, height: 28, color: 'var(--teal)' }} />
              <p style={{ fontSize: 14, color: 'var(--fg-2)', margin: 0 }}>Compilando código…</p>
              <p style={{ fontSize: 12, color: 'var(--fg-3)', margin: 0 }}>
                Esto puede tardar hasta 1 minuto.
              </p>
            </div>
          )}

          {/* Flashing */}
          {step === 'flashing' && (
            <div className="flex flex-col items-center gap-3" style={{ padding: '12px 0' }}>
              <Minin pose="cables" size={120} animation="float" />
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                {flashProgress.message || 'Subiendo firmware…'}
              </p>
              <div
                style={{
                  width: '100%',
                  height: 10,
                  background: 'var(--teal-soft)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${flashProgress.percent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--teal-mid), var(--teal))',
                    borderRadius: 999,
                    transition: 'width 250ms var(--ease-smooth)',
                  }}
                />
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', margin: 0 }}>
                {flashProgress.percent}%
              </p>
              {boardId.startsWith('esp32') && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--yellow-bg)',
                    border: '1px solid var(--yellow-depth)',
                    width: '100%',
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--ink)',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Lightbulb className="w-[14px] h-[14px]" /> Si la subida no avanza:
                  </p>
                  <ol
                    style={{
                      fontSize: 12,
                      color: 'var(--fg-2)',
                      marginTop: 4,
                      paddingLeft: 22,
                      lineHeight: 1.55,
                    }}
                  >
                    <li>Mantén presionado el botón <strong>BOOT</strong> de la placa</li>
                    <li>Presiona y suelta <strong>RESET</strong> (o reconecta el USB)</li>
                    <li>Suelta <strong>BOOT</strong> cuando veas "Connecting…"</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-3" style={{ padding: '8px 0' }}>
              <Minin pose="contento" size={140} animation="bounce" />
              <CheckCircle2 style={{ width: 48, height: 48, color: '#6cd29a' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                ¡Firmware subido correctamente!
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  color: 'var(--teal-depth)',
                  margin: 0,
                  fontSize: 13,
                }}
              >
                La placa está ejecutando tu programa.
              </p>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center gap-3" style={{ padding: '4px 0' }}>
              <Minin pose="costipado" size={130} animation="shake" />
              <AlertCircle style={{ width: 40, height: 40, color: 'var(--red)' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--red-contrast)', margin: 0 }}>
                {errorMsg || 'Error durante la subida'}
              </p>

              {/* Show bootloader help for ESP32 connection errors */}
              {boardId.startsWith('esp32') &&
                (errorMsg.includes('boot') ||
                  errorMsg.includes('connect') ||
                  errorMsg.includes('timeout')) && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--yellow-bg)',
                      border: '1px solid var(--yellow-depth)',
                      width: '100%',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--ink)',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Lightbulb className="w-[14px] h-[14px]" /> La placa no entró en modo descarga. Intenta:
                    </p>
                    <ol
                      style={{
                        fontSize: 12,
                        color: 'var(--fg-2)',
                        marginTop: 4,
                        paddingLeft: 22,
                        lineHeight: 1.55,
                      }}
                    >
                      <li>Mantén presionado <strong>BOOT</strong></li>
                      <li>Presiona y suelta <strong>RESET</strong> (o reconecta USB)</li>
                      <li>Suelta <strong>BOOT</strong></li>
                      <li>Haz clic en "Reintentar" rápidamente</li>
                    </ol>
                  </div>
                )}

              {errorDetails && (
                <div style={{ width: '100%' }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--fg-3)',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                      letterSpacing: '.05em',
                    }}
                  >
                    Detalles
                  </p>
                  <pre
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11.5,
                      background: 'var(--ink)',
                      color: 'var(--red-light)',
                      padding: 12,
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'auto',
                      maxHeight: 180,
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                    }}
                  >
                    {errorDetails}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isWorking && (
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-subtle)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            <button
              onClick={onClose}
              className="btn"
              style={{ background: '#fff', color: 'var(--fg-2)', border: '1px solid var(--border)' }}
            >
              {step === 'success' ? 'Listo' : 'Cerrar'}
            </button>
            {step === 'ready' && (
              <button
                onClick={handleUpload}
                disabled={!isSerialConnected}
                className="btn btn-secondary"
              >
                <Upload className="w-[14px] h-[14px]" />
                Compilar y subir
              </button>
            )}
            {step === 'error' && (
              <button onClick={handleRetry} className="btn btn-secondary">
                <RotateCcw className="w-[14px] h-[14px]" />
                Reintentar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
