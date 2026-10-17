import { Component, lazy, Suspense, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { useGameBoard } from '../hooks/useGameBoard'
const ChessBoard3D = lazy(() => import('react-chessboard-ui/3d').then(module => ({ default: module.ChessBoard3D })))

class BoardErrorBoundary extends Component<{ children: ReactNode; retry: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <div className="board-fallback" role="alert"><h2>Не удалось открыть 3D-доску</h2><p>Проверьте поддержку WebGL и аппаратного ускорения в браузере.</p><button className="button button-secondary" onClick={() => { this.setState({ failed: false }); this.props.retry() }}>Попробовать ещё раз</button></div>
    return this.props.children
  }
}
export function Board({ board, retry }: { board: ReturnType<typeof useGameBoard>; retry: () => void }) {
  return <div className="board-scene" data-testid="board-scene"><BoardErrorBoundary retry={retry}><Suspense fallback={<div className="board-loading" role="status"><LoaderCircle className="spin" size={24} /><span>Загружаем доску…</span></div>}>
    <ChessBoard3D key={board.version} FEN={board.fen} onChange={board.onChange} onEndGame={board.onEndGame} change={board.change} config={{ pieceSizePercent: 100 }} reversed={board.reversed} playerColor={board.playerColor} viewOnly={board.viewOnly} className="chessboard-3d" style={{ width: '100%', height: '100%', aspectRatio: 'auto' }} />
  </Suspense></BoardErrorBoundary></div>
}
