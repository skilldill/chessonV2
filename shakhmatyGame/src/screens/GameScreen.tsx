import { Flag, Handshake, LogOut } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useRoomConnection } from '../hooks/useRoomConnection'
import { useGameBoard } from '../hooks/useGameBoard'
import { useGameActions } from '../hooks/useGameActions'
import { Board } from '../components/Board'
import { GameDialogs } from '../components/GameDialogs'

export function GameScreen() {
  const { roomId = '' } = useParams()
  const room = useRoomConnection(roomId), board = useGameBoard(room), actions = useGameActions(roomId, room)
  return <main className="game-screen"><p className="sr-only" role="status">{room.game?.isSpectator ? 'Вы наблюдаете за партией.' : room.game?.gameEnded ? 'Партия завершена.' : room.game?.currentColor === board.playerColor ? 'Ваш ход.' : 'Ход соперника.'}</p>
    {room.game && <Board board={board} retry={room.retry} />}<nav className="game-actions" aria-label="Действия в партии">
      <button className="game-action" onClick={() => actions.request('resign')} disabled={!actions.canAct} title="Сдаться"><Flag size={19} /><span>Сдаться</span></button>
      <button className="game-action" onClick={() => actions.request('draw')} disabled={!actions.canOfferDraw} title={room.drawSent ? 'Предложение ничьей отправлено' : 'Предложить ничью'}><Handshake size={20} /><span>Ничья</span></button>
      <button className="game-action" onClick={() => actions.request('leave')} disabled={actions.pending} title="Уйти из комнаты"><LogOut size={19} /><span>Уйти</span></button>
    </nav><GameDialogs roomId={roomId} room={room} actions={actions} /></main>
}
