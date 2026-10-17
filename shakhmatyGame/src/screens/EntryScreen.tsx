import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { parseEntry } from '../lib/game'
import { useCreateRoom } from '../hooks/useCreateRoom'
import { Dialog } from '../components/Dialog'

export function EntryScreen() {
  const location = useLocation(), navigate = useNavigate()
  const [settings] = useState(() => parseEntry(location.search))
  const { create, busy, error } = useCreateRoom()
  const creation = useRef<Promise<string | undefined> | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!settings) return
    let active = true
    const search = new URLSearchParams(location.search)
    search.set('requestId', settings.requestId)
    window.history.replaceState(window.history.state, '', `${location.pathname}?${search}`)
    creation.current ??= create(settings, settings.requestId)
    void creation.current.then(id => { if (active && id) navigate(`/game/${id}`, { replace: true }) })
    return () => { active = false }
  }, [settings, create, attempt, navigate, location.pathname, location.search])
  return <main className="home-screen"><Dialog title={!settings ? 'Не удалось открыть игру' : error ? 'Не удалось создать комнату' : 'Создаём комнату'} description={!settings ? 'Проверьте параметры ссылки или выберите игру заново.' : error || 'Настройки из ссылки будут применены автоматически.'}>
    {!error && settings && <LoaderCircle className="spin connection-spinner" size={24} />}<div className="dialog-actions">
      {settings && error && <button className="button button-primary" disabled={busy} onClick={() => { creation.current = null; setAttempt(value => value + 1) }}>Попробовать снова</button>}
      <button className="button button-secondary" onClick={() => navigate('/', { replace: true })}>К выбору игры</button></div>
  </Dialog></main>
}
