// ─── Activity levels (days of exercise per week) ─────────────────────────────

export const ACTIVITY_LEVELS = {
  sedentary: {
    label: 'Sedentary',
    days: '0–1',
    desc: 'Little or no exercise',
    multiplier: 1.2,
  },
  lightly_active: {
    label: 'Lightly Active',
    days: '1–3',
    desc: 'Light exercise 1–3 days/week',
    multiplier: 1.375,
  },
  moderately_active: {
    label: 'Moderately Active',
    days: '3–5',
    desc: 'Moderate exercise 3–5 days/week',
    multiplier: 1.55,
  },
  very_active: {
    label: 'Very Active',
    days: '6–7',
    desc: 'Intense exercise 6–7 days/week',
    multiplier: 1.725,
  },
  extra_active: {
    label: 'Extra Active',
    days: 'Daily+',
    desc: 'Hard training every day + physical job',
    multiplier: 1.9,
  },
}

// Legacy — kept so old-format profiles still display correctly
export function getActivityMultiplier(totalDays) {
  if (totalDays === 0) return 1.2
  if (totalDays <= 2)  return 1.375
  if (totalDays <= 4)  return 1.55
  if (totalDays <= 6)  return 1.725
  return 1.9
}

export function getActivityLabel(totalDays) {
  if (totalDays === 0) return { label: 'Sedentary',  icon: '🪑', desc: 'Little to no exercise' }
  if (totalDays <= 2)  return { label: 'Light',       icon: '🚶', desc: `${totalDays}x/week active` }
  if (totalDays <= 4)  return { label: 'Moderate',    icon: '🏃', desc: `${totalDays}x/week active` }
  if (totalDays <= 6)  return { label: 'Active',      icon: '💪', desc: `${totalDays}x/week active` }
  return                     { label: 'Very Active',  icon: '🏆', desc: 'Daily / twice-a-day' }
}

export const ACTIVITY_LABELS = {
  sedentary: { label: 'Sedentary', icon: '🪑', desc: 'Desk job, little to no exercise', multiplier: 1.2   },
  light:     { label: 'Light',     icon: '🚶', desc: '1–3 workouts per week',           multiplier: 1.375 },
  moderate:  { label: 'Moderate',  icon: '🏃', desc: '3–5 workouts per week',           multiplier: 1.55  },
  high:      { label: 'High',      icon: '💪', desc: '6–7 workouts per week',           multiplier: 1.725 },
  very_high: { label: 'Very High', icon: '🏆', desc: 'Athlete / twice-a-day training',  multiplier: 1.9   },
}

// ─── Goal labels ──────────────────────────────────────────────────────────────

export const GOAL_LABELS = {
  fat_loss_slow: {
    label: 'Fat Loss — Slow', icon: '🔥',
    desc: '−15% of TDEE',
    pct: -15, category: 'fat_loss',
  },
  fat_loss_moderate: {
    label: 'Fat Loss — Moderate', icon: '🔥',
    desc: '−20% of TDEE',
    pct: -20, category: 'fat_loss',
  },
  fat_loss_aggressive: {
    label: 'Fat Loss — Aggressive', icon: '🔥',
    desc: '−25% of TDEE',
    pct: -25, category: 'fat_loss',
    warn: true,
    warnText: 'Aggressive cut. Only recommended short term.',
  },
  recomp_slow: {
    label: 'Recomp — Slow', icon: '⚡',
    desc: '−10% of TDEE · protein 2 g/kg',
    pct: -10, category: 'recomp',
    note: 'Minimal deficit. Maximum muscle preservation. Best for advanced lifters.',
  },
  recomp_standard: {
    label: 'Recomp — Standard', icon: '⚡',
    desc: '−15% of TDEE · protein 2.2 g/kg',
    pct: -15, category: 'recomp',
    note: 'Balanced approach. Lose fat and gain muscle simultaneously.',
  },
  recomp_aggressive: {
    label: 'Recomp — Aggressive', icon: '⚡',
    desc: '−20% of TDEE · protein 2.4 g/kg',
    pct: -20, category: 'recomp',
    note: 'Faster fat loss. Harder to maintain muscle. Best for beginners with higher body fat.',
  },
  muscle_gain_lean: {
    label: 'Lean Bulk', icon: '💪',
    desc: '+10% of TDEE',
    pct: 10, category: 'muscle_gain',
  },
  muscle_gain_standard: {
    label: 'Standard Bulk', icon: '💪',
    desc: '+15% of TDEE',
    pct: 15, category: 'muscle_gain',
  },
  maintenance: {
    label: 'Maintenance', icon: '⚖️',
    desc: 'Maintain current body composition',
    pct: 0, category: 'maintenance',
  },
  // Legacy keys — old saved profiles
  recomposition: { label: 'Body Recomp',  icon: '⚡', desc: 'Recomposition',    adj: -250, category: 'recomp'       },
  fat_loss:      { label: 'Fat Loss',     icon: '🔥', desc: 'Reduce body fat',  adj: -400, category: 'fat_loss'     },
  muscle_gain:   { label: 'Muscle Gain',  icon: '💪', desc: 'Build muscle',     adj:  250, category: 'muscle_gain'  },
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

export function calcTDEE(bmr, activityLevel = 'sedentary') {
  const multiplier = ACTIVITY_LEVELS[activityLevel]?.multiplier ?? 1.2
  return Math.round(bmr * multiplier)
}

export function calcCalorieTarget(tdee, goal) {
  const g = GOAL_LABELS[goal]
  if (!g) return Math.max(1200, tdee)
  const adj = g.pct !== undefined
    ? Math.round(tdee * g.pct / 100)
    : (g.adj ?? 0)
  return Math.max(1200, tdee + adj)
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
  const weight        = Number(data.weight)
  const activityLevel = data.activityLevel ?? 'sedentary'
  const sports        = data.sports ?? []

  const bmr           = calcBMR({ sex: data.sex, age: Number(data.age), height: Number(data.height), weight })
  const multiplier    = ACTIVITY_LEVELS[activityLevel]?.multiplier ?? 1.2
  const tdee          = calcTDEE(bmr, activityLevel)
  const g             = GOAL_LABELS[data.goal]
  const goalAdj       = g?.pct !== undefined
    ? Math.round(tdee * g.pct / 100)
    : (g?.adj ?? 0)
  const calorieTarget = Math.max(1200, tdee + goalAdj)
  const macros        = calcMacros(weight, calorieTarget, data.goal)
  const recommendedBedtime = calcRecommendedBedtime(data.wakeTime)

  return {
    name: data.name.trim(),
    sex: data.sex, age: Number(data.age), height: Number(data.height),
    weight, goalWeight: Number(data.goalWeight),
    goal: data.goal,
    activityLevel, multiplier, sports,
    wakeTime: data.wakeTime, destination: data.destination, travelTime: Number(data.travelTime),
    photo: data.photo ?? null,
    bmr, tdee, goalAdj, calorieTarget, macros, recommendedBedtime,
    startWeight: weight,
    startDate: new Date().toISOString().split('T')[0],
  }
}
