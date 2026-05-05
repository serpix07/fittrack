import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const today = () => new Date().toISOString().split('T')[0]

function MacroBar({ label, current, goal, colorFull, colorOver, unit = 'g' }) {
  const pct = Math.min((current / goal) * 100, 100)
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
          className={`h-full rounded-full bar-fill ${over ? colorOver : colorFull}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function NutritionTracker({ profile }) {
  const goals = { kcal: profile.calorieTarget, ...profile.macros }
  const [logs, setLogs] = useLocalStorage('ft-nutrition', {})
  const [form, setForm] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' })
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const todayLogs = logs[today()] || []
  const totals = todayLogs.reduce(
    (a, m) => ({ kcal: a.kcal + m.kcal, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )
  const remaining = {
    kcal: goals.kcal - totals.kcal,
    protein: goals.protein - totals.protein,
  }

  const addMeal = () => {
    if (!form.name.trim()) return setError('Enter a meal name')
    if (!form.kcal || !form.protein || !form.carbs || !form.fat) return setError('Fill in all macro values')
    const meal = {
      id: Date.now(), name: form.name.trim(),
      kcal: Number(form.kcal), protein: Number(form.protein),
      carbs: Number(form.carbs), fat: Number(form.fat),
    }
    setLogs({ ...logs, [today()]: [...todayLogs, meal] })
    setForm({ name: '', kcal: '', protein: '', carbs: '', fat: '' })
    setError('')
    setShowForm(false)
  }

  const del = id => setLogs({ ...logs, [today()]: todayLogs.filter(m => m.id !== id) })

  const calPct = Math.min((totals.kcal / goals.kcal) * 100, 100)

  return (
    <div className="space-y-4">
      {/* Header card */}
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

        {/* Calorie arc-style progress */}
        <div className="relative mb-5">
          <div className="h-3 bg-[#1a1a28] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 bar-fill"
              style={{ width: `${calPct}%` }} />
          </div>
          <div className="absolute right-0 top-5 text-xs text-slate-500">
            {remaining.kcal >= 0 ? `${remaining.kcal} left` : `${Math.abs(remaining.kcal)} over`}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="bg-[#1a1a28] rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-0.5">Kcal remaining</p>
            <p className={`text-xl font-bold ${remaining.kcal < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {remaining.kcal}
            </p>
          </div>
          <div className="bg-[#1a1a28] rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-0.5">Protein left</p>
            <p className={`text-xl font-bold ${remaining.protein < 0 ? 'text-red-400' : 'text-blue-400'}`}>
              {remaining.protein}g
            </p>
          </div>
        </div>

        <div className="space-y-3.5">
          <MacroBar label="Calories" current={totals.kcal} goal={goals.kcal} colorFull="bg-violet-500" colorOver="bg-red-500" unit=" kcal" />
          <MacroBar label="Protein"  current={totals.protein} goal={goals.protein} colorFull="bg-blue-500"   colorOver="bg-red-500" />
          <MacroBar label="Carbs"    current={totals.carbs}   goal={goals.carbs}   colorFull="bg-amber-500"  colorOver="bg-red-500" />
          <MacroBar label="Fat"      current={totals.fat}     goal={goals.fat}     colorFull="bg-rose-500"   colorOver="bg-red-500" />
        </div>
      </div>

      {/* Add meal */}
      {!showForm ? (
        <button className="btn-primary w-full" onClick={() => setShowForm(true)}>
          + Log a Meal
        </button>
      ) : (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Log a Meal</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
          </div>
          <div className="space-y-3">
            <input className="input-dark" placeholder="Meal name (e.g. Chicken & rice)"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { key: 'kcal', placeholder: 'Calories', unit: 'kcal' },
                { key: 'protein', placeholder: 'Protein', unit: 'g' },
                { key: 'carbs', placeholder: 'Carbs', unit: 'g' },
                { key: 'fat', placeholder: 'Fat', unit: 'g' },
              ].map(f => (
                <div className="relative" key={f.key}>
                  <input type="number" className="input-dark pr-12" placeholder={f.placeholder}
                    value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{f.unit}</span>
                </div>
              ))}
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button className="btn-primary w-full" onClick={addMeal}>Add Meal</button>
          </div>
        </div>
      )}

      {/* Meal list */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-3">
          Meals Today
          <span className="ml-2 text-slate-600 font-normal text-sm">({todayLogs.length})</span>
        </h3>
        {todayLogs.length === 0
          ? <p className="text-slate-600 text-sm text-center py-8">No meals logged yet — start fuelling!</p>
          : todayLogs.map(meal => (
            <div key={meal.id} className="flex items-center justify-between py-3 border-b border-[#1e1e30] last:border-0">
              <div>
                <p className="text-slate-200 font-medium text-sm">{meal.name}</p>
                <p className="text-slate-600 text-xs mt-0.5">
                  P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
                </p>
              </div>
              <div className="flex items-center gap-3">
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
