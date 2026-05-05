import { useState } from 'react'
import {
  ACTIVITY_LABELS, GOAL_LABELS, buildProfile, calcRecommendedBedtime,
} from '../utils/calculations'

const ALL_SPORTS = [
  { id: 'gym',        label: 'Gym',        icon: '🏋️' },
  { id: 'basketball', label: 'Basketball', icon: '🏀' },
  { id: 'football',   label: 'Football',   icon: '⚽' },
  { id: 'swimming',   label: 'Swimming',   icon: '🏊' },
  { id: 'cycling',    label: 'Cycling',    icon: '🚴' },
  { id: 'running',    label: 'Running',    icon: '🏃' },
  { id: 'other',      label: 'Other',      icon: '⚡' },
]

const TOTAL_STEPS = 7

const EMPTY_DATA = {
  name: '', sex: 'male', age: '', height: '', weight: '', goalWeight: '',
  goal: '', activity: '', sports: [],
  wakeTime: '07:00', destination: 'work', travelTime: '30',
  photo: null,
}

function ProgressDots({ step }) {
  return (
    <div className="flex justify-center gap-1.5 py-3">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
          i === step ? 'w-7 bg-violet-500' : i < step ? 'w-1.5 bg-violet-700' : 'w-1.5 bg-[#22223a]'
        }`} />
      ))}
    </div>
  )
}

function StepWelcome({ data, update }) {
  return (
    <div className="flex flex-col items-center text-center pt-12 px-2">
      <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-6xl mb-6 shadow-2xl shadow-violet-900/50">
        💪
      </div>
      <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">FitTrack</h1>
      <p className="text-slate-400 text-lg mb-12">Your personalized health companion</p>
      <div className="w-full text-left">
        <label className="text-slate-400 text-sm mb-2 block font-medium">What's your name?</label>
        <input
          className="input-dark text-base"
          placeholder="Enter your name"
          value={data.name}
          onChange={e => update('name', e.target.value)}
          autoFocus
        />
      </div>
    </div>
  )
}

function StepBody({ data, update }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Your Body</h2>
      <p className="text-slate-400 text-sm mb-6">We'll calculate personalized targets based on your stats</p>

      <div className="mb-4">
        <label className="text-slate-400 text-xs font-medium mb-2 block">Sex</label>
        <div className="grid grid-cols-2 gap-2">
          {[{ id: 'male', label: '♂ Male' }, { id: 'female', label: '♀ Female' }].map(s => (
            <button key={s.id} onClick={() => update('sex', s.id)}
              className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                data.sex === s.id
                  ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                  : 'bg-[#1a1a28] border-[#22223a] text-slate-400 hover:border-slate-500'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {[
        { key: 'age', label: 'Age', placeholder: '25', unit: 'years', type: 'number' },
        { key: 'height', label: 'Height', placeholder: '175', unit: 'cm', type: 'number' },
        { key: 'weight', label: 'Current Weight', placeholder: '75', unit: 'kg', type: 'number', step: '0.1' },
        { key: 'goalWeight', label: 'Goal Weight', placeholder: '70', unit: 'kg', type: 'number', step: '0.1' },
      ].map(f => (
        <div className="mb-4" key={f.key}>
          <label className="text-slate-400 text-xs font-medium mb-1 block">{f.label}</label>
          <div className="relative">
            <input type={f.type} step={f.step} className="input-dark pr-16"
              placeholder={f.placeholder} value={data[f.key]}
              onChange={e => update(f.key, e.target.value)} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{f.unit}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function StepGoal({ data, update }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Your Goal</h2>
      <p className="text-slate-400 text-sm mb-6">What are you working towards?</p>
      <div className="space-y-3">
        {Object.entries(GOAL_LABELS).map(([id, g]) => (
          <button key={id} onClick={() => update('goal', id)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
              data.goal === id
                ? 'bg-violet-600/15 border-violet-500 ring-1 ring-violet-500/30'
                : 'bg-[#12121a] border-[#1e1e30] hover:border-[#2d2d4a]'
            }`}>
            <span className="text-3xl">{g.icon}</span>
            <div className="flex-1">
              <p className={`font-semibold text-sm ${data.goal === id ? 'text-violet-300' : 'text-white'}`}>{g.label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{g.desc}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              data.goal === id ? 'bg-violet-500 border-violet-500' : 'border-[#22223a]'
            }`}>
              {data.goal === id && <span className="text-white text-xs">✓</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepActivity({ data, update }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Activity Level</h2>
      <p className="text-slate-400 text-sm mb-6">How active are you on a typical week?</p>
      <div className="space-y-2">
        {Object.entries(ACTIVITY_LABELS).map(([id, a]) => (
          <button key={id} onClick={() => update('activity', id)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
              data.activity === id
                ? 'bg-violet-600/15 border-violet-500'
                : 'bg-[#12121a] border-[#1e1e30] hover:border-[#2d2d4a]'
            }`}>
            <span className="text-2xl w-8 text-center">{a.icon}</span>
            <div className="flex-1">
              <p className={`font-semibold text-sm ${data.activity === id ? 'text-violet-300' : 'text-white'}`}>{a.label}</p>
              <p className="text-slate-500 text-xs">{a.desc}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              data.activity === id ? 'bg-violet-500 border-violet-500' : 'border-[#22223a]'
            }`}>
              {data.activity === id && <span className="text-white text-xs">✓</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepSports({ data, update }) {
  const toggle = id => {
    const next = data.sports.includes(id)
      ? data.sports.filter(s => s !== id)
      : [...data.sports, id]
    update('sports', next)
  }
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Your Sports</h2>
      <p className="text-slate-400 text-sm mb-6">Select all activities you practice regularly</p>
      <div className="grid grid-cols-2 gap-2.5">
        {ALL_SPORTS.map(s => {
          const sel = data.sports.includes(s.id)
          return (
            <button key={s.id} onClick={() => toggle(s.id)}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                sel
                  ? 'bg-violet-600/15 border-violet-500 ring-1 ring-violet-500/20'
                  : 'bg-[#12121a] border-[#1e1e30] hover:border-[#2d2d4a]'
              }`}>
              <span className="text-2xl">{s.icon}</span>
              <span className={`text-sm font-semibold ${sel ? 'text-violet-300' : 'text-slate-300'}`}>{s.label}</span>
            </button>
          )
        })}
      </div>
      {data.sports.length === 0 && (
        <p className="text-amber-400/80 text-xs mt-4 text-center">Pick at least one sport to continue</p>
      )}
    </div>
  )
}

