import { GOAL_LABELS, ACTIVITY_LABELS, SPORT_CONFIG } from '../utils/calculations'

function StatRow({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1e1e30] last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <div className="text-right">
        <span className="text-white font-semibold text-sm">{value}</span>
        {sub && <p className="text-slate-600 text-xs">{sub}</p>}
      </div>
    </div>
  )
}

export default function ProfileView({ profile, onReset, onUpdate }) {
  const goal     = GOAL_LABELS[profile.goal]
  const activity = ACTIVITY_LABELS[profile.activity]
  const bmi      = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)

  return (
    <div className="space-y-4">
      {/* Avatar & name */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4 mb-5">
          {profile.photo ? (
            <img src={profile.photo} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-violet-600/50" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-white font-bold text-xl">{profile.name}</h2>
            <p className="text-slate-400 text-sm capitalize">
              {profile.sex} · {profile.age} yrs · {profile.height} cm
            </p>
            <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${
              profile.goal === 'fat_loss'    ? 'bg-red-500/10 text-red-400' :
              profile.goal === 'muscle_gain' ? 'bg-violet-500/10 text-violet-400' :
              profile.goal === 'recomposition' ? 'bg-blue-500/10 text-blue-400' :
              'bg-green-500/10 text-green-400'
            }`}>
              {goal?.icon} {goal?.label}
            </div>
          </div>
        </div>

        <StatRow label="Current weight" value={`${profile.weight} kg`} />
        <StatRow label="Goal weight"    value={`${profile.goalWeight} kg`} sub={`${Math.abs(profile.goalWeight - profile.weight)} kg to go`} />
        <StatRow label="BMI"            value={bmi} />
        <StatRow label="Activity"       value={activity?.label} sub={activity?.desc} />
      </div>

      {/* Calorie & macro targets */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-3">Nutrition Targets</h3>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Calories', val: profile.calorieTarget, unit: 'kcal', color: 'text-violet-400' },
            { label: 'Protein', val: profile.macros.protein, unit: 'g', color: 'text-blue-400' },
            { label: 'Carbs', val: profile.macros.carbs, unit: 'g', color: 'text-amber-400' },
            { label: 'Fat', val: profile.macros.fat, unit: 'g', color: 'text-rose-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#1a1a28] rounded-xl p-3 text-center">
              <p className={`font-bold text-lg leading-none ${s.color}`}>{s.val}</p>
              <p className="text-slate-600 text-xs mt-0.5">{s.unit}</p>
              <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#1a1a28] rounded-xl p-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-slate-500 text-xs mb-0.5">BMR</p>
              <p className="text-slate-200 font-bold">{profile.bmr} kcal</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">TDEE</p>
              <p className="text-slate-200 font-bold">{profile.tdee} kcal</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Adjustment</p>
              <p className={`font-bold ${profile.calorieTarget > profile.tdee ? 'text-green-400' : profile.calorieTarget < profile.tdee ? 'text-amber-400' : 'text-slate-200'}`}>
                {profile.calorieTarget > profile.tdee ? '+' : ''}{profile.calorieTarget - profile.tdee} kcal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sleep target */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-3">Sleep Schedule</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-[#1a1a28] rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-1">Bedtime</p>
            <p className="text-violet-400 font-bold text-lg">{profile.recommendedBedtime}</p>
          </div>
          <div className="bg-[#1a1a28] rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-1">Sleep</p>
            <p className="text-green-400 font-bold text-lg">8h</p>
          </div>
          <div className="bg-[#1a1a28] rounded-xl p-3">
            <p className="text-slate-500 text-xs mb-1">Wake up</p>
            <p className="text-white font-bold text-lg">{profile.wakeTime}</p>
          </div>
        </div>
        <p className="text-slate-600 text-xs text-center mt-2">
          {profile.travelTime > 0
            ? `${profile.travelTime} min travel to ${profile.destination}`
            : `No travel time set`}
        </p>
      </div>

      {/* Sports */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-3">Your Sports</h3>
        <div className="flex flex-wrap gap-2">
          {profile.sports.map(id => {
            const s = SPORT_CONFIG[id]
            return (
              <span key={id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${s?.bg} ${s?.color}`}>
                {s?.icon} {s?.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Reset */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-1">Reset Profile</h3>
        <p className="text-slate-500 text-sm mb-4">
          Start the onboarding again to reconfigure your profile and recalculate targets. Your tracking data will be preserved.
        </p>
        <button
          onClick={() => {
            if (window.confirm('Reset your profile and redo setup?')) onReset()
          }}
          className="w-full py-3 rounded-xl border border-red-900/50 text-red-400 bg-red-900/10 hover:bg-red-900/20 font-semibold text-sm transition-colors"
        >
          Reset & Redo Onboarding
        </button>
      </div>
    </div>
  )
}
