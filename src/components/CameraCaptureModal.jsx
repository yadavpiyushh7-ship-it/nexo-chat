import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';
import { openPreferredMediaStream } from '../lib/mediaDevices';

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const startCamera = async () => {
      try {
        setErrorMessage('');
        setCapturedDataUrl(null);
        const mediaInfo = await openPreferredMediaStream({
          audio: false,
          video: true,
          facingMode: 'user',
        });

        if (!mounted) {
          mediaInfo.stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = mediaInfo.stream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaInfo.stream;
        }
      } catch (err) {
        if (mounted) {
          setHasPermission(false);
          setErrorMessage('Unable to access camera. Please allow camera permissions in your browser.');
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTakePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedDataUrl(dataUrl);
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
  };

  const handleConfirm = () => {
    if (capturedDataUrl) {
      onCapture(capturedDataUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#111b21] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#d33b74]">
            <Camera className="w-5 h-5" />
            <h3 className="text-[16px] font-bold text-[#111b21] dark:text-white">
              Take Photo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8696a0] hover:text-[#111b21] dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder or Captured Preview */}
        <div className="p-4 bg-black flex items-center justify-center min-h-[300px] relative">
          {errorMessage ? (
            <div className="text-center p-6 text-rose-400">
              <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-[14px] font-medium">{errorMessage}</p>
            </div>
          ) : capturedDataUrl ? (
            <img
              src={capturedDataUrl}
              alt="Snapshot"
              className="max-h-[340px] w-full object-contain rounded-xl"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full max-h-[340px] object-cover rounded-xl"
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-[#d1d7db]/80 dark:border-[#2a3942]/80 flex items-center justify-between">
          {capturedDataUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-[#111b21] dark:text-white text-[13px] font-semibold hover:bg-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-[13px] font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Attach Photo</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-[#8696a0] hover:text-[#111b21] dark:hover:text-white text-[13px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={Boolean(errorMessage)}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#d33b74] to-[#f43f5e] hover:opacity-90 active:scale-95 text-white font-bold text-[13.5px] shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Capture</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
