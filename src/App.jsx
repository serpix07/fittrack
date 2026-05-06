import { useState, useEffect, lazy, Suspense, Component } from 'react'
import { useLocalStorage }   from './hooks/useLocalStorage'
import { useInstallPrompt }  from './hooks/useInstallPrompt'
import { useAuth }           from './hooks/useAuth'
import Onboarding            from './components/Onboarding'
import LoginScreen           from './components/LoginScreen'
import NutritionTracker      from './components/NutritionTracker'
import SleepTracker          from './components/SleepTracker'
import WorkoutLog            from './components/WorkoutLog'
import ProfileView           from './components/Profile'

const WeightProgress = lazy(() => import('./components/WeightProgress'))

// ─── Tab definitions ────────────────────────────────────────────────────────

const TABS = [
  { id: 'nutrition', label: 'Nutrition', icon: active => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} className="w-6 h-6">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" strokeLinecap="round"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" strokeLinecap="round"/>
      <line x1="6" y1="1" x2="6" y2="4" strokeLinecap="round"/>
      <line x1="10" y1="1" x2="10" y2="4" strokeLinecap="round"/>
      <line x1="14" y1="1" x2="14" y2="4" strokeLinecap="round"/>
    </svg>
  )},
  { id: 'sleep', label: 'Sleep', icon: active => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} className="w-6 h-6">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { id: 'workout', label: 'Workout', icon: active => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} className="w-6 h-6">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { id: 'weight', label: 'Weight', icon: active => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} className="w-6 h-6">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { id: 'profile', label: 'Profile', icon: active => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} className="w-6 h-6">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
      <circle cx="12" cy="7" r="4" strokeLinecap="round"/>
    </svg>
  )},
]

// ─── Error boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false }
  }

  static getDerivedStateFromError() {
    return { crashed: true }
  }

  componentDidCatch(err, info) {
    console.error('FitTrack crash:', err, info)
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 text-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-red-900/30 border border-red-700/40 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <div>
            <h2 className="text-white font-bold text-xl mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
              The app crashed unexpectedly. Your data is safe — it's stored locally on your device.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-semibold px-6 py-3 rounded-xl transition-all"
          >
            Reload app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Dismiss the HTML loader once React has painted ──────────────────────────

function useDismissHtmlLoader() {
  useEffect(() => {
    const el = document.getElementById('app-loader')
    if (!el) return
    el.classList.add('ft-fade-out')
    const t = setTimeout(() => el.remove(), 280)
    return () => clearTimeout(t)
  }, [])
}

// ─── Splash / loading screen ─────────────────────────────────────────────────

function Splash() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-8 h-8">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ─── Main app (mounted fresh per user.uid) ───────────────────────────────────

function MainApp({ user, logOut, canInstall, onInstall }) {
  const userId = user.uid
  const [profile, setProfile] = useLocalStorage(`ft-${userId}-profile`, null)
  const [activeTab, setActiveTab] = useState('nutrition')

  if (!profile) return <Onboarding onComplete={setProfile} />

  // Prefer onboarding photo, then Google photo, then initials
  const avatarUrl  = profile.photo || user.photoURL || null
  const avatarInit = profile.name.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Install banner */}
      {canInstall && (
        <div className="bg-violet-900/80 border-b border-violet-700/50 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-violet-300">📲</span>
            <span className="text-violet-200 font-medium">Add FitTrack to your home screen</span>
          </div>
          <button
            onClick={onInstall}
            className="text-xs bg-violet-600 hover:bg-violet-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Install
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-[#1e1e30]">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-white font-bold">FitTrack</span>
          </div>
          <div className="flex items-center gap-2">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-violet-500/50" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-600/40 flex items-center justify-center text-sm font-bold text-violet-400">
                {avatarInit}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-white text-sm font-medium leading-none">{profile.name}</p>
              <p className="text-slate-500 text-xs mt-0.5">{profile.calorieTarget} kcal · {profile.macros.protein}g P</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-5 content-area">
        {activeTab === 'nutrition' && <NutritionTracker profile={profile} userId={userId} />}
        {activeTab === 'sleep'     && <SleepTracker     profile={profile} userId={userId} />}
        {activeTab === 'workout'   && <WorkoutLog       profile={profile} userId={userId} />}
        {activeTab === 'weight'    && (
          <Suspense fallback={<div className="flex items-center justify-center py-24 text-slate-600 text-sm">Loading chart…</div>}>
            <WeightProgress profile={profile} userId={userId} />
          </Suspense>
        )}
        {activeTab === 'profile'   && (
          <ProfileView
            profile={profile}
            userId={userId}
            googleUser={user}
            onReset={() => setProfile(null)}
            onUpdate={setProfile}
            onLogOut={logOut}
          />
        )}
      </main>

      {/* Bottom Nav — 56px min height for finger-friendly tap targets */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#0d0d18]/95 backdrop-blur-md border-t border-[#1e1e30] bottom-nav-safe">
        <div className="max-w-xl mx-auto flex">
          {TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] py-2 transition-all duration-150 active:opacity-70 ${
                  active ? 'text-violet-400' : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {tab.icon(active)}
                <span className={`text-[11px] font-medium leading-none ${active ? 'text-violet-400' : 'text-slate-600'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────────

function AppInner() {
  const { user, loading, signIn, logOut, error } = useAuth()
  const { canInstall, install } = useInstallPrompt()

  // Fade out the HTML loader as soon as React paints for the first time
  useDismissHtmlLoader()

  if (loading)   return <Splash />
  if (!user)     return <LoginScreen onSignIn={signIn} error={error} />

  // key=user.uid forces complete re-mount on user switch,
  // so every useLocalStorage call re-reads the correct user's data
  return (
    <MainApp
      key={user.uid}
      user={user}
      logOut={logOut}
      canInstall={canInstall}
      onInstall={install}
    />
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  )
}
