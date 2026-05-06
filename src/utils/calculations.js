// ─── Activity multipliers (based on total active days/week) ──────────────────

export function getActivityMultiplier(totalDays) {
  if (totalDays === 0) return 1.2
  if (totalDays <= 2)  return 1.375
  if (totalDays <= 4)  return 1.55
  if (totalDays <= 6)  return 1.65
  return 1.725
}

export function getActivityLabel(totalDays) {
  if (totalDays === 0) return { label: 'Sedentary',   icon: '🪑', desc: 'Little to no exercise' }
  if (totalDays <= 2)  return { label: 'Light',        icon: '🚶', desc: `${totalDays}x/week active` }
  if (totalDays <= 4)  return { label: 'Moderate',     icon: '🏃', desc: `${totalDays}x/week active` }
  if (totalDays <= 6)  return { label: 'Active',       icon: '💪', desc: `${totalDays}x/week active` }
  return                      { label: 'Very Active',  icon: '🏆', desc: 'Daily / twice-a-day' }
}

// Legacy ACTIVITY_LABELS kept so old-format profiles still display correctly in Profile view
export const ACTIVITY_LABELS = {
  sedentary: { label: 'Sedentary', icon: '🪑', desc: 'Desk job, little to no exercise', multiplier: 1.2   },
  light:     { label: 'Light',     icon: '🚶', desc: '1–3 workouts per week',           multiplier: 1.375 },
  moderate:  { label: 'Moderate',  icon: '🏃', desc: '3–5 workouts per week',           multiplier: 1.55  },
  high:      { label: 'High',      icon: '💪', desc: '6–7 workouts per week',           multiplier: 1.65  },
  very_high: { label: 'Very High', icon: '🏆', desc: 'Athlete / twice-a-day training',  multiplier: 1.725 },
}

// ─── New: base lifestyle activity (without exercise) ─────────────────────────

export const BASE_ACTIVITY_LABELS = {
  sedentary:         { label: 'Sedentary',         icon: '🪑', desc: 'Desk job, mostly sitting',               multiplier: 1.2   },
  lightly_active:    { label: 'Lightly active',    icon: '🚶', desc: 'Teacher, retail, some walking',          multiplier: 1.375 },
  moderately_active: { label: 'Moderately active', icon: '🏃', desc: 'Construction, nurse, lots of walking',   multiplier: 1.55  },
  very_active:       { label: 'Very active',       icon: '💪', desc: 'Physical labor, delivery, on feet all day', multiplier: 1.725 },
}

// Additional kcal/day from intentional exercise — indexed by days per week (0–7)
export const EXERCISE_BONUS_TABLE = [0, 100, 100, 200, 200, 300, 300, 400]

// ─── Goal labels ──────────────────────────────────────────────────────────────

