import { Check, Copy, Flag, Handshake, LoaderCircle, LogOut, RotateCcw } from 'lucide-react'
import { Dialog } from './Dialog'
import { resultText } from '../lib/game'
import { useClipboard } from '../hooks/useClipboard'
import { useGameDialogs } from '../hooks/useGameDialogs'
import type { GameActions } from '../hooks/useGameActions'
import type { RoomConnection } from '../hooks/useRoomConnection'

export function GameDialogs({ roomId, room, actions }: { roomId: string; room: RoomConnection; actions: GameActions }) {
  const dialogs = useGameDialogs(roomId, room, actions)
  const clipboard = useClipboard()
  const { type } = dialogs
  if (type === 'connection') {
    const failed = ['offline', 'expired', 'error'].includes(room.status), expired = room.status === 'expired'
    return <Dialog title={expired ? 'Комната недоступна' : failed ? 'Нет соединения' : room.status === 'reconnecting' ? 'Восстанавливаем соединение' : 'Подключаемся к комнате'} description={failed ? room.error || 'Проверьте интернет-соединение и попробуйте снова.' : 'Позиция и цвет игрока сохранятся.'}>
      {!failed && <LoaderCircle size={24} className="spin connection-spinner" aria-label="Загрузка" />}<div className="dialog-actions">
        {!expired && <button className="button button-primary" onClick={room.retry} disabled={!failed}><RotateCcw size={17} />Подключиться снова</button>}
        <button className="button button-quiet" onClick={() => actions.request('leave')}><LogOut size={16} />Уйти</button>
        {actions.confirmation === 'leave' && <button className="button button-secondary" onClick={actions.leave}>Вернуться к выбору игры</button>}
      </div>
    </Dialog>
  }
  if (type === 'result' && room.game) {
    const result = resultText(room.game, room.game.isSpectator ? undefined : room.game.player?.color)
    return <Dialog title={result.title} description={result.description} onClose={dialogs.dismissResult}><div className="dialog-actions"><button className="button button-primary" onClick={actions.leave}>Новая игра</button><button className="button button-secondary" onClick={dialogs.dismissResult}>Посмотреть доску</button></div></Dialog>
  }
  if (type === 'confirmation' && actions.confirmation) {
    const action = actions.confirmation, playing = room.game?.gameStarted && !room.game.gameEnded && !room.game.isSpectator
    const title = action === 'resign' ? 'Сдаться?' : action === 'draw' ? 'Предложить ничью?' : 'Уйти из комнаты?'
    const description = action === 'draw' ? 'Соперник сможет принять или отклонить предложение.' : action === 'resign' ? 'Вы признаете поражение в этой партии.' : playing ? 'Выход из текущей партии будет засчитан как поражение.' : 'Вы сможете вернуться по ссылке на эту комнату.'
    const Icon = action === 'draw' ? Handshake : action === 'resign' ? Flag : LogOut
    return <Dialog title={title} description={description} onClose={actions.cancel} busy={actions.pending}><div className="dialog-actions">
      <button className="button button-primary" disabled={actions.pending} onClick={actions.confirm}>{actions.pending ? <LoaderCircle className="spin" size={17} /> : <Icon size={17} />}{actions.pending ? 'Ждём подтверждение…' : action === 'resign' ? 'Сдаться' : action === 'draw' ? 'Предложить ничью' : 'Уйти'}</button>
      <button className="button button-secondary" disabled={actions.pending} onClick={actions.cancel}>Остаться</button></div></Dialog>
  }
  if (type === 'draw') return <Dialog title="Соперник предлагает ничью" description="Завершить партию вничью?"><div className="dialog-actions"><button className="button button-primary" onClick={() => actions.respondDraw(true)}><Handshake size={17} />Принять ничью</button><button className="button button-secondary" onClick={() => actions.respondDraw(false)}>Продолжить игру</button></div></Dialog>
  if (type === 'notice') return <Dialog title="Информация" description={room.notice?.text} onClose={dialogs.dismissNotice}><button className="button button-primary full-width" onClick={dialogs.dismissNotice}>Понятно</button></Dialog>
  if (type === 'invitation') {
    const link = `${window.location.origin}/game/${roomId}`
    return <Dialog title="Пригласите друга" description="Отправьте ссылку. Партия начнётся, когда друг присоединится."><label className="invitation-label">Ссылка на комнату<input className="invitation-link" aria-label="Ссылка на комнату" readOnly value={link} onFocus={e => e.target.select()} /></label>
      <div className="dialog-actions"><button className="button button-primary" onClick={() => void clipboard.copy(link)}>{clipboard.copied ? <Check size={18} /> : <Copy size={18} />}{clipboard.copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}</button>
        {clipboard.error && <p className="form-error" role="alert">Не удалось скопировать автоматически. Выделите и скопируйте ссылку из поля.</p>}<button className="button button-quiet" onClick={() => actions.request('leave')}><LogOut size={16} />Уйти</button></div></Dialog>
  }
  return null
}
