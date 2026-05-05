import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

function toMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function sleepHours(bed, wake) {
  let w = toMin(wake)
  const b = toMin(bed)
  if (w <= b) w += 24 * 60
  return (w - b) / 60
}

function qualityBadge(h) {
  if (h >= 8)   return { label: 'Excellent', cls: 'text-green-400 bg-green-400/10' }
  if (h >= 7)   return { label: 'Good',      cls: 'text-blue-400  bg-blue-400/10'  }
  if (h >= 6)   return { label: 'Fair',      cls: 'text-amber-400 bg-amber-400/10' }
  return              { label: 'Poor',      cls: 'text-red-400   bg-red-400/10'   }
}

function SleepBar({ hours, target }) {
  const pct = Math.min((hours / target) * 100, 100)
  const over = hours > target
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-500">
        <span>0h</span>
        <span>{hours.toFixed(1)}h / {target}h target</span>
        <span>10h</span>
      </div>
      <div className="h-3 bg-[#1a1a28] rounded-full overflow-hidden">
        <div className={`h-full rounded-full bar-fill ${over ? 'bg-blue-400' : 'bg-violet-500'}`}
          style={{ width: `${Math.min((hours / 10) * 100, 100)}%` }} />
      </div>
    </div>
  )
}

export default function SleepTracker({ profile, userId }) {
  const targetBed  = profile.recommendedBedtime
  const targetWake = profile.wakeTime
  const targetH    = 8

  const [logs, setLogs] = useLocalStorage(`ft-${userId}-sleep`, [])
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    bed: targetBed,
    wake: targetWake,
  })
  const [error, setError] = useState('')

  const add = () => {
    if (!form.date)              return setError('Select a date')
    if (logs.find(l => l.date === form.date)) return setError('Entry for this date already exists')
    setLogs([{ ...form, id: Date.now() }, ...logs])
    setForm({ date: new Date().toISOString().split('T')[0], bed: targetBed, wake: targetWake })
    setError('')
  }

  const del = id => setLogs(logs.filter(l => l.id !== id))

  const todayEntry = logs.find(l => l.date === new Date().toISOString().split('T')[0])
  const last7 = logs.slice(0, 7)
  const avg = last7.length
    ? last7.reduce((s, e) => s + sleepHours(e.bed, e.wake), 0) / last7.length
    : 0
  const hits = last7.filter(e => e.bed <= targetBed && sleepHours(e.bed, e.wake) >= targetH).length

  const previewHours = form.bed && form.wake ? sleepHours(form.bed, form.wake) : null

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="glass-card p-5">
        <h2 className="text-white font-bold text-lg mb-4">Sleep Tracker</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="stat-card">
            <p className="text-slate-500 text-xs mb-1">Target</p>
            <p className="text-white font-bold">{targetH}h</p>
            <p className="text-slate-600 text-xs">{targetBed}–{targetWake}</p>
          </div>
          <div className="stat-card">
            <p className="text-slate-500 text-xs mb-1">7-day avg</p>
            <p className={`font-bold text-lg ${avg >= 8 ? 'text-green-400' : avg >= 7 ? 'text-blue-400' : 'text-amber-400'}`}>
              {last7.length ? avg.toFixed(1) + 'h' : '—'}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-slate-500 text-xs mb-1">Target hits</p>
            <p className="text-green-400 font-bold text-lg">{hits}/{last7.length || '—'}</p>
            <p className="text-slate-600 text-xs">last 7 days</p>
          </div>
        </div>

        {todayEntry && (
          <div className="bg-violet-600/10 border border-violet-600/30 rounded-xl p-3.5 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-300 text-sm font-semibold">Tonight logged</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {todayEntry.bed} → {todayEntry.wake} · {sleepHours(todayEntry.bed, todayEntry.wake).toFixed(1)}h
                </p>
              </div>
              <span className="text-2xl">
                {sleepHours(todayEntry.bed, todayEntry.wake) >= 8 ? '😴' : '⚠️'}
              </span>
            </div>
            <div className="mt-3">
              <SleepBar hours={sleepHours(todayEntry.bed, todayEntry.wake)} target={targetH} />
            </div>
          </div>
        )}

        {/* 7-day sleep bars */}
        {last7.length > 0 && (
          <div className="space-y-2">
            <p className="text-slate-500 text-xs font-medium">Recent nights</p>
            {last7.map(e => {
              const h = sleepHours(e.bed, e.wake)
              const hit = e.bed <= targetBed && h >= targetH
              const badge = qualityBadge(h)
              return (
                <div key={e.id} className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs w-20 flex-shrink-0">
                    {new Date(e.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-2 bg-[#1a1a28] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${h >= targetH ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min((h / 10) * 100, 100)}%` }} />
                  </div>
                  <span className="text-slate-300 text-xs font-bold w-10 text-right">{h.toFixed(1)}h</span>
                  <span className="text-base">{hit ? '✅' : '❌'}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Log form */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-4">Log Sleep</h3>
        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-xs font-medium mb-1 block">Date</label>
            <input type="date" className="input-dark" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1 block">Bedtime</label>
              <input type="time" className="input-dark" value={form.bed}
                onChange={e => setForm({ ...form, bed: e.target.value })} />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1 block">Wake time</label>
              <input type="time" className="input-dark" value={form.wake}
                onChange={e => setForm({ ...form, wake: e.target.value })} />
            </div>
          </div>

          {previewHours !== null && (
            <div className="bg-[#1a1a28] rounded-xl p-3 flex items-center justify-between">
              <span className="text-slate-400 text-sm">Sleep duration</span>
              <span className={`font-bold text-lg ${previewHours >= targetH ? 'text-green-400' : 'text-amber-400'}`}>
                {previewHours.toFixed(1)}h
              </span>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button className="btn-primary w-full" onClick={add}>+ Log Sleep</button>
        </div>
      </div>

      {/* History */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-3">
          History
          <span className="ml-2 text-slate-600 font-normal text-sm">({logs.length})</span>
        </h3>
        {logs.length === 0
          ? <p className="text-slate-600 text-sm text-center py-8">No sleep logged yet.</p>
          : logs.slice(0, 14).map(e => {
            const h = sleepHours(e.bed, e.wake)
            const hit = e.bed <= targetBed && h >= targetH
            const badge = qualityBadge(h)
            return (
              <div key={e.id} className="flex items-center justify-between py-3 border-b border-[#1e1e30] last:border-0">
                <div>
                  <p className="text-slate-200 text-sm font-medium">
                    {new Date(e.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-slate-600 text-xs">{e.bed} → {e.wake}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <p className="text-slate-200 font-bold text-sm">{h.toFixed(1)}h</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <span title={hit ? 'Hit target' : 'Missed target'}>{hit ? '✅' : '❌'}</span>
                  <button onClick={() => del(e.id)} className="text-slate-700 hover:text-red-400 transition-colors text-xl leading-none">×</button>
                </div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}
