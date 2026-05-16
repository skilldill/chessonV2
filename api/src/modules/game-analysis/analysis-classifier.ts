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

export function calculateAccuracy(lossesCp: number[]): number {
  if (lossesCp.length === 0) {
    return 100;
  }

  const total = lossesCp.reduce((sum, loss) => sum + getMoveAccuracy(loss), 0);
  return Math.round(total / lossesCp.length);
}

function getMoveAccuracy(lossCp: number): number {
  if (lossCp <= 15) {
    return 100;
  }

  if (lossCp <= 60) {
    return interpolate(lossCp, 15, 60, 98, 88);
  }

  if (lossCp < 100) {
    return interpolate(lossCp, 60, 100, 88, 78);
  }

  if (lossCp < 250) {
    return interpolate(lossCp, 100, 250, 78, 55);
  }

  const cappedLoss = Math.min(lossCp, 800);
  return interpolate(cappedLoss, 250, 800, 55, 20);
}

function interpolate(value: number, fromValue: number, toValue: number, fromScore: number, toScore: number): number {
  const ratio = (value - fromValue) / (toValue - fromValue);
  return fromScore + (toScore - fromScore) * ratio;
}
