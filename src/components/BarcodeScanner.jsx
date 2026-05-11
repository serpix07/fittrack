import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'

const DEFAULT_GRAMS = '100'

// ─── Open Food Facts helpers ──────────────────────────────────────────────────

function parseProduct(p) {
  const n = p.nutriments || {}
  const kcal100 =
    n['energy-kcal_100g'] != null ? n['energy-kcal_100g']
    : n['energy-kcal']    != null ? n['energy-kcal']
    : n['energy_100g']    != null ? n['energy_100g'] / 4.184
    : 0
  return {
    name:  p.product_name || p.product_name_en || p.abbreviated_product_name || 'Unknown product',
    brand: p.brands || '',
    image: p.image_thumb_url || p.image_small_url || null,
    per100: {
      kcal:    Math.round(kcal100),
      protein: Math.round((n.proteins_100g      ?? 0) * 10) / 10,
      carbs:   Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
      fat:     Math.round((n.fat_100g           ?? 0) * 10) / 10,
    },
  }
}

async function lookupBarcode(barcode) {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
    { signal: AbortSignal.timeout(10_000) }
  )
  if (!res.ok) throw new Error('Network error')
  const data = await res.json()
  if (data.status !== 1) return null
  return parseProduct(data.product || {})
}

async function searchFood(query) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=6`
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) return []
  const data = await res.json()
  return (data.products || []).filter(p => p.product_name).slice(0, 6).map(parseProduct)
}

function scale(per100, grams) {
  const r = Number(grams) / 100
  return {
    kcal:    Math.round(per100.kcal    * r),
    protein: Math.round(per100.protein * r * 10) / 10,
    carbs:   Math.round(per100.carbs   * r * 10) / 10,
    fat:     Math.round(per100.fat     * r * 10) / 10,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BarcodeScanner({ onFoodAdded, onClose }) {
  const [camState, setCamState]   = useState('starting') // starting | scanning | error
  const [camError, setCamError]   = useState('')
  const [uiState, setUiState]     = useState('scan')     // scan | loading | found | not-found
  const [product, setProduct]     = useState(null)
  const [grams, setGrams]         = useState(DEFAULT_GRAMS)
  const [showSuccess, setSuccess] = useState(false)
  const [searchQ, setSearchQ]     = useState('')
  const [searchRes, setSearchRes] = useState([])
  const [searching, setSearching] = useState(false)
  const [scanKey, setScanKey]     = useState(0)

  const videoRef      = useRef(null)
  const controlsRef   = useRef(null)
  const processingRef = useRef(false)

  useEffect(() => {
    let isMounted = true
    processingRef.current = false

    const reader = new BrowserMultiFormatReader()

    const init = async () => {
      try {
        // iOS Safari requires getUserMedia to be called from a user gesture context.
        // decodeFromConstraints handles this and also sets playsinline on the video.
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              width:  { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          async (result, err) => {
            // err fires on every frame without a code — that is normal, ignore it
            if (!result || processingRef.current || !isMounted) return
            processingRef.current = true

            controls.stop()
            controlsRef.current = null

            const code = result.getText()
            setUiState('loading')

            try {
              const p = await lookupBarcode(code)
              if (!isMounted) return
              if (p) {
                setProduct(p)
                setGrams(DEFAULT_GRAMS)
                setSuccess(true)
                setUiState('found')
                setTimeout(() => setSuccess(false), 1800)
              } else {
                setUiState('not-found')
              }
            } catch {
              if (isMounted) setUiState('not-found')
            }
          }
        )

        if (!isMounted) { controls.stop(); return }
        controlsRef.current = controls
        setCamState('scanning')
      } catch (err) {
        if (!isMounted) return
        const name = err?.name ?? ''
        const msg = err?.message ?? ''
        const camMsg =
          name === 'NotAllowedError' || msg.includes('Permission') || msg.includes('permission')
            ? "Camera permission denied. Tap Safari's address bar camera icon, allow access, then try again."
            : name === 'NotFoundError' || name === 'DevicesNotFoundError'
            ? 'No camera found on this device.'
            : name === 'NotReadableError' || name === 'TrackStartError'
            ? 'Camera is in use by another app. Close other apps and try again.'
            : name === 'OverconstrainedError'
            ? 'Could not access the back camera. Try reloading.'
            : `Could not start camera: ${msg || name || 'unknown error'}`
        setCamError(camMsg)
        setCamState('error')
      }
    }

    init()

    return () => {
      isMounted = false
      controlsRef.current?.stop()
      controlsRef.current = null
      // ZXing doesn't expose a reset on controls, reader.reset() cleans internal state
      try { reader.reset() } catch {}
    }
  }, [scanKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScanAgain = () => {
    controlsRef.current?.stop()
    controlsRef.current = null
    processingRef.current = false
    setUiState('scan')
    setCamState('starting')
    setProduct(null)
    setGrams(DEFAULT_GRAMS)
    setSuccess(false)
    setSearchQ('')
    setSearchRes([])
    setScanKey(k => k + 1)
  }

  const handleConfirm = () => {
    if (!product || !grams || Number(grams) <= 0) return
    const scaled = scale(product.per100, grams)
    const label = product.brand
      ? `${product.name} (${product.brand}) — ${grams}g`
      : `${product.name} — ${grams}g`
    onFoodAdded({ name: label, ...scaled })
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQ.trim()) return
    setSearching(true)
    setSearchRes([])
    try {
      setSearchRes(await searchFood(searchQ))
    } catch {}
    setSearching(false)
  }

  const handleSelectResult = (p) => {
    setProduct(p)
    setGrams(DEFAULT_GRAMS)
    setSearchRes([])
    setUiState('found')
  }

  const macros = product && Number(grams) > 0 ? scale(product.per100, grams) : null

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">

      {/* ── Video — always mounted so ZXing can attach its stream ─────── */}
      {/*   playsinline is critical for iOS Safari (prevents fullscreen) */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* ── Floating header ──────────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <h2 className="text-white font-bold text-base leading-tight">Scan Barcode</h2>
          <p className="text-slate-400 text-xs">
            {uiState === 'scan'      ? 'Point camera at a product barcode'
              : uiState === 'loading'  ? 'Looking up product…'
              : uiState === 'found'    ? 'Product found'
              : 'Product not found'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── Scan frame overlay ───────────────────────────────────────── */}
      {camState === 'scanning' && uiState === 'scan' && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative z-10" style={{ width: '78vw', maxWidth: 320, height: '28vw', maxHeight: 115 }}>
            {/* Shadow cutout */}
            <div className="absolute inset-0 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.52)]" />
            <div className="absolute inset-0 rounded-2xl border border-white/15" />
            {/* Corner accents */}
            <span className="absolute -top-px   -left-px   w-6 h-6 border-t-[3px] border-l-[3px] border-violet-400 rounded-tl-2xl" />
            <span className="absolute -top-px   -right-px  w-6 h-6 border-t-[3px] border-r-[3px] border-violet-400 rounded-tr-2xl" />
            <span className="absolute -bottom-px -left-px  w-6 h-6 border-b-[3px] border-l-[3px] border-violet-400 rounded-bl-2xl" />
            <span className="absolute -bottom-px -right-px w-6 h-6 border-b-[3px] border-r-[3px] border-violet-400 rounded-br-2xl" />
            {/* Animated scan line */}
            <div className="absolute inset-x-3 h-px bg-violet-400/80 rounded-full"
              style={{ animation: 'scanline 2s ease-in-out infinite' }} />
          </div>
          <p className="relative z-10 mt-6 text-slate-400 text-xs">EAN-13 · EAN-8 · UPC-A · UPC-E</p>
        </div>
      )}

      {/* ── Starting spinner ─────────────────────────────────────────── */}
      {camState === 'starting' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Starting camera…</p>
          </div>
        </div>
      )}

      {/* ── Camera error ─────────────────────────────────────────────── */}
      {camState === 'error' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black px-8 text-center gap-4">
          <span className="text-4xl">📷</span>
          <p className="text-red-400 font-semibold">Camera unavailable</p>
          <p className="text-slate-400 text-sm leading-relaxed">{camError}</p>
          <button onClick={onClose} className="mt-2 text-violet-400 underline text-sm">Close</button>
        </div>
      )}

      {/* ── Loading (after barcode detected) ─────────────────────────── */}
      {uiState === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-300 text-sm">Looking up product…</p>
          </div>
        </div>
      )}

      {/* ── Success flash ────────────────────────────────────────────── */}
      {showSuccess && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 rounded-full bg-green-500/90 flex items-center justify-center"
            style={{ animation: 'pop 0.3s ease-out' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Product card — bottom sheet ──────────────────────────────── */}
      {uiState === 'found' && product && !showSuccess && (
        <div className="absolute bottom-0 inset-x-0 z-20 bg-[#13131f] rounded-t-3xl p-5"
          style={{ animation: 'slideUp 0.3s ease-out' }}>
          {/* Product row */}
          <div className="flex gap-3 mb-4">
            {product.image ? (
              <img src={product.image} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-[#1a1a28]" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#1a1a28] flex items-center justify-center flex-shrink-0 text-2xl">🥫</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base leading-tight truncate">{product.name}</p>
              {product.brand && <p className="text-slate-400 text-xs mt-0.5">{product.brand}</p>}
              <p className="text-slate-500 text-xs mt-1">
                {product.per100.kcal} kcal · {product.per100.protein}g protein per 100g
              </p>
            </div>
          </div>

          {/* Grams adjuster */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setGrams(g => String(Math.max(5, Number(g) - 10)))}
              className="w-10 h-10 rounded-full bg-[#1a1a28] active:bg-[#22223a] text-white text-xl flex items-center justify-center flex-shrink-0"
            >−</button>
            <div className="flex-1 relative">
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={grams}
                onChange={e => setGrams(e.target.value)}
                className="w-full bg-[#1a1a28] text-white text-center font-bold text-lg rounded-xl px-4 py-2.5 border border-white/10 focus:border-violet-500 focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">g</span>
            </div>
            <button
              onClick={() => setGrams(g => String(Number(g) + 10))}
              className="w-10 h-10 rounded-full bg-[#1a1a28] active:bg-[#22223a] text-white text-xl flex items-center justify-center flex-shrink-0"
            >+</button>
          </div>

          {/* Macro preview */}
          {macros && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Kcal',    val: macros.kcal    },
                { label: 'Protein', val: `${macros.protein}g` },
                { label: 'Carbs',   val: `${macros.carbs}g`   },
                { label: 'Fat',     val: `${macros.fat}g`     },
              ].map(({ label, val }) => (
                <div key={label} className="bg-[#1a1a28] rounded-xl p-2 text-center">
                  <p className="text-white font-bold text-sm">{val}</p>
                  <p className="text-slate-500 text-xs">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleScanAgain}
              className="flex-1 py-3 rounded-2xl bg-[#1a1a28] text-slate-300 font-semibold text-sm active:bg-[#22223a]"
            >Scan again</button>
            <button
              onClick={handleConfirm}
              disabled={!grams || Number(grams) <= 0}
              className="flex-[2] py-3 rounded-2xl bg-violet-600 active:bg-violet-700 text-white font-bold text-sm disabled:opacity-40"
            >Add to log</button>
          </div>
        </div>
      )}

      {/* ── Not found — manual search sheet ─────────────────────────── */}
      {uiState === 'not-found' && (
        <div
          className="absolute bottom-0 inset-x-0 z-20 bg-[#13131f] rounded-t-3xl p-5 overflow-y-auto"
          style={{ animation: 'slideUp 0.3s ease-out', maxHeight: '80vh' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="w-5 h-5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Product not found</p>
              <p className="text-slate-400 text-xs">Search by name to find it</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="e.g. Greek yogurt, banana…"
              autoFocus
              className="flex-1 bg-[#1a1a28] text-white rounded-xl px-4 py-2.5 border border-white/10 focus:border-violet-500 focus:outline-none text-sm placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={searching || !searchQ.trim()}
              className="px-4 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm disabled:opacity-40"
            >
              {searching
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin block" />
                : 'Search'}
            </button>
          </form>

          {searchRes.length > 0 && (
            <div className="space-y-2 mb-4">
              {searchRes.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectResult(p)}
                  className="w-full flex items-center gap-3 bg-[#1a1a28] rounded-xl p-3 text-left active:bg-[#22223a]"
                >
                  {p.image ? (
                    <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#0e0e1a] flex items-center justify-center flex-shrink-0 text-lg">🥫</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{p.name}</p>
                    {p.brand && <p className="text-slate-500 text-xs">{p.brand}</p>}
                    <p className="text-slate-600 text-xs">{p.per100.kcal} kcal per 100g</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchRes.length === 0 && !searching && searchQ && (
            <p className="text-slate-500 text-sm text-center mb-4">No results. Try a different name.</p>
          )}

          <button
            onClick={handleScanAgain}
            className="w-full py-3 rounded-2xl bg-[#1a1a28] text-slate-300 font-semibold text-sm active:bg-[#22223a]"
          >Try scanning again</button>
        </div>
      )}

      <style>{`
        @keyframes scanline {
          0%   { top: 10%; }
          50%  { top: 82%; }
          100% { top: 10%; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes pop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