export const GOAL_LABELS = {
  fat_loss_slow: {
    label: 'Fat Loss — Slow', icon: '🔥',
    desc: '−250 kcal/day · ~0.25 kg/week loss',
    adj: -250, weeklyChange: -0.25, category: 'fat_loss',
  },
  fat_loss_moderate: {
    label: 'Fat Loss — Moderate', icon: '🔥',
    desc: '−500 kcal/day · ~0.5 kg/week loss',
    adj: -500, weeklyChange: -0.5, category: 'fat_loss',
  },
  fat_loss_aggressive: {
    label: 'Fat Loss — Aggressive', icon: '🔥',
    desc: '−750 kcal/day · ~0.75 kg/week loss',
    adj: -750, weeklyChange: -0.75, category: 'fat_loss',
    warn: true,
    warnText: 'This is a hard cut. Only recommended short term.',
  },
  muscle_gain_lean: {
    label: 'Lean Bulk', icon: '💪',
    desc: '+200 kcal/day · ~0.25 kg/week gain',
    adj: 200, weeklyChange: 0.25, category: 'muscle_gain',
  },
  muscle_gain_standard: {
    label: 'Standard Bulk', icon: '💪',
    desc: '+350 kcal/day · ~0.5 kg/week gain',
    adj: 350, weeklyChange: 0.5, category: 'muscle_gain',
  },
  recomp_slow: {
    label: 'Recomp — Slow', icon: '⚡',
    desc: '−100 kcal/day · Minimal deficit',
    adj: -100, weeklyChange: 0, category: 'recomp',
    note: 'Minimal deficit. Maximum muscle preservation. Best for advanced lifters.',
  },
  recomp_standard: {
    label: 'Recomp — Standard', icon: '⚡',
    desc: '−250 kcal/day · Balanced approach',
    adj: -250, weeklyChange: 0, category: 'recomp',
    note: 'Balanced approach. Lose fat and gain muscle simultaneously.',
  },
  recomp_aggressive: {
    label: 'Recomp — Aggressive', icon: '⚡',
    desc: '−400 kcal/day · Faster fat loss',
    adj: -400, weeklyChange: 0, category: 'recomp',
    note: 'Faster fat loss. Harder to maintain muscle. Best for beginners with higher body fat.',
  },
  // Legacy key — old saved profiles
  recomposition: {
    label: 'Body Recomp', icon: '⚡',
    desc: 'Lose fat & gain muscle simultaneously',
    adj: -250, weeklyChange: 0, category: 'recomp',
    note: 'Recomposition = small deficit + high protein.',
  },
  maintenance: {
    label: 'Maintenance', icon: '⚖️',
    desc: 'Maintain current body composition',
    adj: 0, weeklyChange: 0, category: 'maintenance',
  },
  // Legacy keys so old saved profiles still render
  fat_loss:    { label: 'Fat Loss',    icon: '🔥', desc: 'Reduce body fat',  adj: -400, weeklyChange: -0.35, category: 'fat_loss'    },
  muscle_gain: { label: 'Muscle Gain', icon: '💪', desc: 'Build muscle',     adj:  250, weeklyChange:  0.2,  category: 'muscle_gain' },
}

// ─── Per-goal protein multiplier (g per kg bodyweight) ───────────────────────

const GOAL_PROTEIN_MULTIPLIER = {
  fat_loss_slow:        2.0,
  fat_loss_moderate:    2.0,
  fat_loss_aggressive:  2.2,
  recomp_slow:          2.0,
  recomp_standard:      2.2,
  recomp_aggressive:    2.4,
  muscle_gain_lean:     2.0,
  muscle_gain_standard: 1.8,
  maintenance:          1.6,
  // legacy
  recomposition: 2.2,
  fat_loss:      2.0,
  muscle_gain:   2.0,
}

// ─── Sport bonus (kcal per session, used in daily average) ───────────────────

const SPORT_KCAL_PER_SESSION = {
  gym:        50,
  basketball: 80,
  football:   80,
  running:    100,
  swimming:   90,
  cycling:    90,
  other:      60,
}

// ─── Sport config (used by WorkoutLog + Profile) ──────────────────────────────

