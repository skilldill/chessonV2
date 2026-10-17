import { useEffect, useState } from 'react'
import { Bot, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { GameMode, GameState } from '../types/game'
import { CreateGameDialog } from '../components/CreateGameDialog'
import { Dialog } from '../components/Dialog'
import { fetchJSON } from '../lib/api'
import { clearRoom, getSavedRoom } from '../lib/storage'
import { isRoomId } from '../lib/game'

export function HomeScreen() {
  const [mode, setMode] = useState<GameMode | null>(null), [saved, setSaved] = useState<string | null>(null)
  const navigate = useNavigate()
  useEffect(() => {
    const id = getSavedRoom()
    if (!id || !isRoomId(id)) return
    const controller = new AbortController()
    void fetchJSON<{ gameState?: GameState }>(`/rooms/${id}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]) }).then(data => {
      if (controller.signal.aborted) return
      if (data.gameState && !data.gameState.gameEnded) setSaved(id)
      else clearRoom(id)
    }).catch(() => { })
    return () => controller.abort()
  }, [])
  return <main className="home-screen"><section className="home-content" aria-labelledby="home-title"><h1 id="home-title"><em>Шахматы</em> <span>онлайн</span></h1><div className="home-actions">
    <button className="button button-primary" onClick={() => setMode('friend')}><UsersRound size={19} />Играть с другом</button><button className="button button-secondary" onClick={() => setMode('bot')}><Bot size={20} />Играть с ботом</button>
  </div></section>
    {mode && <CreateGameDialog key={mode} mode={mode} onClose={() => setMode(null)} />}
    {saved && !mode && <Dialog title="У вас есть незавершённая партия" description="Вернуться в комнату или начать новую игру?" onClose={() => { clearRoom(saved); setSaved(null) }}><div className="dialog-actions"><button className="button button-primary" onClick={() => navigate(`/game/${saved}`)}>Вернуться в партию</button><button className="button button-secondary" onClick={() => { clearRoom(saved); setSaved(null) }}>Новая игра</button></div></Dialog>}
  </main>
}
