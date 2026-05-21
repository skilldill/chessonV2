import type { FigureColor, MoveQuality } from './types';

const METRIC_LOSS_CP_CAP = 800;

export function getMoveLossCp(beforeCp: number, afterCp: number, moverColor: FigureColor): number {
  const loss = moverColor === 'white'
    ? beforeCp - afterCp
    : afterCp - beforeCp;

  return normalizeLossCp(loss);
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

export function calculateQualityBasedAccuracy(
  lossesCp: number[],
  totalPly: number,
): { accuracy: number; averageLossCp: number } {
  if (lossesCp.length === 0) {
    return {
      accuracy: smoothAccuracy(100, totalPly),
      averageLossCp: 0,
    };
  }

  const averageLossCp = Math.round(
    lossesCp.reduce((sum, loss) => sum + loss, 0) / lossesCp.length,
  );
  const averageMoveScore = lossesCp.reduce((sum, loss) => sum + getQualityMoveScore(loss), 0) / lossesCp.length;

  return {
    accuracy: smoothAccuracy(averageMoveScore, totalPly),
    averageLossCp,
  };
}

export function getAccuracyLabel(accuracy: number): string {
  if (accuracy >= 95) return 'Отличная игра';
  if (accuracy >= 85) return 'Хорошая игра';
  if (accuracy >= 70) return 'Средняя игра';
  if (accuracy >= 50) return 'Много ошибок';
  return 'Очень много ошибок';
}

export function getQualityDescription(quality: MoveQuality, lossCp: number): string {
  if (quality === 'excellent') {
    return lossCp === 0 ? 'Лучший ход в позиции' : 'Удерживает перевес';
  }

  if (quality === 'good') {
    return `Потеря: ${lossCp} cp`;
  }

  if (quality === 'normal') {
    return `Небольшая потеря инициативы: ${lossCp} cp`;
  }

  if (quality === 'bad') {
    return `Серьезная потеря: ${lossCp} cp`;
  }

  return `Зевок: потеря ${lossCp} cp`;
}

export function getBestMoveStrengthScore(lossCp: number, beforeCp: number, afterCp: number, moverColor: FigureColor): number {
  const improvement = moverColor === 'white'
    ? afterCp - beforeCp
    : beforeCp - afterCp;

  if (lossCp > 15) {
    return -lossCp;
  }

  return Math.max(0, improvement) + (15 - lossCp);
}

function normalizeLossCp(loss: number): number {
  if (!Number.isFinite(loss)) {
    return METRIC_LOSS_CP_CAP;
  }

  return Math.max(0, Math.min(METRIC_LOSS_CP_CAP, Math.round(loss)));
}

function getQualityMoveScore(lossCp: number): number {
  if (lossCp === 0) {
    return 100;
  }

  const quality = classifyMove(lossCp);

  if (quality === 'excellent') return 95;
  if (quality === 'good') return 90;
  if (quality === 'normal') return 75;
  if (quality === 'bad') return 45;
  return 10;
}

function smoothAccuracy(accuracy: number, totalPly: number): number {
  const smoothed = totalPly < 20
    ? accuracy * 0.7 + 50 * 0.3
    : accuracy;

  return Math.max(0, Math.min(100, Math.round(smoothed)));
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
