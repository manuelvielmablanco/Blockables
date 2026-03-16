import { useState, useCallback } from 'react';
import { compileCode } from '../../services/compiler';
import { uploadFirmware } from '../../services/uploader';
import type { UploadProgress } from '../../services/uploader';
import { serialService } from '../../services/serial';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-[520px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-base font-bold text-brand-black font-heading">
            {step === 'ready' ? '⬆️ Subir a la placa' :
             step === 'compiling' ? '⬆️ Compilando...' :
             step === 'flashing' ? '⬆️ Subiendo firmware...' :
             step === 'success' ? '✅ ¡Subida exitosa!' :
             '❌ Error'}
          </h3>
          {!isWorking && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {/* Ready state */}
          {step === 'ready' && (
            <div className="space-y-4">
              {!isSerialConnected ? (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                  <p className="text-sm font-semibold text-yellow-800">Placa no conectada</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Haz clic en <strong>"Conectar"</strong> en la barra superior antes de subir.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-800">Placa conectada</p>
                  <p className="text-xs text-green-600 mt-1">
                    Se compilará el código en el servidor y se subirá directamente a la placa por USB.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Compiling */}
          {step === 'compiling' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">Compilando código...</p>
              <p className="text-xs text-gray-400">Esto puede tardar hasta 1 minuto</p>
            </div>
          )}

          {/* Flashing */}
          {step === 'flashing' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-10 h-10 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-700">{flashProgress.message || 'Subiendo firmware...'}</p>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-brand-teal h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${flashProgress.percent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{flashProgress.percent}%</p>
              {boardId.startsWith('esp32') && (
                <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-left w-full">
                  <p className="text-xs font-semibold text-amber-800">💡 Si la subida no avanza:</p>
                  <ol className="text-xs text-amber-700 mt-1 list-decimal list-inside space-y-0.5">
                    <li>Mantén presionado el botón <strong>BOOT</strong> de la placa</li>
                    <li>Presiona y suelta <strong>RESET</strong> (o reconecta el USB)</li>
                    <li>Suelta <strong>BOOT</strong> cuando veas "Connecting..."</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-green-600 text-lg">✓</span>
                <div>
                  <p className="text-sm font-semibold text-green-800">¡Firmware subido correctamente!</p>
                  <p className="text-xs text-green-600">La placa está ejecutando tu programa.</p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-semibold text-red-800">
                  {errorMsg || 'Error durante la subida'}
                </p>
              </div>
              {/* Show bootloader help for ESP32 connection errors */}
              {boardId.startsWith('esp32') && (errorMsg.includes('boot') || errorMsg.includes('connect') || errorMsg.includes('timeout')) && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs font-semibold text-amber-800">💡 La placa no entró en modo descarga. Intenta:</p>
                  <ol className="text-xs text-amber-700 mt-1 list-decimal list-inside space-y-0.5">
                    <li>Mantén presionado <strong>BOOT</strong></li>
                    <li>Presiona y suelta <strong>RESET</strong> (o reconecta USB)</li>
                    <li>Suelta <strong>BOOT</strong></li>
                    <li>Haz clic en "Reintentar" rápidamente</li>
                  </ol>
                </div>
              )}
              {errorDetails && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Detalles:</p>
                  <pre className="text-xs bg-gray-900 text-red-300 p-3 rounded-lg overflow-auto max-h-48 font-mono border whitespace-pre-wrap">
                    {errorDetails}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isWorking && (
          <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              {step === 'success' ? 'Listo' : 'Cerrar'}
            </button>
            {step === 'ready' && (
              <button
                onClick={handleUpload}
                disabled={!isSerialConnected}
                className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-brand-teal text-white hover:bg-brand-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ⬆️ Compilar y subir
              </button>
            )}
            {step === 'error' && (
              <button
                onClick={handleRetry}
                className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-brand-teal text-white hover:bg-brand-teal/90 transition-colors"
              >
                Reintentar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
