import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { encryptFile, decryptFile } from '../lib/crypto';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../lib/constants';

/**
 * Hook for encrypted file upload and download via Supabase Storage.
 */
export function useFileUpload(roomId) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadFile = useCallback(
    async (file, cryptoKey) => {
      if (!roomId) throw new Error('No room ID');
      if (!cryptoKey) throw new Error('Encryption key not available');

      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      }

      setUploading(true);
      setError(null);

      try {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Encrypt the file
        const { encryptedData, iv } = await encryptFile(arrayBuffer, cryptoKey);

        // Generate unique file path
        const fileId = crypto.randomUUID();
        const filePath = `${roomId}/${fileId}.enc`;

        // Upload encrypted blob to Supabase Storage
        const encryptedBlob = new Blob([encryptedData], {
          type: 'application/octet-stream',
        });

        const { error: uploadError } = await supabase.storage
          .from('room-files')
          .upload(filePath, encryptedBlob, {
            contentType: 'application/octet-stream',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        setUploading(false);

        return {
          fileUrl: filePath,
          fileName: file.name,
          fileSize: file.size,
          iv,
          mimeType: file.type,
        };
      } catch (err) {
        setError(err.message);
        setUploading(false);
        throw err;
      }
    },
    [roomId]
  );

  const downloadFile = useCallback(
    async (fileUrl, iv, cryptoKey, originalFileName) => {
      if (!cryptoKey) throw new Error('Encryption key not available');

      try {
        // Download encrypted file from Supabase Storage
        const { data, error: downloadError } = await supabase.storage
          .from('room-files')
          .download(fileUrl);

        if (downloadError) {
          throw new Error(downloadError.message);
        }

        // Convert blob to ArrayBuffer
        const encryptedArrayBuffer = await data.arrayBuffer();

        // Decrypt
        const decryptedData = await decryptFile(
          encryptedArrayBuffer,
          iv,
          cryptoKey
        );

        // Create download link
        const blob = new Blob([decryptedData]);
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = originalFileName || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Cleanup after short delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const getDecryptedUrl = useCallback(
    async (fileUrl, iv, cryptoKey, mimeType) => {
      if (!cryptoKey) throw new Error('Encryption key not available');

      const { data, error: downloadError } = await supabase.storage
        .from('room-files')
        .download(fileUrl);

      if (downloadError) throw new Error(downloadError.message);

      const encryptedArrayBuffer = await data.arrayBuffer();
      const decryptedData = await decryptFile(encryptedArrayBuffer, iv, cryptoKey);

      const blob = new Blob([decryptedData], { type: mimeType || 'application/octet-stream' });
      return URL.createObjectURL(blob);
    },
    []
  );

  return { uploadFile, downloadFile, getDecryptedUrl, uploading, error };
}
