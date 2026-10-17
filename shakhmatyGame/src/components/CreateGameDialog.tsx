import { useState, type FormEvent } from 'react'
import { ArrowLeft, ChevronDown, LoaderCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { defaultSettings, DIFFICULTIES } from '../lib/game'
import type { Settings } from '../types/game'
import { useCreateRoom } from '../hooks/useCreateRoom'
import { Dialog } from './Dialog'

export function CreateGameDialog({ mode, onClose }: { mode: Settings['mode']; onClose: () => void }) {
  const [settings, setSettings] = useState(() => defaultSettings(mode))
  const { create, busy, error } = useCreateRoom()
  const navigate = useNavigate()
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings(prev => ({ ...prev, [key]: value }))
  const submit = async (event: FormEvent) => { event.preventDefault(); const id = await create(settings); if (id) navigate(`/game/${id}`) }
  return <Dialog title={mode === 'friend' ? 'Игра с другом' : 'Игра с ботом'} description={mode === 'friend' ? 'Создайте комнату и отправьте другу ссылку.' : 'Выберите сложность и начните партию.'} onClose={onClose} busy={busy}>
    <form onSubmit={submit} className="settings-form"><fieldset disabled={busy}>
      {/* <div className="form-row"><label>Время на игрока<span className="select-wrap"><select value={settings.timeMinutes} onChange={e => update('timeMinutes', Number(e.target.value))}>{MINUTES.map(minutes => <option key={minutes} value={minutes}>{minutes} мин</option>)}</select><ChevronDown size={16} /></span></label>
        <label>Добавление за ход<span className="select-wrap"><select value={settings.incrementSeconds} onChange={e => update('incrementSeconds', Number(e.target.value))}>{INCREMENTS.map(seconds => <option key={seconds} value={seconds}>{seconds} сек</option>)}</select><ChevronDown size={16} /></span></label></div> */}
      {mode === 'bot' && <label>Сложность<span className="select-wrap"><select value={settings.difficulty} onChange={e => update('difficulty', e.target.value as Settings['difficulty'])}>{Object.entries(DIFFICULTIES).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select><ChevronDown size={16} /></span></label>}
      <div className="field-label" id="color-label">Ваш цвет</div><div className="color-choice" role="radiogroup" aria-labelledby="color-label">
        {(['white', 'random', 'black'] as const).map(color => <label key={color}><input type="radio" name="color" value={color} checked={settings.color === color} onChange={() => update('color', color)} /><span>{color === 'white' ? 'Белые' : color === 'black' ? 'Чёрные' : 'Случайный'}</span></label>)}
      </div></fieldset>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button type="submit" className="button button-primary" disabled={busy}>{busy && <LoaderCircle size={18} className="spin" />}{busy ? 'Создаём комнату…' : mode === 'friend' ? 'Создать комнату' : 'Начать игру'}</button>
      <button type="button" className="button button-quiet" onClick={onClose} disabled={busy}><ArrowLeft size={16} />Назад</button>
    </form>
  </Dialog>
}
