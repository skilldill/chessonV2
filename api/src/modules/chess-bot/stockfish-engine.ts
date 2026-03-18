import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import type { BotDifficulty, BotMoveRequest, BotMoveResult, StockfishEngineOptions } from './types';

type InflightMoveRequest = {
  resolve: (value: BotMoveResult) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
  result: Partial<BotMoveResult>;
};

type Deferred = {
  resolve: () => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type PendingFenRequest = {
  resolve: (fen: string) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

const DEFAULT_STARTUP_TIMEOUT_MS = 10_000;
const DEFAULT_TIMEOUT_BUFFER_MS = 2_000;
const DEFAULT_RESTART_DELAY_MS = 500;

const DIFFICULTY_SKILL_LEVEL: Record<BotDifficulty, number> = {
  easy: 4,
  medium: 10,
  hard: 18,
};

export class StockfishEngine {
  private readonly options: Required<StockfishEngineOptions>;
  private process: ChildProcessWithoutNullStreams | null = null;
  private readonly decoder = new TextDecoder();
  private stdoutBuffer = '';
  private startupPromise: Promise<void> | null = null;
  private isStopping = false;

  private pendingUci: Deferred | null = null;
  private pendingReady: Deferred | null = null;
  private pendingFen: PendingFenRequest | null = null;
  private inflightMove: InflightMoveRequest | null = null;

  constructor(options: StockfishEngineOptions) {
    this.options = {
      stockfishPath: options.stockfishPath,
      startupTimeoutMs: options.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS,
      requestTimeoutBufferMs: options.requestTimeoutBufferMs ?? DEFAULT_TIMEOUT_BUFFER_MS,
      restartDelayMs: options.restartDelayMs ?? DEFAULT_RESTART_DELAY_MS,
    };
  }

  async start(): Promise<void> {
    if (this.process) {
      return;
    }

    if (this.startupPromise) {
      return this.startupPromise;
    }

    this.startupPromise = this.bootProcess();

    try {
      await this.startupPromise;
    } finally {
      this.startupPromise = null;
    }
  }

  async stop(): Promise<void> {
    this.isStopping = true;

    this.rejectAndClearDeferred(this.pendingUci, new Error('Stockfish engine is stopping'));
    this.pendingUci = null;

    this.rejectAndClearDeferred(this.pendingReady, new Error('Stockfish engine is stopping'));
    this.pendingReady = null;

    if (this.pendingFen) {
      clearTimeout(this.pendingFen.timeout);
      this.pendingFen.reject(new Error('Stockfish engine is stopping'));
      this.pendingFen = null;
    }

    if (this.inflightMove) {
      clearTimeout(this.inflightMove.timeout);
      this.inflightMove.reject(new Error('Stockfish engine is stopping'));
      this.inflightMove = null;
    }

    if (!this.process) {
      return;
    }

    const processRef = this.process;
    await new Promise<void>((resolve) => {
      const onExit = () => {
        processRef.off('exit', onExit);
        resolve();
      };

      processRef.once('exit', onExit);
      this.safeWrite('quit');

      setTimeout(() => {
        if (!processRef.killed) {
          processRef.kill('SIGKILL');
        }
      }, 1_000);
    });
  }

  async getBestMove(request: BotMoveRequest): Promise<BotMoveResult> {
    const { result } = await this.getBestMoveWithNextFen(request);
    return result;
  }

  async getBestMoveWithNextFen(request: BotMoveRequest): Promise<{ result: BotMoveResult; nextFen: string }> {
    this.validateRequest(request);

    await this.ensureRunning();
    await this.sendIsReady();
    await this.sendCommand('ucinewgame');
    await this.sendIsReady();

    await this.applyDifficulty(request.difficulty ?? 'medium');

    const positionCommand = this.buildPositionCommand(request);
    await this.sendCommand(positionCommand);

    const result = await this.executeGo(request.moveTimeMs);
    const nextFen = await this.getFenAfterMove(request, result.bestMove);

    return { result, nextFen };
  }

  private async bootProcess(): Promise<void> {
    const child = spawn(this.options.stockfishPath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.process = child;
    this.stdoutBuffer = '';

    child.stdout.on('data', (chunk: Buffer) => {
      this.handleStdoutChunk(chunk);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const message = chunk.toString('utf8').trim();
      if (message.length > 0) {
        console.error('[chess-bot] stockfish stderr:', message);
      }
    });

    child.on('error', (error) => {
      this.handleProcessFailure(error);
    });

    child.on('exit', (code, signal) => {
      this.handleExit(code, signal);
    });

    await this.sendUciHandshake();
    await this.sendIsReady();
  }

  private async ensureRunning(): Promise<void> {
    if (this.process) {
      return;
    }

    await this.start();
  }

  private async sendUciHandshake(): Promise<void> {
    if (this.pendingUci) {
      throw new Error('Duplicate UCI handshake request');
    }

    const timeout = this.createTimeout(
      this.options.startupTimeoutMs,
      () => {
        this.pendingUci?.reject(new Error('Stockfish UCI handshake timed out'));
        this.pendingUci = null;
      },
    );

    const promise = new Promise<void>((resolve, reject) => {
      this.pendingUci = { resolve, reject, timeout };
    });

    await this.sendCommand('uci');
    await promise;
  }

  private async sendIsReady(): Promise<void> {
    if (this.pendingReady) {
      throw new Error('Duplicate isready request');
    }

    const timeout = this.createTimeout(
      this.options.startupTimeoutMs,
      () => {
        this.pendingReady?.reject(new Error('Stockfish did not send readyok in time'));
        this.pendingReady = null;
      },
    );

    const promise = new Promise<void>((resolve, reject) => {
      this.pendingReady = { resolve, reject, timeout };
    });

    await this.sendCommand('isready');
    await promise;
  }

  private async applyDifficulty(difficulty: BotDifficulty): Promise<void> {
    const skillLevel = DIFFICULTY_SKILL_LEVEL[difficulty];
    await this.sendCommand(`setoption name Skill Level value ${skillLevel}`);
    await this.sendIsReady();
  }

  private buildPositionCommand(request: BotMoveRequest, extraMoves: string[] = []): string {
    const moves = [
      ...(request.moves?.filter((move) => move.trim().length > 0) ?? []),
      ...extraMoves,
    ];
    const movesSuffix = moves.length > 0 ? ` moves ${moves.join(' ')}` : '';

    if (request.fen && request.fen.trim().length > 0) {
      return `position fen ${request.fen.trim()}${movesSuffix}`;
    }

    return `position startpos${movesSuffix}`;
  }

  private executeGo(moveTimeMs: number): Promise<BotMoveResult> {
    if (this.inflightMove) {
      return Promise.reject(new Error('Stockfish is already processing a move request'));
    }

    const timeout = this.createTimeout(
      moveTimeMs + this.options.requestTimeoutBufferMs,
      () => {
        if (!this.inflightMove) {
          return;
        }

        const request = this.inflightMove;
        this.inflightMove = null;

        this.safeWrite('stop');
        request.reject(new Error('Stockfish bestmove timeout exceeded'));
      },
    );

    const promise = new Promise<BotMoveResult>((resolve, reject) => {
      this.inflightMove = {
        resolve,
        reject,
        timeout,
        result: {},
      };
    });

    this.safeWrite(`go movetime ${moveTimeMs}`);

    return promise;
  }

  private handleStdoutChunk(chunk: Buffer): void {
    this.stdoutBuffer += this.decoder.decode(chunk, { stream: true });

    let lineEnd = this.stdoutBuffer.indexOf('\n');
    while (lineEnd >= 0) {
      const line = this.stdoutBuffer.slice(0, lineEnd).replace(/\r$/, '').trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(lineEnd + 1);

      if (line.length > 0) {
        this.handleEngineLine(line);
      }

      lineEnd = this.stdoutBuffer.indexOf('\n');
    }
  }

  private handleEngineLine(line: string): void {
    if (line === 'uciok' && this.pendingUci) {
      const request = this.pendingUci;
      this.pendingUci = null;
      clearTimeout(request.timeout);
      request.resolve();
      return;
    }

    if (line === 'readyok' && this.pendingReady) {
      const request = this.pendingReady;
      this.pendingReady = null;
      clearTimeout(request.timeout);
      request.resolve();
      return;
    }

    if (line.startsWith('info ')) {
      this.parseInfoLine(line);
      return;
    }

    if (line.startsWith('Fen: ') && this.pendingFen) {
      const request = this.pendingFen;
      this.pendingFen = null;
      clearTimeout(request.timeout);
      request.resolve(line.slice('Fen: '.length).trim());
      return;
    }

    if (line.startsWith('bestmove')) {
      this.parseBestMoveLine(line);
    }
  }

  private parseInfoLine(line: string): void {
    if (!this.inflightMove) {
      return;
    }

    const depthMatch = line.match(/\bdepth\s+(\d+)/);
    if (depthMatch) {
      this.inflightMove.result.depth = Number.parseInt(depthMatch[1], 10);
    }

    const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
    if (cpMatch) {
      this.inflightMove.result.scoreCp = Number.parseInt(cpMatch[1], 10);
    }
  }

  private parseBestMoveLine(line: string): void {
    if (!this.inflightMove) {
      return;
    }

    const request = this.inflightMove;
    this.inflightMove = null;
    clearTimeout(request.timeout);

    const bestMoveMatch = line.match(/^bestmove\s+(\S+)/);
    const ponderMatch = line.match(/\bponder\s+(\S+)/);

    const bestMove = bestMoveMatch?.[1];
    if (!bestMove || bestMove === '(none)') {
      request.reject(new Error('Stockfish returned no legal best move'));
      return;
    }

    request.resolve({
      bestMove,
      ponder: ponderMatch?.[1],
      depth: request.result.depth,
      scoreCp: request.result.scoreCp,
    });
  }

  private async getFenAfterMove(request: BotMoveRequest, bestMove: string): Promise<string> {
    if (this.pendingFen) {
      throw new Error('Duplicate FEN read request');
    }

    const timeout = this.createTimeout(
      this.options.startupTimeoutMs,
      () => {
        this.pendingFen?.reject(new Error('Stockfish did not return FEN in time'));
        this.pendingFen = null;
      },
    );

    const fenPromise = new Promise<string>((resolve, reject) => {
      this.pendingFen = { resolve, reject, timeout };
    });

    const positionWithMove = this.buildPositionCommand(request, [bestMove]);
    await this.sendCommand(positionWithMove);
    await this.sendCommand('d');
    await this.sendIsReady();

    return fenPromise;
  }

  private handleProcessFailure(error: Error): void {
    this.failAllPending(error);

    if (!this.isStopping) {
      console.error('[chess-bot] stockfish process error:', error.message);
    }
  }

  private handleExit(code: number | null, signal: NodeJS.Signals | null): void {
    this.process = null;
    this.stdoutBuffer = '';

    const exitError = new Error(`Stockfish exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`);
    this.failAllPending(exitError);

    if (!this.isStopping) {
      console.error('[chess-bot] stockfish exited unexpectedly, restarting');
      setTimeout(() => {
        if (!this.process && !this.isStopping) {
          this.start().catch((error) => {
            console.error('[chess-bot] stockfish restart failed:', error.message);
          });
        }
      }, this.options.restartDelayMs);
    }
  }

  private failAllPending(error: Error): void {
    this.rejectAndClearDeferred(this.pendingUci, error);
    this.pendingUci = null;

    this.rejectAndClearDeferred(this.pendingReady, error);
    this.pendingReady = null;

    if (this.pendingFen) {
      clearTimeout(this.pendingFen.timeout);
      this.pendingFen.reject(error);
      this.pendingFen = null;
    }

    if (this.inflightMove) {
      clearTimeout(this.inflightMove.timeout);
      this.inflightMove.reject(error);
      this.inflightMove = null;
    }
  }

  private rejectAndClearDeferred(request: Deferred | null, error: Error): void {
    if (!request) {
      return;
    }

    clearTimeout(request.timeout);
    request.reject(error);
  }

  private validateRequest(request: BotMoveRequest): void {
    if (!Number.isFinite(request.moveTimeMs) || request.moveTimeMs <= 0) {
      throw new Error('moveTimeMs must be a positive number');
    }

    if (request.moves && !Array.isArray(request.moves)) {
      throw new Error('moves must be an array of UCI move strings');
    }
  }

  private async sendCommand(command: string): Promise<void> {
    this.safeWrite(command);
  }

  private safeWrite(command: string): void {
    const processRef = this.process;
    if (!processRef || processRef.stdin.destroyed) {
      throw new Error('Stockfish process is not running');
    }

    processRef.stdin.write(`${command}\n`);
  }

  private createTimeout(durationMs: number, onTimeout: () => void): ReturnType<typeof setTimeout> {
    return setTimeout(onTimeout, durationMs);
  }
}
