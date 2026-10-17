const PROFILE_KEY = 'shakhmaty:profile'
const ROOM_KEY = 'shakhmaty:room'

export const storage = {
  read(key: string) { try { return localStorage.getItem(key) } catch { return null } },
  write(key: string, value: string) { try { localStorage.setItem(key, value) } catch { /* Private mode may restrict storage. */ } },
  remove(key: string) { try { localStorage.removeItem(key) } catch { /* Playing must not require storage. */ } },
}

export function getGuestProfile() {
  try {
    const saved = JSON.parse(storage.read(PROFILE_KEY) || 'null')
    if (saved && typeof saved.name === 'string' && typeof saved.avatar === 'string' && typeof saved.clientId === 'string') return saved as { name: string; avatar: string; clientId: string }
  } catch { /* Replace an invalid profile. */ }
  const clientId = storage.read('wsClientId') || crypto.randomUUID()
  const profile = { name: `Игрок ${Math.floor(1000 + Math.random() * 9000)}`, avatar: String(Math.floor(Math.random() * 8)), clientId }
  storage.write('wsClientId', clientId)
  storage.write(PROFILE_KEY, JSON.stringify(profile))
  return profile
}

export function saveRoom(roomId: string) { storage.write(ROOM_KEY, roomId) }
export function getSavedRoom() { return storage.read(ROOM_KEY) }
export function clearRoom(roomId?: string) { if (!roomId || getSavedRoom() === roomId) storage.remove(ROOM_KEY) }
