import { useState, useCallback } from 'react';
import { uploadFirmware } from '../services/uploader';
import type { UploadProgress } from '../services/uploader';

export function useUploader() {
  const [progress, setProgress] = useState<UploadProgress>({
    status: 'idle',
    percent: 0,
    message: '',
  });

  const upload = useCallback(async (binaryBase64: string, boardId: string) => {
    try {
      await uploadFirmware(binaryBase64, boardId, setProgress);
    } catch {
      // Error already reported via progress callback
    }
  }, []);

  const reset = useCallback(() => {
    setProgress({ status: 'idle', percent: 0, message: '' });
  }, []);

  return { progress, upload, reset };
}
