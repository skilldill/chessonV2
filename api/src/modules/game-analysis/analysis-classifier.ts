import type { FigureColor, MoveQuality } from './types';

export function getMoveLossCp(beforeCp: number, afterCp: number, moverColor: FigureColor): number {
  const loss = moverColor === 'white'
    ? beforeCp - afterCp
    : afterCp - beforeCp;

  return Math.max(0, Math.round(loss));
}

export function classifyMove(lossCp: number): MoveQuality {
  if (lossCp <= 15) return 'excellent';
  if (lossCp <= 60) return 'good';
  if (lossCp < 100) return 'normal';
  if (lossCp < 250) return 'bad';
  return 'blunder';
}

export function scoreCpToPawns(scoreCp: number): number {
  const pawns = scoreCp / 100;
  const clamped = Math.max(-10, Math.min(10, pawns));
  return Math.round(clamped * 10) / 10;
}
