import { useEffect, useRef, useState } from 'react'

export default function BarcodeScanner({ onResult, onClose }) {
  const [status, setStatus] = useState('starting') // starting | scanning | error
  const [errMsg, setErrMsg] = useState('')
  const scannerRef = useRef(null)
  const stoppedRef = useRef(false)
  // unique id per mount so multiple renders don't collide
  const containerId = useRef(`ft-scanner-${Date.now()}`).current

  useEffect(() => {
    let scanner

    const init = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        scanner = new Html5Qrcode(containerId)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 12,
            qrbox: { width: 300, height: 110 },
            aspectRatio: 1.78,
          },
          (code) => {
            if (stoppedRef.current) return
            stoppedRef.current = true
            scanner.stop().catch(() => {}).finally(() => onResult(code))
          },
          () => {} // per-frame parse errors are normal, ignore
        )
        setStatus('scanning')
      } catch (err) {
        const msg =
          err?.name === 'NotAllowedError' || err?.message?.includes('permission')
            ? 'Camera permission denied. Please allow camera access in your browser settings and try again.'
            : err?.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : `Could not start camera: ${err?.message ?? 'unknown error'}`
        setErrMsg(msg)
        setStatus('error')
      }
    }

    init()

    return () => {
      if (!stoppedRef.current && scannerRef.current) {
        stoppedRef.current = true
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/70 backdrop-blur-sm z-10">
        <div>
          <h2 className="text-white font-bold text-base">Scan Barcode</h2>
          <p className="text-slate-400 text-xs">Point camera at any food product barcode</p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Camera area */}
      <div className="flex-1 relative overflow-hidden">
        {/* html5-qrcode mounts its video here */}
        <div id={containerId} className="w-full h-full" />

        {/* Scanning overlay — shown only when camera is running */}
        {status === 'scanning' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Dark vignette except scan zone */}
            <div className="absolute inset-0 bg-black/40" />
            {/* Scan guide rectangle */}
            <div className="relative z-10 w-72 h-28 rounded-2xl border-2 border-violet-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              {/* Corner accents */}
              <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-4 border-l-4 border-violet-400 rounded-tl-xl" />
              <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-4 border-r-4 border-violet-400 rounded-tr-xl" />
              <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-4 border-l-4 border-violet-400 rounded-bl-xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-4 border-r-4 border-violet-400 rounded-br-xl" />
              {/* Scan line animation */}
              <div className="absolute inset-x-2 h-0.5 bg-violet-400/70 rounded-full animate-[scanline_2s_ease-in-out_infinite]"
                style={{ animation: 'scanline 2s ease-in-out infinite' }}
              />
            </div>
          </div>
        )}

        {/* Starting state */}
        {status === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Starting camera…</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black px-8 text-center gap-4">
            <span className="text-4xl">📷</span>
            <p className="text-red-400 font-medium">Camera unavailable</p>
            <p className="text-slate-400 text-sm">{errMsg}</p>
            <button onClick={onClose} className="mt-2 text-violet-400 underline text-sm">Close</button>
          </div>
        )}
      </div>

      <p className="text-slate-500 text-xs text-center py-3 px-4 bg-black/70">
        Supports EAN-13, EAN-8, UPC-A, UPC-E and QR barcodes
      </p>

      <style>{`
        @keyframes scanline {
          0%   { top: 10%; }
          50%  { top: 80%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  )
}
