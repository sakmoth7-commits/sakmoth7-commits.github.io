import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, Upload, X, Check, RefreshCw, AlertCircle, ScanLine } from 'lucide-react';
import { parseMerchantQR, ParsedQRResult } from '../utils/qrParser';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (result: ParsedQRResult) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanComplete
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedQRResult | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        const parsed = parseMerchantQR(code.data);
        setParsedData(parsed);
        stopCamera();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setParsedData(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to access camera';
      setCameraError(`${msg}. Please check camera permissions or try uploading an image.`);
    }
  }, [scanFrame, stopCamera]);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            const parsed = parseMerchantQR(code.data);
            setParsedData(parsed);
          } else {
            setCameraError('No QR code detected in this image. Please try a clearer picture.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (parsedData) {
      onScanComplete(parsedData);
      onClose();
    }
  };

  const handleSampleQR = () => {
    // Demo sample EMVCo KHQR code for instant testing without camera
    const sampleKHQR = '00020101021229300016bakong@abaa00010108123456785204599953038405802KH5917BROWN COFFEE ROAS6010PHNOM PENH62210710TID-BCR-010803POS6304A1B2';
    const parsed = parseMerchantQR(sampleKHQR);
    setParsedData(parsed);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Scan Merchant QR</h3>
              <p className="text-xs text-slate-500">Auto-extract Merchant Name, MID & TID</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1 m-4 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            Live Camera Scan
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload QR Image
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4">
          {activeTab === 'camera' && (
            <div className="relative w-full aspect-square max-h-72 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target Overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-52 h-52 border-2 border-blue-400/90 rounded-2xl relative shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1 rounded-tl-md"></div>
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1 rounded-tr-md"></div>
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1 rounded-bl-md"></div>
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1 rounded-br-md"></div>
                    <div className="w-full h-0.5 bg-blue-400/80 animate-pulse absolute top-1/2"></div>
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                  <p className="text-xs text-slate-200">{cameraError}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Camera
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center transition-colors bg-slate-50">
              <input
                type="file"
                id="qr-file-input"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="qr-file-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-medium text-slate-700 text-sm">
                  Click to select QR photo or screenshot
                </div>
                <p className="text-xs text-slate-500">
                  PNG, JPG, WebP accepted
                </p>
              </label>
            </div>
          )}

          {/* Quick Demo QR button */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Don't have a physical QR right now?</span>
            <button
              type="button"
              onClick={handleSampleQR}
              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
            >
              Test with Sample EMVCo QR
            </button>
          </div>

          {/* Decoded Results Card */}
          {parsedData && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <Check className="w-4 h-4 text-emerald-600" />
                QR Successfully Decoded ({parsedData.detectedFormat.toUpperCase()})
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <div className="text-slate-500">Merchant Name</div>
                  <div className="font-semibold text-slate-800 truncate">
                    {parsedData.merchantName || '—'}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <div className="text-slate-500">Merchant ID (MID)</div>
                  <div className="font-semibold text-slate-800 truncate">
                    {parsedData.merchantId || '—'}
                  </div>
                </div>

                {parsedData.terminalId && (
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 col-span-2">
                    <div className="text-slate-500">Terminal ID (TID)</div>
                    <div className="font-semibold text-slate-800 truncate">
                      {parsedData.terminalId}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 truncate font-mono bg-white/70 p-1.5 rounded border border-emerald-100">
                Raw: {parsedData.rawText}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Apply & Auto-fill Form
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setParsedData(null);
                    if (activeTab === 'camera') startCamera();
                  }}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Scan Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
