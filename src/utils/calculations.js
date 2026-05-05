// ─── Activity multipliers (based on total active days/week) ──────────────────

export function getActivityMultiplier(totalDays) {
  if (totalDays === 0) return 1.2
  if (totalDays <= 2)  return 1.375
  if (totalDays <= 4)  return 1.55
  if (totalDays <= 6)  return 1.725
  return 1.9
}

export function getActivityLabel(totalDays) {
  if (totalDays === 0) return { label: 'Sedentary',    icon: '🪑', desc: 'Little to no exercise' }
  if (totalDays <= 2)  return { label: 'Light',         icon: '🚶', desc: `${totalDays}x/week active` }
  if (totalDays <= 4)  return { label: 'Moderate',      icon: '🏃', desc: `${totalDays}x/week active` }
  if (totalDays <= 6)  return { label: 'Active',        icon: '💪', desc: `${totalDays}x/week active` }
  return                      { label: 'Very Active',   icon: '🏆', desc: 'Daily / twice-a-day' }
}

// Legacy ACTIVITY_LABELS kept so old-format profiles still display correctly in Profile view
export const ACTIVITY_LABELS = {
  sedentary: { label: 'Sedentary', icon: '🪑', desc: 'Desk job, little to no exercise',  multiplier: 1.2   },
  light:     { label: 'Light',     icon: '🚶', desc: '1–3 workouts per week',            multiplier: 1.375 },
  moderate:  { label: 'Moderate',  icon: '🏃', desc: '3–5 workouts per week',            multiplier: 1.55  },
  high:      { label: 'High',      icon: '💪', desc: '6–7 workouts per week',            multiplier: 1.725 },
  very_high: { label: 'Very High', icon: '🏆', desc: 'Athlete / twice-a-day training',   multiplier: 1.9   },
}

// ─── Goal labels ──────────────────────────────────────────────────────────────

export const GOAL_LABELS = {
  fat_loss_slow: {
    label: 'Fat Loss — Slow', icon: '🔥',
    desc: 'Sustainable, minimal muscle loss',
    adj: -250, weeklyChange: -0.25, category: 'fat_loss',
  },
  fat_loss_moderate: {
    label: 'Fat Loss — Moderate', icon: '🔥',
    desc: 'Effective cut, some hunger expected',
    adj: -500, weeklyChange: -0.5, category: 'fat_loss',
  },
  fat_loss_aggressive: {
    label: 'Fat Loss — Aggressive', icon: '🔥',
    desc: 'Fast cut, harder to sustain',
    adj: -750, weeklyChange: -0.75, category: 'fat_loss', warn: true,
  },
  muscle_gain_lean: {
    label: 'Lean Bulk', icon: '💪',
    desc: 'Slow muscle gain, minimal fat gain',
    adj: 200, weeklyChange: 0.125, category: 'muscle_gain',
  },
  muscle_gain_standard: {
    label: 'Standard Bulk', icon: '💪',
    desc: 'Faster gains, some fat expected',
    adj: 350, weeklyChange: 0.225, category: 'muscle_gain',
  },
  recomposition: {
    label: 'Body Recomp', icon: '⚡',
    desc: 'Lose fat & gain muscle simultaneously',
    adj: 0, weeklyChange: 0, category: 'recomp',
  },
  maintenance: {
    label: 'Maintenance', icon: '⚖️',
    desc: 'Maintain current body composition',
    adj: 0, weeklyChange: 0, category: 'maintenance',
  },
  // Legacy keys so old saved profiles still render
  fat_loss:    { label: 'Fat Loss',    icon: '🔥', desc: 'Reduce body fat',        adj: -400, weeklyChange: -0.35, category: 'fat_loss'    },
  muscle_gain: { label: 'Muscle Gain', icon: '💪', desc: 'Build muscle',           adj:  250, weeklyChange:  0.2,  category: 'muscle_gain' },
}

// ─── Sport bonus (kcal per session, used to compute weekly calorie bonus) ─────

const SPORT_BONUS = {
  basketball: 200,
  football:   200,
  swimming:   250,
  cycling:    250,
  running:    300,
  gym:          0,  // weight training is captured by the activity multiplier
  other:      150,
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

export function calcTDEE(bmr, { trainingDays = 0, cardioDays = 0, sportsDays = 0, sports = [] } = {}) {
  const totalDays = trainingDays + cardioDays + sportsDays
  const base = Math.round(bmr * getActivityMultiplier(totalDays))

  // Weekly sport bonus = sportsDays × average bonus of selected sports with a non-zero bonus
  const sportList = Array.isArray(sports) ? sports : []
  const bonuses   = sportList.filter(s => (SPORT_BONUS[s] ?? 0) > 0).map(s => SPORT_BONUS[s])
  const avgBonus  = bonuses.length > 0 ? bonuses.reduce((a, b) => a + b, 0) / bonuses.length : 0
  const dailyBonus = Math.round((sportsDays * avgBonus) / 7)

  return base + dailyBonus
}

export function calcCalorieTarget(tdee, goal) {
  return Math.max(1200, tdee + (GOAL_LABELS[goal]?.adj ?? 0))
}

export function calcMacros(weight, calorieTarget) {
  const protein    = Math.round(weight * 2)
  const proteinKcal = protein * 4
  const fat        = Math.round(weight * 0.9)
  const fatKcal    = fat * 9
  const carbKcal   = Math.max(calorieTarget - proteinKcal - fatKcal, 200)
  const carbs      = Math.round(carbKcal / 4)
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
  const trainingDays = Number(data.trainingDays ?? 0)
  const cardioDays   = Number(data.cardioDays   ?? 0)
  const sportsDays   = Number(data.sportsDays   ?? 0)
  const sports       = data.sports ?? []
  const totalActiveDays = trainingDays + cardioDays + sportsDays

  const bmr            = calcBMR({ sex: data.sex, age: Number(data.age), height: Number(data.height), weight })
  const tdee           = calcTDEE(bmr, { trainingDays, cardioDays, sportsDays, sports })
  const goalAdj        = GOAL_LABELS[data.goal]?.adj ?? 0
  const calorieTarget  = calcCalorieTarget(tdee, data.goal)
  const macros         = calcMacros(weight, calorieTarget)
  const recommendedBedtime = calcRecommendedBedtime(data.wakeTime)

  return {
    name: data.name.trim(),
    sex: data.sex, age: Number(data.age), height: Number(data.height),
    weight, goalWeight: Number(data.goalWeight),
    goal: data.goal,
    trainingDays, cardioDays, sportsDays, totalActiveDays,
    activityMultiplier: getActivityMultiplier(totalActiveDays),
    activity: data.activity ?? null, // kept for backward compat with old profiles
    sports,
    wakeTime: data.wakeTime, destination: data.destination, travelTime: Number(data.travelTime),
    photo: data.photo ?? null,
    bmr, tdee, goalAdj, calorieTarget, macros, recommendedBedtime,
    startWeight: weight,
    startDate: new Date().toISOString().split('T')[0],
  }
}
