import type { CompileStatus } from '../../hooks/useCompiler';
import type { CompileResponse } from '../../services/compiler';
import type { UploadProgress } from '../../services/uploader';

interface CompileDialogProps {
  open: boolean;
  status: CompileStatus;
  result: CompileResponse | null;
  uploadProgress: UploadProgress | null;
  onClose: () => void;
  onUpload: () => void;
}

export default function CompileDialog({ open, status, result, uploadProgress, onClose, onUpload }: CompileDialogProps) {
  if (!open) return null;

  const isUploading = uploadProgress && (uploadProgress.status === 'preparing' || uploadProgress.status === 'uploading');
  const uploadDone = uploadProgress?.status === 'success';
  const uploadError = uploadProgress?.status === 'error';

  const getTitle = () => {
    if (isUploading) return '⬆️ Subiendo a la placa...';
    if (uploadDone) return '✅ ¡Subida exitosa!';
    if (uploadError) return '❌ Error al subir';
    if (status === 'compiling') return 'Compilando...';
    if (status === 'success') return '✅ Compilación exitosa';
    if (status === 'error') return '❌ Error de compilación';
    if (status === 'server-offline') return '⚠️ Servidor no disponible';
    return 'Compilar';
  };

  const canClose = !isUploading && status !== 'compiling';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-base font-bold text-brand-black font-heading">
            {getTitle()}
          </h3>
          {canClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {/* Compiling spinner */}
          {status === 'compiling' && !uploadProgress && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-10 h-10 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">Compilando el sketch con arduino-cli...</p>
              <p className="text-xs text-gray-400">Esto puede tardar unos segundos</p>
            </div>
          )}

          {/* Compile success */}
          {status === 'success' && result && !uploadProgress && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-green-600 text-lg">✓</span>
                <div>
                  <p className="text-sm font-semibold text-green-800">Sketch compilado correctamente</p>
                  <p className="text-xs text-green-600">
                    Tamaño: {result.size ? `${(result.size / 1024).toFixed(1)} KB` : 'N/A'}
                    {result.cached && ' (desde caché)'}
                  </p>
                </div>
              </div>
              {result.stdout && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Salida del compilador:</p>
                  <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-40 font-mono text-gray-700 border">
                    {result.stdout}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress && (uploadProgress.status !== 'idle') && (
            <div className="space-y-4">
              {/* Progress bar */}
              {(isUploading || uploadDone) && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        uploadDone ? 'bg-green-500' : 'bg-brand-teal'
                      }`}
                      style={{ width: `${uploadProgress.percent}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600">{uploadProgress.message}</p>
                </div>
              )}

              {/* Upload success */}
              {uploadDone && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-600 text-lg">✓</span>
                  <p className="text-sm font-semibold text-green-800">{uploadProgress.message}</p>
                </div>
              )}

              {/* Upload error */}
              {uploadError && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-semibold text-red-800">{uploadProgress.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Compile error */}
          {(status === 'error' || status === 'server-offline') && result && !uploadProgress && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-semibold text-red-800">
                  {result.error || 'Error durante la compilación'}
                </p>
              </div>
              {result.stderr && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Errores:</p>
                  <pre className="text-xs bg-gray-900 text-red-300 p-3 rounded-lg overflow-auto max-h-60 font-mono border">
                    {result.stderr}
                  </pre>
                </div>
              )}
              {result.stdout && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Salida:</p>
                  <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-32 font-mono text-gray-700 border">
                    {result.stdout}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {canClose && (
          <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
            {status === 'success' && !uploadProgress && (
              <button
                onClick={onUpload}
                className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-brand-teal text-white hover:bg-brand-teal/90 transition-colors"
              >
                ⬆️ Subir a la placa
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
