import { useState, useEffect } from 'react'

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches
  )

  useEffect(() => {
    const handler = e => { e.preventDefault(); setPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)

    const mq = window.matchMedia('(display-mode: standalone)')
    const onChange = e => setIsInstalled(e.matches)
    mq.addEventListener('change', onChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      mq.removeEventListener('change', onChange)
    }
  }, [])

  const install = async () => {
    if (!prompt) return false
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') { setPrompt(null); setIsInstalled(true) }
    return outcome === 'accepted'
  }

  return { canInstall: !!prompt && !isInstalled, install, isInstalled }
}
