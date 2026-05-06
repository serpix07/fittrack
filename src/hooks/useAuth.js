import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

// user === undefined  → still loading
// user === null       → not signed in
// user is object      → signed in

export function useAuth() {
  const [user, setUser] = useState(undefined)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (u) => setUser(u),
      (err) => { console.error('Firebase auth error:', err); setUser(null) }
    )
    // If Firebase doesn't respond within 6s, assume not authenticated
    const timeout = setTimeout(() => setUser(prev => prev === undefined ? null : prev), 6000)
    return () => { unsub(); clearTimeout(timeout) }
  }, [])

  const signIn = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      const ignored = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']
      if (!ignored.includes(err.code)) {
        setError(
          err.code === 'auth/unauthorized-domain'
            ? 'This domain is not authorised in Firebase. Add it in Firebase Console → Auth → Settings → Authorized domains.'
            : err.code === 'auth/popup-blocked'
            ? 'Popup was blocked by the browser. Please allow popups for this site and try again.'
            : err.message
        )
      }
    }
  }

  const logOut = () => signOut(auth)

  return {
    user,
    loading: user === undefined,
    signedIn: !!user,
    signIn,
    logOut,
    error,
  }
}
