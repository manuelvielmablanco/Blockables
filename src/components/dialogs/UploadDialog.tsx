import { useState, useEffect, useCallback } from 'react';
import { listPorts, uploadCode } from '../../services/compiler';
import type { PortInfo, UploadResponse } from '../../services/compiler';

type UploadStep = 'select-port' | 'uploading' | 'success' | 'error';

interface UploadDialogProps {
  open: boolean;
  code: string;
  boardId: string;
  onClose: () => void;
  onDisconnectSerial: () => Promise<void>;
}

export default function UploadDialog({ open, code, boardId, onClose, onDisconnectSerial }: UploadDialogProps) {
  const [step, setStep] = useState<UploadStep>('select-port');
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);

  // Load ports when dialog opens
  useEffect(() => {
    if (open) {
      setStep('select-port');
      setResult(null);
      setLoading(true);
      listPorts().then((p) => {
        setPorts(p);
        // Auto-select if only one port
        if (p.length === 1) {
          setSelectedPort(p[0].address);
        } else if (p.length > 0 && !selectedPort) {
          setSelectedPort(p[0].address);
        }
        setLoading(false);
      });
    }
  }, [open]);

  const refreshPorts = useCallback(() => {
    setLoading(true);
    listPorts().then((p) => {
      setPorts(p);
      setLoading(false);
    });
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedPort) return;
    setStep('uploading');
    try {
      // Disconnect Web Serial first so arduino-cli can access the port
      await onDisconnectSerial();
      // Small delay to ensure port is released
      await new Promise((r) => setTimeout(r, 500));

      const res = await uploadCode(code, boardId, selectedPort);
      setResult(res);
      setStep(res.success ? 'success' : 'error');
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Error de conexión',
      });
      setStep('error');
    }
  }, [code, boardId, selectedPort, onDisconnectSerial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-[520px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-base font-bold text-brand-black font-heading">
            {step === 'select-port' ? '⬆️ Subir a la placa' :
             step === 'uploading' ? '⬆️ Subiendo...' :
             step === 'success' ? '✅ ¡Subida exitosa!' :
             '❌ Error al subir'}
          </h3>
          {step !== 'uploading' && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {/* Port selection */}
          {step === 'select-port' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Selecciona el puerto serie donde está conectada tu placa:
              </p>

              {loading ? (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <div className="w-5 h-5 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-500">Buscando puertos...</span>
                </div>
              ) : ports.length === 0 ? (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                  <p className="text-sm font-semibold text-yellow-800">No se detectaron puertos serie</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Asegúrate de que la placa está conectada por USB y los drivers están instalados.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ports.map((port) => (
                    <label
                      key={port.address}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPort === port.address
                          ? 'border-brand-teal bg-brand-teal/5 ring-1 ring-brand-teal'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="port"
                        value={port.address}
                        checked={selectedPort === port.address}
                        onChange={() => setSelectedPort(port.address)}
                        className="accent-brand-teal"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-brand-black">{port.address}</span>
                        {port.board_name && (
                          <span className="ml-2 text-xs text-gray-500">— {port.board_name}</span>
                        )}
                      </div>
                      {port.fqbn && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {port.fqbn.split(':').pop()}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={refreshPorts}
                  disabled={loading}
                  className="text-xs text-brand-teal hover:text-brand-teal/80 font-semibold"
                >
                  🔄 Actualizar puertos
                </button>
                <p className="text-[11px] text-gray-400">
                  Si el monitor serie está abierto, se cerrará durante la subida.
                </p>
              </div>
            </div>
          )}

          {/* Uploading */}
          {step === 'uploading' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">Compilando y subiendo a {selectedPort}...</p>
              <p className="text-xs text-gray-400">Esto puede tardar hasta 2 minutos</p>
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
                  <p className="text-xs text-green-600">Puerto: {selectedPort}</p>
                </div>
              </div>
              {result?.stdout && (
                <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-32 font-mono text-gray-700 border">
                  {result.stdout}
                </pre>
              )}
            </div>
          )}

          {/* Error */}
          {step === 'error' && result && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-semibold text-red-800">
                  {result.error || 'Error durante la subida'}
                </p>
              </div>
              {/* Show bootloader help for ESP32 connection errors */}
              {boardId.startsWith('esp32') && (result.stdout?.includes('boot mode') || result.stdout?.includes('Failed to connect') || result.error?.includes('timeout')) && (
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
              {(result.stderr || result.stdout) && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Detalles:</p>
                  <pre className="text-xs bg-gray-900 text-red-300 p-3 rounded-lg overflow-auto max-h-48 font-mono border whitespace-pre-wrap">
                    {result.stderr || result.stdout}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'uploading' && (
          <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              {step === 'success' ? 'Listo' : 'Cerrar'}
            </button>
            {step === 'select-port' && (
              <button
                onClick={handleUpload}
                disabled={!selectedPort || ports.length === 0}
                className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-brand-teal text-white hover:bg-brand-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ⬆️ Subir
              </button>
            )}
            {step === 'error' && (
              <button
                onClick={() => setStep('select-port')}
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
