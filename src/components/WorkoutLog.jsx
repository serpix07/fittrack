import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { SPORT_CONFIG, MUSCLE_GROUPS } from '../utils/calculations'

function getWeekDates() {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export default function WorkoutLog({ profile }) {
  const sports = profile.sports || ['gym']
  const availableTypes = sports.map(id => ({ id, ...SPORT_CONFIG[id] })).filter(Boolean)

  const [sessions, setSessions] = useLocalStorage('ft-workouts', [])
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: sports[0] || 'gym',
    duration: '60',
    muscleGroup: '',
    distance: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const add = () => {
    if (!form.duration) return setError('Enter session duration')
    setSessions([{ ...form, id: Date.now() }, ...sessions])
    setForm({ ...form, muscleGroup: '', distance: '', notes: '' })
    setError('')
    setShowForm(false)
  }
  const del = id => setSessions(sessions.filter(s => s.id !== id))

  const weekDates = getWeekDates()
  const today = new Date().toISOString().split('T')[0]
  const weekSessions = sessions.filter(s => weekDates.includes(s.date))
  const totalWeekMin = weekSessions.reduce((a, s) => a + Number(s.duration), 0)

  let streak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (sessions.find(s => s.date === ds)) streak++
    else if (i > 0) break
  }

  const currentType = SPORT_CONFIG[form.type]

  return (
    <div className="space-y-4">
      {/* Weekly summary */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">This Week</h2>
          <span className="text-slate-500 text-sm">{weekSessions.length} sessions</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="stat-card">
            <p className="text-slate-500 text-xs mb-1">Time</p>
            <p className="text-white font-bold text-lg leading-tight">
              {Math.floor(totalWeekMin / 60)}h{totalWeekMin % 60 > 0 ? ` ${totalWeekMin % 60}m` : ''}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-slate-500 text-xs mb-1">Sessions</p>
            <p className="text-violet-400 font-bold text-lg">{weekSessions.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-slate-500 text-xs mb-1">Streak</p>
            <p className="text-amber-400 font-bold text-lg">{streak} 🔥</p>
          </div>
        </div>

        {/* Week calendar */}
        <div className="grid grid-cols-7 gap-1 mb-5">
          {weekDates.map(date => {
            const daySessions = sessions.filter(s => s.date === date)
            const isToday = date === today
            return (
              <div key={date} className={`rounded-xl p-1.5 text-center transition-all ${
                isToday ? 'ring-1 ring-violet-500' : ''
              } ${daySessions.length > 0 ? 'bg-violet-600/20' : 'bg-[#1a1a28]'}`}>
                <p className={`text-xs mb-0.5 ${isToday ? 'text-violet-400' : 'text-slate-600'}`}>
                  {new Date(date + 'T12:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                </p>
                <p className={`text-sm font-bold ${isToday ? 'text-white' : 'text-slate-400'}`}>
                  {new Date(date + 'T12:00').getDate()}
                </p>
                <div className="flex flex-wrap justify-center gap-px mt-1 min-h-[14px]">
                  {daySessions.map(s => (
                    <span key={s.id} className="text-[10px] leading-none">{SPORT_CONFIG[s.type]?.icon}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Per-sport breakdown */}
        <div className="space-y-2">
          {availableTypes.map(t => {
            const count = weekSessions.filter(s => s.type === t.id).length
            const mins  = weekSessions.filter(s => s.type === t.id).reduce((a, s) => a + Number(s.duration), 0)
            return (
              <div key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{t.icon}</span>
                  <span className={`text-sm font-medium ${t.color}`}>{t.label}</span>
                </div>
                <span className="text-slate-500 text-sm">
                  {count} session{count !== 1 ? 's' : ''}{mins > 0 ? ` · ${mins}min` : ''}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Log form */}
      {!showForm ? (
        <button className="btn-primary w-full" onClick={() => setShowForm(true)}>
          + Log Session
        </button>
      ) : (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Log Session</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1 block">Date</label>
              <input type="date" className="input-dark" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>

            {/* Sport type selector */}
            <div>
              <label className="text-slate-400 text-xs font-medium mb-2 block">Sport</label>
              <div className={`grid gap-2 ${availableTypes.length <= 2 ? 'grid-cols-2' : availableTypes.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {availableTypes.map(t => (
                  <button key={t.id} onClick={() => setForm({ ...form, type: t.id })}
                    className={`py-3 rounded-xl border text-sm font-semibold flex flex-col items-center gap-1 transition-all ${
                      form.type === t.id ? `${t.bg} ${t.color}` : 'bg-[#1a1a28] border-[#22223a] text-slate-400 hover:border-slate-500'
                    }`}>
                    <span className="text-xl">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1 block">Duration</label>
              <div className="relative">
                <input type="number" className="input-dark pr-12" placeholder="60"
                  value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">min</span>
              </div>
            </div>

            {/* Gym: muscle group */}
            {form.type === 'gym' && (
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1 block">Muscle Group / Focus</label>
                <select className="input-dark bg-[#1a1a28]"
                  value={form.muscleGroup}
                  onChange={e => setForm({ ...form, muscleGroup: e.target.value })}>
                  <option value="">Select muscle group…</option>
                  {MUSCLE_GROUPS.map(mg => <option key={mg} value={mg}>{mg}</option>)}
                </select>
              </div>
            )}

            {/* Distance sports */}
            {currentType?.extra?.includes('distance') && (
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1 block">Distance</label>
                <div className="relative">
                  <input type="number" step="0.1" className="input-dark pr-8" placeholder="5"
                    value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">km</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-slate-400 text-xs font-medium mb-1 block">Notes (optional)</label>
              <input className="input-dark" placeholder="How was the session?"
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button className="btn-primary w-full" onClick={add}>Add Session</button>
          </div>
        </div>
      )}

      {/* Session history */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-3">
          All Sessions
          <span className="ml-2 text-slate-600 font-normal text-sm">({sessions.length})</span>
        </h3>
        {sessions.length === 0
          ? <p className="text-slate-600 text-sm text-center py-8">No sessions yet — get moving! 💪</p>
          : sessions.slice(0, 20).map(s => {
            const t = SPORT_CONFIG[s.type]
            return (
              <div key={s.id} className="flex items-center justify-between py-3 border-b border-[#1e1e30] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{t?.icon}</span>
                  <div>
                    <p className="text-slate-200 text-sm font-medium">
                      {new Date(s.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      <span className={`ml-2 text-xs font-semibold ${t?.color}`}>{t?.label}</span>
                    </p>
                    {s.muscleGroup && <p className="text-slate-600 text-xs">{s.muscleGroup}</p>}
                    {s.distance    && <p className="text-slate-600 text-xs">{s.distance}km</p>}
                    {s.notes       && <p className="text-slate-600 text-xs italic">{s.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${t?.bg} ${t?.color}`}>
                    {s.duration}min
                  </span>
                  <button onClick={() => del(s.id)} className="text-slate-700 hover:text-red-400 transition-colors text-xl leading-none">×</button>
                </div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}