export const SPORT_CONFIG = {
  gym:        { label: 'Gym',        icon: '🏋️', color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/30', extra: ['muscleGroup'] },
  basketball: { label: 'Basketball', icon: '🏀', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30', extra: [] },
  football:   { label: 'Football',   icon: '⚽', color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/30',   extra: [] },
  swimming:   { label: 'Swimming',   icon: '🏊', color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/30',     extra: ['distance'] },
  cycling:    { label: 'Cycling',    icon: '🚴', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', extra: ['distance'] },
  running:    { label: 'Running',    icon: '🏃', color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/30',       extra: ['distance'] },
  other:      { label: 'Other',      icon: '⚡', color: 'text-slate-400',  bg: 'bg-slate-400/10 border-slate-400/30',   extra: [] },
}

export const MUSCLE_GROUPS = [
  'Push — Chest · Shoulders · Triceps',
  'Pull — Back · Biceps',
  'Legs — Quads · Hamstrings · Glutes',
  'Upper Body', 'Lower Body', 'Core & Abs', 'Full Body',
  'Arms', 'Chest', 'Back', 'Shoulders',
]

// ─── Core calculations ────────────────────────────────────────────────────────

export function calcBMR({ sex, age, height, weight }) {
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(sex === 'male' ? base + 5 : base - 161)
}

// Returns { baseTDEE, exerciseBonus, sportBonus, total }
export function calcTDEE(bmr, { baseActivity = 'sedentary', exerciseDays = 0, sportsDays = 0, sports = [] } = {}) {
  const multiplier    = BASE_ACTIVITY_LABELS[baseActivity]?.multiplier ?? 1.2
  const baseTDEE      = Math.round(bmr * multiplier)
  const exerciseBonus = EXERCISE_BONUS_TABLE[Math.min(7, Math.max(0, Number(exerciseDays)))] ?? 0

  const sportList = Array.isArray(sports) ? sports : []
  const avgKcalPerSession = sportList.length > 0
    ? sportList.reduce((sum, s) => sum + (SPORT_KCAL_PER_SESSION[s] ?? 60), 0) / sportList.length
    : 0
  const sportBonus = Math.round((avgKcalPerSession * Math.max(0, Number(sportsDays))) / 7)

  const total = baseTDEE + exerciseBonus + sportBonus
  return { baseTDEE, exerciseBonus, sportBonus, total }
}

export function calcCalorieTarget(tdee, goal) {
  return Math.max(1200, tdee + (GOAL_LABELS[goal]?.adj ?? 0))
}

// Macros — per-goal protein, min 0.8 g/kg fat, remainder → carbs
export function calcMacros(weight, calorieTarget, goal = 'maintenance') {
  const proteinMultiplier = GOAL_PROTEIN_MULTIPLIER[goal] ?? 2.0

  // Fat: minimum 0.8 g/kg, never lower
  const fat     = Math.round(weight * 0.8)
  const fatKcal = fat * 9

  // Protein: target multiplier, but cap so ≥50g carbs remain
  const maxProteinKcal = Math.max(0, calorieTarget - fatKcal - 50 * 4)
  const protein = Math.min(
    Math.round(weight * proteinMultiplier),
    Math.max(50, Math.round(maxProteinKcal / 4))
  )
  const proteinKcal = protein * 4

  // Carbs: everything that's left
  const carbs = Math.max(0, Math.round((calorieTarget - proteinKcal - fatKcal) / 4))

  return { protein, carbs, fat }
}

export function calcRecommendedBedtime(wakeTime) {
  const [h, m] = wakeTime.split(':').map(Number)
  const wakeMin = h * 60 + m
  const bedMin  = ((wakeMin - 8 * 60 - 15) + 24 * 60) % (24 * 60)
  return `${String(Math.floor(bedMin / 60)).padStart(2, '0')}:${String(bedMin % 60).padStart(2, '0')}`
}

export function buildProfile(data) {
  const weight       = Number(data.weight)
  const baseActivity = data.baseActivity ?? 'sedentary'
  const exerciseDays = Number(data.exerciseDays ?? 0)
  const sportsDays   = Number(data.sportsDays   ?? 0)
  const sports       = data.sports ?? []

  const bmr            = calcBMR({ sex: data.sex, age: Number(data.age), height: Number(data.height), weight })
  const tdeeResult     = calcTDEE(bmr, { baseActivity, exerciseDays, sportsDays, sports })
  const tdee           = tdeeResult.total
  const goalAdj        = GOAL_LABELS[data.goal]?.adj ?? 0
  const calorieTarget  = calcCalorieTarget(tdee, data.goal)
  const macros         = calcMacros(weight, calorieTarget, data.goal)
  const recommendedBedtime = calcRecommendedBedtime(data.wakeTime)

  return {
    name: data.name.trim(),
    sex: data.sex, age: Number(data.age), height: Number(data.height),
    weight, goalWeight: Number(data.goalWeight),
    goal: data.goal,
    baseActivity, exerciseDays, sportsDays, sports,
    wakeTime: data.wakeTime, destination: data.destination, travelTime: Number(data.travelTime),
    photo: data.photo ?? null,
    bmr, tdee, tdeeBreakdown: tdeeResult, goalAdj, calorieTarget, macros, recommendedBedtime,
    startWeight: weight,
    startDate: new Date().toISOString().split('T')[0],
  }
}
