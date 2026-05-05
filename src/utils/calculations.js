export const ACTIVITY_LABELS = {
  sedentary:  { label: 'Sedentary',  icon: '🪑', desc: 'Desk job, little to no exercise',     multiplier: 1.2   },
  light:      { label: 'Light',      icon: '🚶', desc: '1–3 workouts per week',               multiplier: 1.375 },
  moderate:   { label: 'Moderate',   icon: '🏃', desc: '3–5 workouts per week',               multiplier: 1.55  },
  high:       { label: 'High',       icon: '💪', desc: '6–7 workouts per week',               multiplier: 1.725 },
  very_high:  { label: 'Very High',  icon: '🏆', desc: 'Athlete / twice-a-day training',      multiplier: 1.9   },
}

export const GOAL_LABELS = {
  fat_loss:      { label: 'Fat Loss',       icon: '🔥', desc: 'Reduce body fat, preserve muscle',     adj: -400 },
  muscle_gain:   { label: 'Muscle Gain',    icon: '💪', desc: 'Build muscle with a lean bulk',        adj:  250 },
  recomposition: { label: 'Body Recomp',    icon: '⚡', desc: 'Lose fat and gain muscle simultaneously', adj: 0 },
  maintenance:   { label: 'Maintenance',    icon: '⚖️', desc: 'Maintain current body composition',    adj:  0  },
}

export const SPORT_CONFIG = {
  gym:        { label: 'Gym',        icon: '🏋️', color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/30',  extra: ['muscleGroup'] },
  basketball: { label: 'Basketball', icon: '🏀', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30',  extra: [] },
  football:   { label: 'Football',   icon: '⚽', color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/30',    extra: [] },
  swimming:   { label: 'Swimming',   icon: '🏊', color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/30',      extra: ['distance'] },
  cycling:    { label: 'Cycling',    icon: '🚴', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30',  extra: ['distance'] },
  running:    { label: 'Running',    icon: '🏃', color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/30',        extra: ['distance'] },
  other:      { label: 'Other',      icon: '⚡', color: 'text-slate-400',  bg: 'bg-slate-400/10 border-slate-400/30',    extra: [] },
}

export const MUSCLE_GROUPS = [
  'Push — Chest · Shoulders · Triceps',
  'Pull — Back · Biceps',
  'Legs — Quads · Hamstrings · Glutes',
  'Upper Body',
  'Lower Body',
  'Core & Abs',
  'Full Body',
  'Arms',
  'Chest',
  'Back',
  'Shoulders',
]

export function calcBMR({ sex, age, height, weight }) {
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(sex === 'male' ? base + 5 : base - 161)
}

export function calcTDEE(bmr, activity) {
  return Math.round(bmr * (ACTIVITY_LABELS[activity]?.multiplier ?? 1.55))
}

export function calcCalorieTarget(tdee, goal) {
  return tdee + (GOAL_LABELS[goal]?.adj ?? 0)
}

export function calcMacros(weight, calorieTarget) {
  const protein = Math.round(weight * 2)
  const proteinKcal = protein * 4
  const fat = Math.round(weight * 0.9)
  const fatKcal = fat * 9
  const carbKcal = Math.max(calorieTarget - proteinKcal - fatKcal, 200)
  const carbs = Math.round(carbKcal / 4)
  return { protein, carbs, fat }
}

export function calcRecommendedBedtime(wakeTime) {
  const [h, m] = wakeTime.split(':').map(Number)
  const wakeMin = h * 60 + m
  const bedMin = ((wakeMin - 8 * 60 - 15) + 24 * 60) % (24 * 60)
  return `${String(Math.floor(bedMin / 60)).padStart(2, '0')}:${String(bedMin % 60).padStart(2, '0')}`
}

export function buildProfile(data) {
  const weight = Number(data.weight)
  const bmr = calcBMR({ sex: data.sex, age: Number(data.age), height: Number(data.height), weight })
  const tdee = calcTDEE(bmr, data.activity)
  const calorieTarget = calcCalorieTarget(tdee, data.goal)
  const macros = calcMacros(weight, calorieTarget)
  const recommendedBedtime = calcRecommendedBedtime(data.wakeTime)

  return {
    name: data.name.trim(),
    sex: data.sex,
    age: Number(data.age),
    height: Number(data.height),
    weight,
    goalWeight: Number(data.goalWeight),
    goal: data.goal,
    activity: data.activity,
    sports: data.sports,
    wakeTime: data.wakeTime,
    destination: data.destination,
    travelTime: Number(data.travelTime),
    photo: data.photo ?? null,
    bmr, tdee, calorieTarget, macros, recommendedBedtime,
    startWeight: weight,
    startDate: new Date().toISOString().split('T')[0],
  }
}
