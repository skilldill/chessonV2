import { useEffect, useState } from 'react'
import { fetchJSON } from '../lib/api'
import { getGuestProfile } from '../lib/storage'

export type Identity = ReturnType<typeof getGuestProfile> & { token?: string }

export function usePlayerIdentity() {
  const [identity, setIdentity] = useState<Identity>()
  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(3500)])
    const resolve = async () => {
      const guest = getGuestProfile()
      let profile: Identity = guest
      try {
        const auth = await fetchJSON<{ success: boolean; user?: { name?: string; login: string; avatar?: string } }>('/auth/me', { signal })
        if (auth.success && auth.user) {
          const token = await fetchJSON<{ token?: string }>('/auth/ws-token', { signal })
          profile = { ...guest, name: auth.user.name || auth.user.login, avatar: auth.user.avatar || '0', token: token.token }
        }
      } catch { /* Guest play remains available when authentication is unavailable. */ }
      if (!controller.signal.aborted) setIdentity(profile)
    }
    void resolve()
    return () => controller.abort()
  }, [])
  return identity
}
