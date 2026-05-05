const FEATURES = [
  { icon: '🍽️', text: 'Personalised calorie & macro targets' },
  { icon: '💪', text: 'Workout tracker with weekly streaks'  },
  { icon: '🌙', text: 'Sleep schedule optimised to your day' },
  { icon: '📊', text: 'Weight chart with 3-month progress'  },
  { icon: '📷', text: 'Barcode scanner for instant nutrition info' },
]

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginScreen({ onSignIn, error }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-6 shadow-2xl shadow-violet-900/50">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-12 h-12">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">FitTrack</h1>
      <p className="text-slate-400 text-base text-center mb-10 max-w-xs">
        Your personalized health &amp; fitness companion
      </p>

      {/* Feature list */}
      <div className="w-full max-w-xs space-y-3 mb-10">
        {FEATURES.map(f => (
          <div key={f.text} className="flex items-center gap-3">
            <span className="text-xl w-8 text-center">{f.icon}</span>
            <span className="text-slate-300 text-sm">{f.text}</span>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="w-full max-w-xs mb-4 bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Sign in button */}
      <button
        onClick={onSignIn}
        className="w-full max-w-xs flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-semibold py-4 px-6 rounded-2xl transition-all duration-150 active:scale-[0.98] shadow-xl shadow-black/30"
      >
        <GoogleIcon />
        <span>Sign in with Google</span>
      </button>

      <p className="text-slate-600 text-xs text-center mt-6 max-w-xs">
        Your data is stored on your device. Google sign-in is used only to identify your profile across devices.
      </p>
    </div>
  )
}
