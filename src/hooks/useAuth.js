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
    const unsub = onAuthStateChanged(auth, setUser)
    return unsub
  }, [])

  const signIn = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.code === 'auth/unauthorized-domain'
          ? 'This domain is not authorised in Firebase. Add it in Firebase Console → Auth → Settings → Authorized domains.'
          : err.message)
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
