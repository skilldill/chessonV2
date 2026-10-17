import { useCallback, useRef, useState } from 'react'
import { fetchJSON } from '../lib/api'
import { isRoomId, roomPayload } from '../lib/game'
import type { Settings } from '../types/game'

export function useCreateRoom() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const attempt = useRef<{ signature: string; id: string } | null>(null)
  const pending = useRef<Promise<string | undefined> | null>(null)
  const create = useCallback((settings: Settings, requestId?: string) => {
    if (pending.current) return pending.current
    const signature = JSON.stringify(settings)
    if (!attempt.current || attempt.current.signature !== signature) attempt.current = { signature, id: requestId || crypto.randomUUID() }
    setBusy(true)
    setError('')
    const promise = fetchJSON<{ success?: boolean; roomId?: string; error?: string }>('/rooms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20_000), body: JSON.stringify(roomPayload(settings, attempt.current.id)),
    }).then(data => {
      if (!data.success || !data.roomId || !isRoomId(data.roomId)) throw new Error(data.error || 'Не удалось создать комнату.')
      attempt.current = null
      return data.roomId
    }).catch((reason: unknown) => { setError(reason instanceof Error && reason.name !== 'TimeoutError' ? reason.message : 'Сервер не ответил. Проверьте соединение и повторите попытку.'); return undefined })
      .finally(() => { setBusy(false); pending.current = null })
    pending.current = promise
    return promise
  }, [])
  return { create, busy, error }
}
