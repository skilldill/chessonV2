import { StockfishEngine } from './stockfish-engine';
import type { BotMoveRequest, BotMoveResult, BotRoomMoveRequest, BotRoomMoveResult, RoomMoveData } from './types';

type Task<T> = () => Promise<T>;

class AsyncMutex {
  private queue: Promise<void> = Promise.resolve();

  runExclusive<T>(task: Task<T>): Promise<T> {
    const run = this.queue.then(task, task);
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );

    return run;
  }
}

export class ChessBotService {
  private readonly engine: StockfishEngine;
  private readonly mutex = new AsyncMutex();

  constructor(engine?: StockfishEngine) {
    this.engine =
      engine ??
      new StockfishEngine({
        stockfishPath: process.env.STOCKFISH_PATH || 'stockfish',
      });
  }

  async start(): Promise<void> {
    await this.engine.start();
  }

  async stop(): Promise<void> {
    await this.engine.stop();
  }

  async getMove(request: BotMoveRequest): Promise<BotMoveResult> {
    return this.mutex.runExclusive(async () => {
      const result = await this.engine.getBestMove(request);
      await this.applyHumanLikeDelay();
      return result;
    });
  }

  async getRoomMove(request: BotRoomMoveRequest): Promise<BotRoomMoveResult> {
    return this.mutex.runExclusive(async () => {
      const { result, nextFen } = await this.engine.getBestMoveWithNextFen({
        fen: request.fen,
        difficulty: request.difficulty,
        moveTimeMs: request.moveTimeMs,
      });

      const moveData = this.uciToRoomMoveData({
        uci: result.bestMove,
        previousFen: request.fen,
        nextFen,
      });

      await this.applyHumanLikeDelay();

      return {
        ...result,
        moveData,
      };
    });
  }

  roomMoveToUci(moveData: Pick<RoomMoveData, 'from' | 'to' | 'figure' | 'FEN'>): string {
    const castlingUci = this.getCastlingUci(moveData);
    if (castlingUci) {
      return castlingUci;
    }

    const fromSquare = this.coordsToSquare(moveData.from);
    const toSquare = this.coordsToSquare(moveData.to);
    const moveWithMeta = moveData as Pick<RoomMoveData, 'from' | 'to' | 'figure' | 'FEN' | 'type'>;

    let promotionSuffix = '';
    if (moveWithMeta.type === 'transform') {
      promotionSuffix = this.getPromotionSuffixFromPiece(moveData.figure);
    } else if (
      moveData.figure.type === 'pawn' &&
      (moveData.to[1] === 0 || moveData.to[1] === 7)
    ) {
      const promotedPiece = this.getPieceAt(moveData.FEN, moveData.to);
      promotionSuffix = this.getPromotionSuffixFromPiece(promotedPiece);
    }

    return `${fromSquare}${toSquare}${promotionSuffix}`;
  }

  private uciToRoomMoveData(input: { uci: string; previousFen: string; nextFen: string }): RoomMoveData {
    if (input.uci.length < 4) {
      throw new Error(`Invalid UCI move: ${input.uci}`);
    }

    const from = this.squareToCoords(input.uci.slice(0, 2));
    const to = this.squareToCoords(input.uci.slice(2, 4));
    const movedPiece = this.getPieceAt(input.previousFen, from);

    if (!movedPiece) {
      throw new Error(`Cannot determine moved piece for UCI move: ${input.uci}`);
    }

    const promotionSuffix = input.uci[4]?.toLowerCase();
    const promotionTypeMap: Record<string, RoomMoveData['figure']['type']> = {
      q: 'queen',
      r: 'rook',
      b: 'bishop',
      n: 'knight',
    };

    if (promotionSuffix && promotionTypeMap[promotionSuffix]) {
      const promotedPieceFromFen = this.getPieceAt(input.nextFen, to);
      const promotedType = promotionTypeMap[promotionSuffix];
      const promotedPiece = promotedPieceFromFen
        ? { ...promotedPieceFromFen, touched: true }
        : { color: movedPiece.color, type: promotedType, touched: true };

      return {
        FEN: input.nextFen,
        from,
        to,
        type: 'transform',
        figure: promotedPiece,
      };
    }

    if (movedPiece.type === 'king' && from[0] === 4 && (from[1] === 7 || from[1] === 0)) {
      const isShortCastle = to[0] === 6 && to[1] === from[1];
      const isLongCastle = to[0] === 2 && to[1] === from[1];

      if (isShortCastle || isLongCastle) {
        const normalizedTo: [number, number] =
          movedPiece.color === 'white' && isLongCastle
            ? [1, 7]
            : to;

        return {
          FEN: input.nextFen,
          from,
          to: normalizedTo,
          figure: {
            ...movedPiece,
            touched: false,
          },
        };
      }
    }

    return {
      FEN: input.nextFen,
      from,
      to,
      figure: {
        ...movedPiece,
        touched: true,
      },
    };
  }

