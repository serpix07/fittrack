import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import BarcodeScanner from './BarcodeScanner'

const today = () => new Date().toISOString().split('T')[0]

// ─── Open Food Facts lookup ───────────────────────────────────────────────────

async function lookupBarcode(barcode) {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
    { signal: AbortSignal.timeout(10_000) }
  )
  if (!res.ok) throw new Error('Network error — check your connection')
  const data = await res.json()
  if (data.status !== 1) throw new Error('Product not found in Open Food Facts database')

  const p = data.product || {}
  const n = p.nutriments || {}

  const kcal100 =
    n['energy-kcal_100g'] != null ? n['energy-kcal_100g']
    : n['energy-kcal']    != null ? n['energy-kcal']
    : n['energy_100g']    != null ? n['energy_100g'] / 4.184
    : 0

  return {
    barcode,
    name:   p.product_name || p.product_name_en || p.abbreviated_product_name || 'Unknown product',
    brand:  p.brands || '',
    image:  p.image_thumb_url || p.image_small_url || null,
    per100: {
      kcal:    Math.round(kcal100),
      protein: Math.round((n.proteins_100g        ?? 0) * 10) / 10,
      carbs:   Math.round((n.carbohydrates_100g   ?? 0) * 10) / 10,
      fat:     Math.round((n.fat_100g             ?? 0) * 10) / 10,
    },
  }
}

