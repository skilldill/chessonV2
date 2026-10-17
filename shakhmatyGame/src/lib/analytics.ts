export const METRIKA_COUNTER = 113658367
type Goal = 'play_click' | 'room_created' | 'game_started' | 'game_completed'
type Params = Record<string, string | number>
type Metrika = (counter: number, method: string, ...args: unknown[]) => void
declare global { interface Window { ym?: Metrika } }

function send(method: string, ...args: unknown[]): boolean {
  try {
    if (typeof window.ym !== 'function') return false
    window.ym(METRIKA_COUNTER, method, ...args)
    return true
  } catch { return false }
}

export function trackGoal(goal: Goal, params: Params): boolean {
  return send('reachGoal', goal, { app: 'shakhmaty-game', ...params })
}

const sentGoals = new Set<string>()
export function trackRoomGoal(goal: Exclude<Goal, 'play_click'>, roomId: string, params: Params): void {
  const key = `metrika:${METRIKA_COUNTER}:${goal}:${roomId}`
  if (sentGoals.has(key)) return
  try { if (sessionStorage.getItem(key)) return } catch { /* Storage can be disabled. */ }
  if (!trackGoal(goal, params)) return
  sentGoals.add(key)
  try { sessionStorage.setItem(key, '1') } catch { /* In-memory deduplication still applies. */ }
}

export function trackPage(pathname: string, previous?: string): boolean {
  // Query strings include creation request IDs and are not useful page dimensions.
  const url = new URL(pathname, window.location.origin)
  const referer = previous || document.referrer
  let cleanReferer = ''
  try { const parsed = new URL(referer); cleanReferer = parsed.origin + parsed.pathname } catch { /* No referrer. */ }
  return send('hit', url.origin + url.pathname, { title: document.title, referer: cleanReferer, params: { app: 'shakhmaty-game' } })
}
