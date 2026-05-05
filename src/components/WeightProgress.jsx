import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { useLocalStorage } from '../hooks/useLocalStorage'

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000)
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a28] border border-[#22223a] rounded-xl p-3 text-sm shadow-2xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-violet-400 font-bold">{payload[0].value} kg</p>
    </div>
  )
}

export default function WeightProgress({ profile }) {
  const START   = profile.startWeight
  const GOAL    = profile.goalWeight
  const START_D = profile.startDate
  const TARGET_DATE_OBJ = new Date(START_D)
  TARGET_DATE_OBJ.setDate(TARGET_DATE_OBJ.getDate() + 90)
  const TARGET_DATE = TARGET_DATE_OBJ.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const [entries, setEntries] = useLocalStorage('ft-weight', [
    { id: 0, date: START_D, weight: START }
  ])
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], weight: '' })
  const [error, setError] = useState('')

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted[sorted.length - 1]

  const lost  = START - (latest?.weight ?? START)
  const toGo  = (latest?.weight ?? START) - GOAL
  const pct   = Math.min(Math.max((lost / (START - GOAL)) * 100, 0), 100)

  const add = () => {
    if (!form.weight) return setError('Enter your weight')
    const w = Number(form.weight)
    if (w < 30 || w > 300) return setError('Enter a valid weight')
    if (entries.find(e => e.date === form.date)) return setError('Entry for this date already exists')
    setEntries([...entries, { date: form.date, weight: w, id: Date.now() }])
    setForm({ ...form, weight: '' })
    setError('')
  }
  const del = id => { if (id !== 0) setEntries(entries.filter(e => e.id !== id)) }

  const chartData = sorted.map(e => {
    const daysIn = daysBetween(START_D, e.date)
    const target = Math.max(START - (daysIn / 90) * (START - GOAL), GOAL)
    return {
      date: new Date(e.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: e.weight,
      target: Math.round(target * 10) / 10,
    }
  })

  const last7 = sorted.slice(-7)
  let trend = null
  if (last7.length >= 2) {
    const diffs = last7.slice(1).map((e, i) => e.weight - last7[i].weight)
    trend = diffs.reduce((a, b) => a + b, 0) / diffs.length
  }

  const bmi = latest ? (latest.weight / ((profile.height / 100) ** 2)).toFixed(1) : null

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="glass-card p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-lg">Weight Progress</h2>
            <p className="text-slate-500 text-sm">Target: {GOAL} kg by {TARGET_DATE}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-white">{latest?.weight ?? START}</p>
            <p className="text-slate-600 text-xs">kg current</p>
            {bmi && <p className="text-slate-500 text-xs mt-0.5">BMI {bmi}</p>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>{START} kg</span>
            <span className="text-violet-400 font-semibold">{pct.toFixed(0)}% to goal</span>
            <span>{GOAL} kg</span>
          </div>
          <div className="h-4 bg-[#1a1a28] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full bar-fill"
              style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="stat-card">
            <p className="text-slate-500 text-xs mb-1">Lost</p>
            <p className="text-green-400 font-bold text-xl">−{Math.max(lost, 0).toFixed(1)}</p>
            <p className="text-slate-600 text-xs">kg</p>
          </div>
          <div className="stat-card">
            <p className="text-slate-500 text-xs mb-1">To go</p>
            <p className="text-amber-400 font-bold text-xl">{Math.max(toGo, 0).toFixed(1)}</p>
            <p className="text-slate-600 text-xs">kg</p>
          </div>
          <div className="stat-card">
            <p className="text-slate-500 text-xs mb-1">7-day trend</p>
            <p className={`font-bold text-xl ${trend === null ? 'text-slate-400' : trend <= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend === null ? '—' : (trend > 0 ? '+' : '') + trend.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-4">Weight Chart</h3>
        {chartData.length < 2 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-sm">Log at least 2 entries to see your chart</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" />
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={{ stroke: '#1e1e30' }} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#475569', fontSize: 10 }} axisLine={{ stroke: '#1e1e30' }}
                tickLine={false} tickFormatter={v => `${v}kg`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={GOAL} stroke="#22c55e" strokeDasharray="4 4"
                label={{ value: 'Goal', fill: '#22c55e', fontSize: 10, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="target" stroke="#4338ca" strokeDasharray="5 3"
                strokeWidth={1.5} dot={false} name="Target pace" />
              <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2.5}
                dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#a78bfa', strokeWidth: 0 }} name="Weight" />
            </LineChart>
          </ResponsiveContainer>
        )}
        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-violet-500 rounded inline-block"></span>Actual</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-indigo-600 rounded inline-block opacity-60"></span>Target pace</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-green-500 rounded inline-block"></span>Goal</span>
        </div>
      </div>

      {/* Log weight */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-4">Log Weight</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1 block">Date</label>
              <input type="date" className="input-dark" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1 block">Weight</label>
              <div className="relative">
                <input type="number" step="0.1" className="input-dark pr-8" placeholder="e.g. 87.5"
                  value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">kg</span>
              </div>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button className="btn-primary w-full" onClick={add}>+ Log Weight</button>
        </div>
      </div>

      {/* History */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-3">
          History
          <span className="ml-2 text-slate-600 font-normal text-sm">({sorted.length})</span>
        </h3>
        {[...sorted].reverse().map((entry, i, arr) => {
          const prev = arr[i + 1]
          const diff = prev ? entry.weight - prev.weight : null
          return (
            <div key={entry.id} className="flex items-center justify-between py-3 border-b border-[#1e1e30] last:border-0">
              <div>
                <p className="text-slate-200 text-sm font-medium">
                  {new Date(entry.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                {entry.id === 0 && <span className="text-violet-400 text-xs">Starting weight</span>}
              </div>
              <div className="flex items-center gap-3">
                {diff !== null && (
                  <span className={`text-sm font-medium ${diff < 0 ? 'text-green-400' : diff > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                  </span>
                )}
                <span className="text-white font-bold">{entry.weight} kg</span>
                {entry.id !== 0 && (
                  <button onClick={() => del(entry.id)} className="text-slate-700 hover:text-red-400 transition-colors text-xl leading-none">×</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