  private getCastlingUci(moveData: Pick<RoomMoveData, 'from' | 'to' | 'figure' | 'FEN'>): string | null {
    if (moveData.figure.type !== 'king') {
      return null;
    }

    const [fx, fy] = moveData.from;
    const [tx, ty] = moveData.to;

    // Not reversed board
    if (fy === 7 && fx === 4 && ty === 7 && tx === 6) return 'e1g1';
    if (fy === 7 && fx === 4 && ty === 7 && (tx === 1 || tx === 2)) return 'e1c1';
    if (fy === 0 && fx === 4 && ty === 0 && tx === 6) return 'e8g8';
    if (fy === 0 && fx === 4 && ty === 0 && tx === 2) return 'e8c8';

    // Reversed board
    if (fy === 0 && fx === 3 && ty === 0 && tx === 1) return 'e1g1';
    if (fy === 0 && fx === 3 && ty === 0 && (tx === 6 || tx === 5)) return 'e1c1';
    if (fy === 7 && fx === 3 && ty === 7 && tx === 1) return 'e8g8';
    if (fy === 7 && fx === 3 && ty === 7 && tx === 5) return 'e8c8';

    return null;
  }

  private coordsToSquare(coords: [number, number]): string {
    const [x, y] = coords;
    if (x < 0 || x > 7 || y < 0 || y > 7) {
      throw new Error(`Invalid board coordinates: [${x}, ${y}]`);
    }

    const file = String.fromCharCode('a'.charCodeAt(0) + x);
    const rank = String(8 - y);
    return `${file}${rank}`;
  }

  private squareToCoords(square: string): [number, number] {
    if (!/^[a-h][1-8]$/.test(square)) {
      throw new Error(`Invalid square: ${square}`);
    }

    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = Number.parseInt(square[1], 10);
    const y = 8 - rank;

    return [file, y];
  }

  private getPieceAt(
    fen: string,
    coords: [number, number],
  ): RoomMoveData['figure'] | null {
    const boardPart = fen.split(' ')[0];
    const rows = boardPart.split('/');
    const [targetX, targetY] = coords;

    const row = rows[targetY];
    if (!row) {
      return null;
    }

    let x = 0;
    for (const char of row) {
      const digit = Number.parseInt(char, 10);
      if (!Number.isNaN(digit)) {
        x += digit;
        continue;
      }

      if (x === targetX) {
        const isWhite = char === char.toUpperCase();
        const typeMap: Record<string, RoomMoveData['figure']['type']> = {
          p: 'pawn',
          n: 'knight',
          b: 'bishop',
          r: 'rook',
          q: 'queen',
          k: 'king',
        };

        const pieceType = typeMap[char.toLowerCase()];
        if (!pieceType) {
          return null;
        }

        return {
          color: isWhite ? 'white' : 'black',
          type: pieceType,
        };
      }

      x += 1;
    }

    return null;
  }

  private getPromotionSuffixFromPiece(piece: RoomMoveData['figure'] | null): string {
    if (!piece) {
      return 'q';
    }

    switch (piece.type) {
      case 'queen':
        return 'q';
      case 'rook':
        return 'r';
      case 'bishop':
        return 'b';
      case 'knight':
        return 'n';
      default:
        return 'q';
    }
  }

  private async applyHumanLikeDelay(): Promise<void> {
    const minMs = 500;
    const maxMs = 1_500;
    const delayMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

    await new Promise<void>((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }
}
