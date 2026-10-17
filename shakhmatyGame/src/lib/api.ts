export const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : '/api/api')).replace(/\/$/, '')

export function roomSocketUrl(roomId: string, profile: { name: string; avatar: string; clientId: string }, token?: string) {
  const url = new URL(import.meta.env.VITE_WS_URL || '/ws/room', window.location.origin)
  url.protocol = url.protocol === 'https:' || url.protocol === 'wss:' ? 'wss:' : 'ws:'
  url.search = new URLSearchParams({ roomId, userName: profile.name, avatar: profile.avatar, clientId: profile.clientId }).toString()
  if (token) url.searchParams.set('authToken', token)
  return url.href
}

export async function fetchJSON<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include', ...init })
  if (!response.ok) throw new Error(`Ошибка сервера (${response.status}). Попробуйте ещё раз.`)
  return response.json() as Promise<T>
}
