import { GOAL_LABELS, ACTIVITY_LABELS, SPORT_CONFIG, getActivityLabel, ACTIVITY_LEVELS } from '../utils/calculations'

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

function goalBadgeClass(goal) {
  const cat = GOAL_LABELS[goal]?.category ?? (
    goal === 'fat_loss'    ? 'fat_loss'    :
    goal === 'muscle_gain' ? 'muscle_gain' :
    goal === 'recomposition' ? 'recomp'   : 'maintenance'
  )
  if (cat === 'fat_loss')    return 'bg-red-500/10 text-red-400'
  if (cat === 'muscle_gain') return 'bg-violet-500/10 text-violet-400'
  if (cat === 'recomp')      return 'bg-blue-500/10 text-blue-400'
  return 'bg-green-500/10 text-green-400'
}

function activityDisplay(profile) {
  // Current format: activityLevel key
  if (profile.activityLevel) {
    const lv = ACTIVITY_LEVELS[profile.activityLevel]
    return { label: lv?.label ?? profile.activityLevel, desc: lv?.desc ?? '' }
  }
  // Previous format: baseActivity (interim)
  if (profile.baseActivity) {
    return { label: profile.baseActivity.replace(/_/g, ' '), desc: `${profile.exerciseDays ?? 0}d/week exercise` }
  }
  // Older format: totalActiveDays
  if (profile.totalActiveDays !== undefined) {
    const lbl = getActivityLabel(profile.totalActiveDays)
    return {
      label: lbl.label,
      desc:  `${profile.trainingDays ?? 0}d training · ${profile.cardioDays ?? 0}d cardio · ${profile.sportsDays ?? 0}d sports`,
    }
  }
  // Legacy activity string
  const legacy = ACTIVITY_LABELS[profile.activity]
  return { label: legacy?.label ?? 'Unknown', desc: legacy?.desc ?? '' }
}

export default function ProfileView({ profile, googleUser, onReset, onUpdate, onLogOut }) {
  const goal     = GOAL_LABELS[profile.goal]
  const bmi      = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
  const activity = activityDisplay(profile)

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
            <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${goalBadgeClass(profile.goal)}`}>
              {goal?.icon} {goal?.label ?? profile.goal}
            </div>
          </div>
        </div>

        <StatRow label="Current weight" value={`${profile.weight} kg`} />
        <StatRow label="Goal weight"    value={`${profile.goalWeight} kg`} sub={`${Math.abs(profile.goalWeight - profile.weight)} kg to go`} />
        <StatRow label="BMI"            value={bmi} />
        <StatRow label="Activity"       value={activity.label} sub={activity.desc} />
      </div>

      {/* Calorie & macro targets */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-3">Nutrition Targets</h3>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Calories', val: profile.calorieTarget, unit: 'kcal', color: 'text-violet-400' },
            { label: 'Protein',  val: profile.macros.protein, unit: 'g',   color: 'text-blue-400'   },
            { label: 'Carbs',    val: profile.macros.carbs,   unit: 'g',   color: 'text-amber-400'  },
            { label: 'Fat',      val: profile.macros.fat,     unit: 'g',   color: 'text-rose-400'   },
          ].map(s => (
            <div key={s.label} className="bg-[#1a1a28] rounded-xl p-3 text-center">
              <p className={`font-bold text-lg leading-none ${s.color}`}>{s.val}</p>
              <p className="text-slate-600 text-xs mt-0.5">{s.unit}</p>
              <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* How it was calculated */}
        <div className="bg-[#1a1a28] rounded-xl p-4 space-y-2">
          <p className="text-slate-500 text-xs font-medium mb-1">Calorie breakdown</p>
          {[
            { label: 'BMR', val: `${profile.bmr} kcal`, color: 'text-slate-200' },
            {
              label: `TDEE ×${profile.multiplier ?? ACTIVITY_LEVELS[profile.activityLevel]?.multiplier ?? profile.activityMultiplier ?? '?'}`,
              val: `${profile.tdee} kcal`,
              color: 'text-slate-200',
            },
            {
              label: 'Goal adjustment',
              val: `${(profile.goalAdj ?? 0) > 0 ? '+' : ''}${profile.goalAdj ?? 0} kcal`,
              color: (profile.goalAdj ?? 0) < 0 ? 'text-red-400' : (profile.goalAdj ?? 0) > 0 ? 'text-green-400' : 'text-slate-500',
            },
          ].map(row => (
            <div key={row.label} className="flex justify-between">
              <span className="text-slate-500 text-xs">{row.label}</span>
              <span className={`text-xs font-semibold ${row.color}`}>{row.val}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t border-[#22223a]">
            <span className="text-slate-300 text-xs font-semibold">Target</span>
            <span className="text-violet-400 text-sm font-bold">{profile.calorieTarget} kcal</span>
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

      {/* Google account */}
      {googleUser && (
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-3">Google Account</h3>
          <div className="flex items-center gap-3 mb-4">
            {googleUser.photoURL
              ? <img src={googleUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
              : <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold">
                  {googleUser.displayName?.charAt(0) ?? '?'}
                </div>
            }
            <div>
              <p className="text-white font-medium text-sm">{googleUser.displayName}</p>
              <p className="text-slate-500 text-xs">{googleUser.email}</p>
            </div>
          </div>
          <button
            onClick={() => { if (window.confirm('Sign out of FitTrack?')) onLogOut() }}
            className="w-full py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-500 font-medium text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Reset */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-1">Reset Profile</h3>
        <p className="text-slate-500 text-sm mb-4">
          Start the onboarding again to reconfigure your profile and recalculate targets. Your tracking data will be preserved.
        </p>
        <button
          onClick={() => { if (window.confirm('Reset your profile and redo setup?')) onReset() }}
          className="w-full py-3 rounded-xl border border-red-900/50 text-red-400 bg-red-900/10 hover:bg-red-900/20 font-semibold text-sm transition-colors"
        >
          Reset &amp; Redo Onboarding
        </button>
      </div>
    </div>
  )
}