function StepSchedule({ data, update }) {
  const bedtime = data.wakeTime ? calcRecommendedBedtime(data.wakeTime) : null
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Your Schedule</h2>
      <p className="text-slate-400 text-sm mb-6">We'll set your optimal sleep target around your day</p>

      <div className="mb-4">
        <label className="text-slate-400 text-xs font-medium mb-1 block">Wake up time</label>
        <input type="time" className="input-dark text-lg font-semibold" value={data.wakeTime}
          onChange={e => update('wakeTime', e.target.value)} />
      </div>

      <div className="mb-4">
        <label className="text-slate-400 text-xs font-medium mb-2 block">Where do you need to be?</label>
        <div className="grid grid-cols-2 gap-2">
          {[{ id: 'school', label: '🏫 School' }, { id: 'work', label: '💼 Work' }].map(d => (
            <button key={d.id} onClick={() => update('destination', d.id)}
              className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                data.destination === d.id
                  ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                  : 'bg-[#1a1a28] border-[#22223a] text-slate-400'
              }`}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <label className="text-slate-400 text-xs font-medium mb-1 block">
          Travel time to {data.destination}
        </label>
        <div className="relative">
          <input type="number" className="input-dark pr-12" placeholder="30"
            value={data.travelTime} onChange={e => update('travelTime', e.target.value)} />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">min</span>
        </div>
      </div>

      {bedtime && (
        <div className="bg-[#1a1a28] border border-[#22223a] rounded-2xl p-4">
          <p className="text-slate-500 text-xs font-medium mb-3">Recommended sleep schedule</p>
          <div className="flex justify-around">
            <div className="text-center">
              <p className="text-slate-500 text-xs mb-1">Bedtime</p>
              <p className="text-violet-400 font-bold text-xl">{bedtime}</p>
            </div>
            <div className="text-center opacity-40">
              <p className="text-xs mb-1">&nbsp;</p>
              <p className="text-slate-400 font-bold text-xl">→</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-xs mb-1">Wake up</p>
              <p className="text-white font-bold text-xl">{data.wakeTime}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-xs mb-1">Sleep</p>
              <p className="text-green-400 font-bold text-xl">8h</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StepReview({ data, update }) {
  const preview = buildProfile(data)

  const handlePhoto = e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => update('photo', reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">You're all set, {data.name}!</h2>
      <p className="text-slate-400 text-sm mb-6">Here's your personalized plan</p>

      {/* Photo */}
      <div className="flex justify-center mb-6">
        <label className="cursor-pointer group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-[#22223a] group-hover:border-violet-500 flex items-center justify-center bg-[#1a1a28] transition-colors">
            {data.photo
              ? <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
              : <span className="text-3xl">📸</span>}
          </div>
          <p className="text-center text-slate-500 text-xs mt-1.5">Add photo (optional)</p>
          <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </label>
      </div>

      {/* Stats preview */}
      <div className="space-y-3">
        <div className="glass-card p-4">
          <p className="text-slate-500 text-xs font-medium mb-3">Daily Nutrition Targets</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Calories', val: preview.calorieTarget, unit: 'kcal', color: 'text-violet-400' },
              { label: 'Protein', val: preview.macros.protein, unit: 'g', color: 'text-blue-400' },
              { label: 'Carbs', val: preview.macros.carbs, unit: 'g', color: 'text-amber-400' },
              { label: 'Fat', val: preview.macros.fat, unit: 'g', color: 'text-rose-400' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`font-bold text-lg leading-none ${s.color}`}>{s.val}</p>
                <p className="text-slate-600 text-xs mt-0.5">{s.unit}</p>
                <p className="text-slate-500 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <p className="text-slate-500 text-xs font-medium mb-3">Sleep & Fitness</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-violet-400 font-bold text-base">{preview.recommendedBedtime}</p>
              <p className="text-slate-500 text-xs">Bedtime</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-bold text-base">{preview.tdee}</p>
              <p className="text-slate-500 text-xs">TDEE kcal</p>
            </div>
            <div className="text-center">
              <p className="text-amber-400 font-bold text-base">{Math.abs(preview.goalWeight - preview.startWeight)} kg</p>
              <p className="text-slate-500 text-xs">To goal</p>
            </div>
          </div>
        </div>

        <div className="bg-violet-900/20 border border-violet-700/30 rounded-2xl p-3 text-center">
          <p className="text-violet-300 text-sm">
            BMR <span className="font-bold">{preview.bmr}</span> kcal ·
            TDEE <span className="font-bold">{preview.tdee}</span> kcal ·
            Target <span className="font-bold">{preview.calorieTarget}</span> kcal
          </p>
          <p className="text-violet-400/60 text-xs mt-1">Calculated via Mifflin-St Jeor formula</p>
        </div>
      </div>
    </div>
  )
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState(EMPTY_DATA)

  const update = (key, val) => setData(d => ({ ...d, [key]: val }))

  const canProceed = () => {
    switch (step) {
      case 0: return data.name.trim().length > 0
      case 1: return !!(data.age && data.height && data.weight && data.goalWeight)
      case 2: return data.goal !== ''
      case 3: return data.activity !== ''
      case 4: return data.sports.length > 0
      case 5: return data.wakeTime !== ''
      default: return true
    }
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1)
    else onComplete(buildProfile(data))
  }

  const stepProps = { data, update }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Progress bar */}
      <div className="h-0.5 bg-[#1a1a28] fixed top-0 left-0 right-0 z-10">
        <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500"
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} />
      </div>

      <ProgressDots step={step} />

      {/* Step content */}
      <div key={step} className="flex-1 px-5 py-2 step-animate overflow-y-auto max-w-md mx-auto w-full">
        {step === 0 && <StepWelcome {...stepProps} />}
        {step === 1 && <StepBody {...stepProps} />}
        {step === 2 && <StepGoal {...stepProps} />}
        {step === 3 && <StepActivity {...stepProps} />}
        {step === 4 && <StepSports {...stepProps} />}
        {step === 5 && <StepSchedule {...stepProps} />}
        {step === 6 && <StepReview {...stepProps} />}
      </div>

      {/* Navigation */}
      <div className="px-5 pb-8 pt-4 flex gap-3 max-w-md mx-auto w-full">
        {step > 0 && (
          <button className="btn-ghost flex-1" onClick={() => setStep(s => s - 1)}>
            ← Back
          </button>
        )}
        <button
          className="btn-primary flex-1"
          disabled={!canProceed()}
          onClick={handleNext}
        >
          {step === TOTAL_STEPS - 1 ? '🚀 Start Tracking!' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