function scaleToGrams(per100, grams) {
  const r = Number(grams) / 100
  return {
    kcal:    Math.round(per100.kcal    * r),
    protein: Math.round(per100.protein * r * 10) / 10,
    carbs:   Math.round(per100.carbs   * r * 10) / 10,
    fat:     Math.round(per100.fat     * r * 10) / 10,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MacroBar({ label, current, goal, colorFull, unit = 'g' }) {
  const pct  = Math.min((current / goal) * 100, 100)
  const over = current > goal
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <span className={`text-sm font-semibold ${over ? 'text-red-400' : 'text-slate-200'}`}>
          <span className="text-base font-bold">{Math.round(current)}</span>
          <span className="text-slate-600 font-normal"> / {goal}{unit}</span>
        </span>
      </div>
      <div className="h-2.5 bg-[#1a1a28] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bar-fill ${over ? 'bg-red-500' : colorFull}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NutritionTracker({ profile, userId }) {
  const goals = { kcal: profile.calorieTarget, ...profile.macros }
  const [logs, setLogs] = useLocalStorage(`ft-${userId}-nutrition`, {})

  // Manual form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' })
  const [formError, setFormError] = useState('')

  // Barcode flow
  const [scanning, setScanning]         = useState(false)
  const [lookupState, setLookupState]   = useState(null) // null | 'loading' | 'error'
  const [lookupError, setLookupError]   = useState('')
  const [product, setProduct]           = useState(null)  // scanned product info
  const [grams, setGrams]               = useState('100')

  // ── Totals ────────────────────────────────────────────────────────────────
  const todayLogs = logs[today()] || []
  const totals = todayLogs.reduce(
    (a, m) => ({ kcal: a.kcal+m.kcal, protein: a.protein+m.protein, carbs: a.carbs+m.carbs, fat: a.fat+m.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )
  const remaining = { kcal: goals.kcal - totals.kcal, protein: goals.protein - totals.protein }

  // ── Barcode handlers ──────────────────────────────────────────────────────
  const handleBarcodeScan = async (code) => {
    setScanning(false)
    setLookupState('loading')
    setLookupError('')
    setProduct(null)
    try {
      const p = await lookupBarcode(code)
      setProduct(p)
      setGrams('100')
      setShowForm(true)
    } catch (err) {
      setLookupError(err.message)
    } finally {
      setLookupState(null)
    }
  }

  const confirmScannedProduct = () => {
    if (!product || !grams || Number(grams) <= 0) return
    const scaled = scaleToGrams(product.per100, grams)
    const label = product.brand
      ? `${product.name} (${product.brand}) — ${grams}g`
      : `${product.name} — ${grams}g`
    pushMeal({ name: label, ...scaled })
    setProduct(null)
    setShowForm(false)
  }

  // ── Manual meal handlers ──────────────────────────────────────────────────
  const addManualMeal = () => {
    if (!form.name.trim()) return setFormError('Enter a meal name')
    if (!form.kcal || !form.protein || !form.carbs || !form.fat) return setFormError('Fill in all macro values')
    pushMeal({
      name: form.name.trim(),
      kcal: Number(form.kcal), protein: Number(form.protein),
      carbs: Number(form.carbs), fat: Number(form.fat),
    })
    setForm({ name: '', kcal: '', protein: '', carbs: '', fat: '' })
    setFormError('')
    setShowForm(false)
  }

  const pushMeal = (meal) => {
    setLogs({ ...logs, [today()]: [...todayLogs, { id: Date.now(), ...meal }] })
  }

  const del = (id) => setLogs({ ...logs, [today()]: todayLogs.filter(m => m.id !== id) })

  const previewMacros = product && Number(grams) > 0 ? scaleToGrams(product.per100, grams) : null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Barcode scanner overlay */}
      {scanning && (
        <BarcodeScanner
          onResult={handleBarcodeScan}
          onClose={() => setScanning(false)}
        />
      )}

      {/* ── Daily summary card ── */}
      <div className="glass-card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-white font-bold text-lg">Today's Nutrition</h2>
            <p className="text-slate-500 text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${totals.kcal > goals.kcal ? 'text-red-400' : 'text-violet-400'}`}>
              {Math.round(totals.kcal)}
            </p>
            <p className="text-slate-600 text-xs">/ {goals.kcal} kcal</p>
          </div>
        </div>

        <div className="h-2.5 bg-[#1a1a28] rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 bar-fill"
            style={{ width: `${Math.min((totals.kcal / goals.kcal) * 100, 100)}%` }} />
        </div>
        <p className="text-slate-600 text-xs text-right mb-5">
          {remaining.kcal >= 0 ? `${remaining.kcal} kcal remaining` : `${Math.abs(remaining.kcal)} kcal over`}
        </p>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="bg-[#1a1a28] rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-0.5">Kcal remaining</p>
            <p className={`text-xl font-bold ${remaining.kcal < 0 ? 'text-red-400' : 'text-green-400'}`}>{remaining.kcal}</p>
          </div>
          <div className="bg-[#1a1a28] rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-0.5">Protein left</p>
            <p className={`text-xl font-bold ${remaining.protein < 0 ? 'text-red-400' : 'text-blue-400'}`}>{remaining.protein}g</p>
          </div>
        </div>

        <div className="space-y-3.5">
          <MacroBar label="Calories" current={totals.kcal}    goal={goals.kcal}    colorFull="bg-violet-500" unit=" kcal" />
          <MacroBar label="Protein"  current={totals.protein} goal={goals.protein} colorFull="bg-blue-500"   />
          <MacroBar label="Carbs"    current={totals.carbs}   goal={goals.carbs}   colorFull="bg-amber-500"  />
          <MacroBar label="Fat"      current={totals.fat}     goal={goals.fat}     colorFull="bg-rose-500"   />
        </div>
      </div>

      {/* ── Lookup loading / error feedback ── */}
      {lookupState === 'loading' && (
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-slate-300 text-sm">Looking up product…</p>
        </div>
      )}
      {lookupError && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-red-400 text-lg">⚠️</span>
          <div>
            <p className="text-red-300 text-sm font-medium">Barcode lookup failed</p>
            <p className="text-red-400/70 text-xs mt-0.5">{lookupError}</p>
            <button
              className="text-violet-400 text-xs mt-2 underline"
              onClick={() => { setLookupError(''); setShowForm(true) }}
            >
              Enter macros manually instead
            </button>
          </div>
        </div>
      )}

      {/* ── Add meal / barcode form ── */}
      {!showForm ? (
        <div className="flex gap-2.5">
          <button className="btn-primary flex-1" onClick={() => { setProduct(null); setShowForm(true) }}>
            + Log Meal
          </button>
          <button
            className="btn-ghost flex items-center gap-2 px-4"
            onClick={() => { setLookupError(''); setScanning(true) }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/>
              <rect x="3" y="16" width="5" height="5"/>
              <path d="M21 16h-3v3" strokeLinecap="round"/><path d="M21 19v2" strokeLinecap="round"/>
              <path d="M16 16v3h2" strokeLinecap="round"/>
              <path d="M11 3v5" strokeLinecap="round"/><path d="M11 11v2" strokeLinecap="round"/>
              <path d="M3 11h8" strokeLinecap="round"/><path d="M3 16h4" strokeLinecap="round" strokeDasharray="2 2"/>
            </svg>
            <span className="text-sm">Scan</span>
          </button>
        </div>
      ) : (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">
              {product ? 'Confirm Scanned Product' : 'Log a Meal'}
            </h3>
            <button
              onClick={() => { setShowForm(false); setProduct(null) }}
              className="text-slate-500 hover:text-slate-300 text-xl leading-none"
            >×</button>
          </div>

          {/* ─ Scanned product card ─ */}
          {product && (
            <div className="mb-4">
              <div className="bg-[#1a1a28] border border-violet-600/30 rounded-xl p-4 mb-3">
                <div className="flex items-start gap-3">
                  {product.image && (
                    <img src={product.image} alt="" className="w-14 h-14 rounded-lg object-contain bg-white/5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm leading-tight">{product.name}</p>
                    {product.brand && <p className="text-slate-500 text-xs mt-0.5">{product.brand}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        { label: `${product.per100.kcal} kcal`, color: 'text-violet-400 bg-violet-400/10' },
                        { label: `P ${product.per100.protein}g`, color: 'text-blue-400 bg-blue-400/10' },
                        { label: `C ${product.per100.carbs}g`, color: 'text-amber-400 bg-amber-400/10' },
                        { label: `F ${product.per100.fat}g`, color: 'text-rose-400 bg-rose-400/10' },
                      ].map(b => (
                        <span key={b.label} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.color}`}>{b.label}</span>
                      ))}
                      <span className="text-slate-600 text-xs self-center">per 100g</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gram input */}
              <div className="mb-3">
                <label className="text-slate-400 text-xs font-medium mb-1 block">How many grams did you eat?</label>
                <div className="relative">
                  <input
                    type="number"
                    className="input-dark pr-8 text-lg font-bold"
                    value={grams}
                    onChange={e => setGrams(e.target.value)}
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">g</span>
                </div>
              </div>

              {/* Live macro preview */}
              {previewMacros && (
                <div className="bg-violet-900/20 border border-violet-700/30 rounded-xl p-3 mb-3">
                  <p className="text-violet-400/70 text-xs font-medium mb-2">For {grams}g:</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Kcal',    val: previewMacros.kcal,    color: 'text-violet-400' },
                      { label: 'Protein', val: `${previewMacros.protein}g`, color: 'text-blue-400'   },
                      { label: 'Carbs',   val: `${previewMacros.carbs}g`,   color: 'text-amber-400'  },
                      { label: 'Fat',     val: `${previewMacros.fat}g`,     color: 'text-rose-400'   },
                    ].map(s => (
                      <div key={s.label}>
                        <p className={`font-bold text-base ${s.color}`}>{s.val}</p>
                        <p className="text-slate-600 text-xs">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button className="btn-primary flex-1" onClick={confirmScannedProduct}
                  disabled={!grams || Number(grams) <= 0}>
                  Add to Log
                </button>
                <button className="btn-ghost" onClick={() => { setProduct(null); setScanning(true) }}>
                  Re-scan
                </button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#22223a]" /></div>
                <div className="relative flex justify-center"><span className="bg-[#12121a] px-3 text-slate-600 text-xs">or enter manually</span></div>
              </div>
            </div>
          )}

          {/* ─ Manual entry form ─ */}
          <div className="space-y-3">
            <input className="input-dark" placeholder="Meal name (e.g. Chicken & rice)"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus={!product} />
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { key: 'kcal',    placeholder: 'Calories', unit: 'kcal' },
                { key: 'protein', placeholder: 'Protein',  unit: 'g'    },
                { key: 'carbs',   placeholder: 'Carbs',    unit: 'g'    },
                { key: 'fat',     placeholder: 'Fat',      unit: 'g'    },
              ].map(f => (
                <div className="relative" key={f.key}>
                  <input type="number" className="input-dark pr-12" placeholder={f.placeholder}
                    value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{f.unit}</span>
                </div>
              ))}
            </div>
            {formError && <p className="text-red-400 text-sm">{formError}</p>}
            <button className="btn-primary w-full" onClick={addManualMeal}>Add Meal</button>
          </div>
        </div>
      )}

      {/* ── Meal list ── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">
            Meals Today
            <span className="ml-2 text-slate-600 font-normal text-sm">({todayLogs.length})</span>
          </h3>
          {!showForm && (
            <button
              className="text-slate-500 hover:text-violet-400 transition-colors"
              title="Scan barcode"
              onClick={() => { setLookupError(''); setScanning(true) }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M3 7V4a1 1 0 0 1 1-1h3M17 3h3a1 1 0 0 1 1 1v3M21 17v3a1 1 0 0 1-1 1h-3M7 21H4a1 1 0 0 1-1-1v-3" strokeLinecap="round"/>
                <rect x="7" y="7" width="4" height="4" rx="0.5"/><rect x="13" y="7" width="4" height="4" rx="0.5"/>
                <rect x="7" y="13" width="4" height="4" rx="0.5"/><rect x="13" y="13" width="4" height="4" rx="0.5"/>
              </svg>
            </button>
          )}
        </div>
        {todayLogs.length === 0
          ? <p className="text-slate-600 text-sm text-center py-8">No meals logged yet — start fuelling!</p>
          : todayLogs.map(meal => (
            <div key={meal.id} className="flex items-center justify-between py-3 border-b border-[#1e1e30] last:border-0">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-slate-200 font-medium text-sm truncate">{meal.name}</p>
                <p className="text-slate-600 text-xs mt-0.5">
                  P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-violet-400 font-bold text-sm">{meal.kcal} kcal</span>
                <button onClick={() => del(meal.id)} className="text-slate-700 hover:text-red-400 transition-colors text-xl leading-none">×</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
