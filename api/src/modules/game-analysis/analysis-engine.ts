import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import type { EngineEvaluation, EngineTopMove } from './types';

type Deferred<T> = {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type PendingEvaluation = Deferred<EngineEvaluationWithTopMoves> & {
  result: Partial<EngineEvaluation>;
  topMoves: Map<number, Partial<EngineTopMove>>;
};

type EngineEvaluationWithTopMoves = EngineEvaluation & {
  topMoves: Map<number, Partial<EngineTopMove>>;
};

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

const DEFAULT_STARTUP_TIMEOUT_MS = 10_000;
const DEFAULT_REQUEST_TIMEOUT_BUFFER_MS = 2_000;
const DEFAULT_MOVE_TIME_MS = 100;
const MATE_SCORE_CP = 10_000;

export class AnalysisEngine {
  private process: ChildProcessWithoutNullStreams | null = null;
  private readonly decoder = new TextDecoder();
  private readonly mutex = new AsyncMutex();
  private stdoutBuffer = '';
  private startupPromise: Promise<void> | null = null;
  private isStopping = false;

  private pendingUci: Deferred<void> | null = null;
  private pendingReady: Deferred<void> | null = null;
  private pendingEvaluation: PendingEvaluation | null = null;

  constructor(
    private readonly options: {
      stockfishPath: string;
      startupTimeoutMs?: number;
      requestTimeoutBufferMs?: number;
    },
  ) {}

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
    this.failAllPending(new Error('Analysis engine is stopping'));

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

  async evaluateFen(input: { fen: string; moveTimeMs?: number }): Promise<EngineEvaluation> {
    return this.mutex.runExclusive(async () => {
      const fen = input.fen.trim();
      await this.ensureRunning();
      await this.sendIsReady();
      await this.sendCommand(`position fen ${fen}`);
      const evaluation = await this.executeGo(input.moveTimeMs ?? DEFAULT_MOVE_TIME_MS);
      const sideToMove = getSideToMove(fen);

      return {
        ...evaluation,
        scoreCp: sideToMove === 'b' ? -evaluation.scoreCp : evaluation.scoreCp,
        mateIn: evaluation.mateIn === undefined
          ? undefined
          : sideToMove === 'b'
            ? -evaluation.mateIn
            : evaluation.mateIn,
      };
    });
  }

  async evaluateFenTopMoves(input: { fen: string; moveTimeMs?: number; multiPv?: number }): Promise<EngineTopMove[]> {
    return this.mutex.runExclusive(async () => {
      const fen = input.fen.trim();
      const multiPv = Math.max(1, Math.min(input.multiPv ?? 3, 10));

      await this.ensureRunning();
      await this.sendIsReady();
      await this.sendCommand(`setoption name MultiPV value ${multiPv}`);
      await this.sendIsReady();
      await this.sendCommand(`position fen ${fen}`);

      try {
        const evaluation = await this.executeGo(input.moveTimeMs ?? DEFAULT_MOVE_TIME_MS);
        const sideToMove = getSideToMove(fen);

        return [...evaluation.topMoves.values()]
          .filter((move): move is EngineTopMove => Boolean(move.uci && move.scoreCp !== undefined && move.multipv))
          .map((move) => ({
            ...move,
            scoreCp: sideToMove === 'b' ? -move.scoreCp : move.scoreCp,
            mateIn: move.mateIn === undefined
              ? undefined
              : sideToMove === 'b'
                ? -move.mateIn
                : move.mateIn,
          }))
          .sort((a, b) => a.multipv - b.multipv);
      } finally {
        if (multiPv !== 1) {
          await this.sendCommand('setoption name MultiPV value 1');
          await this.sendIsReady();
        }
      }
    });
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
      if (message) {
        console.error('[game-analysis] stockfish stderr:', message);
      }
    });

    child.on('error', (error) => {
      this.handleProcessFailure(error);
    });

    child.on('exit', (code, signal) => {
      this.process = null;
      this.stdoutBuffer = '';
      this.failAllPending(new Error(`Analysis Stockfish exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`));
    });

    await this.sendUciHandshake();
    await this.sendCommand('setoption name Threads value 1');
    await this.sendCommand('setoption name Hash value 32');
    await this.sendIsReady();
  }

  private async ensureRunning(): Promise<void> {
    if (this.process) {
      return;
    }

    await this.start();
  }

  private executeGo(moveTimeMs: number): Promise<EngineEvaluationWithTopMoves> {
    if (this.pendingEvaluation) {
      return Promise.reject(new Error('Analysis engine is already evaluating a position'));
    }

    const timeout = this.createTimeout(moveTimeMs + (this.options.requestTimeoutBufferMs ?? DEFAULT_REQUEST_TIMEOUT_BUFFER_MS), () => {
      if (!this.pendingEvaluation) {
        return;
      }

      const request = this.pendingEvaluation;
      this.pendingEvaluation = null;
      this.safeWrite('stop');
      request.reject(new Error('Analysis evaluation timed out'));
    });

    const promise = new Promise<EngineEvaluationWithTopMoves>((resolve, reject) => {
      this.pendingEvaluation = {
        resolve,
        reject,
        timeout,
        result: {},
        topMoves: new Map(),
      };
    });

    this.safeWrite(`go movetime ${moveTimeMs}`);

    return promise;
  }

  private async sendUciHandshake(): Promise<void> {
    const timeout = this.createTimeout(this.options.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS, () => {
      this.pendingUci?.reject(new Error('Analysis Stockfish UCI handshake timed out'));
      this.pendingUci = null;
    });

    const promise = new Promise<void>((resolve, reject) => {
      this.pendingUci = { resolve, reject, timeout };
    });

    await this.sendCommand('uci');
    await promise;
  }

  private async sendIsReady(): Promise<void> {
    const timeout = this.createTimeout(this.options.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS, () => {
      this.pendingReady?.reject(new Error('Analysis Stockfish did not send readyok in time'));
      this.pendingReady = null;
    });

    const promise = new Promise<void>((resolve, reject) => {
      this.pendingReady = { resolve, reject, timeout };
    });

    await this.sendCommand('isready');
    await promise;
  }

  private handleStdoutChunk(chunk: Buffer): void {
    this.stdoutBuffer += this.decoder.decode(chunk, { stream: true });

    let lineEnd = this.stdoutBuffer.indexOf('\n');
    while (lineEnd >= 0) {
      const line = this.stdoutBuffer.slice(0, lineEnd).replace(/\r$/, '').trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(lineEnd + 1);

      if (line) {
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

    if (line.startsWith('bestmove')) {
      this.parseBestMoveLine(line);
    }
  }

  private parseInfoLine(line: string): void {
    if (!this.pendingEvaluation) {
      return;
    }

    const depthMatch = line.match(/\bdepth\s+(\d+)/);
    const multiPvMatch = line.match(/\bmultipv\s+(\d+)/);
    const pvMoveMatch = line.match(/\bpv\s+(\S+)/);
    const multiPv = multiPvMatch ? Number.parseInt(multiPvMatch[1], 10) : 1;

    if (depthMatch) {
      this.pendingEvaluation.result.depth = Number.parseInt(depthMatch[1], 10);
    }

    const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
    if (cpMatch) {
      this.pendingEvaluation.result.scoreCp = Number.parseInt(cpMatch[1], 10);
    }

    const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);
    if (mateMatch) {
      const mateIn = Number.parseInt(mateMatch[1], 10);
      this.pendingEvaluation.result.mateIn = mateIn;
      this.pendingEvaluation.result.scoreCp = mateIn > 0 ? MATE_SCORE_CP : -MATE_SCORE_CP;
    }

    if (pvMoveMatch && (cpMatch || mateMatch)) {
      const existing = this.pendingEvaluation.topMoves.get(multiPv) ?? {};
      const depth = depthMatch ? Number.parseInt(depthMatch[1], 10) : existing.depth;
      const mateIn = mateMatch ? Number.parseInt(mateMatch[1], 10) : undefined;
      const scoreCp = cpMatch
        ? Number.parseInt(cpMatch[1], 10)
        : mateIn !== undefined
          ? mateIn > 0 ? MATE_SCORE_CP : -MATE_SCORE_CP
          : existing.scoreCp;

      this.pendingEvaluation.topMoves.set(multiPv, {
        ...existing,
        uci: pvMoveMatch[1],
        depth,
        scoreCp,
        mateIn,
        multipv: multiPv,
      });
    }
  }

  private parseBestMoveLine(line: string): void {
    if (!this.pendingEvaluation) {
      return;
    }

    const request = this.pendingEvaluation;
    this.pendingEvaluation = null;
    clearTimeout(request.timeout);

    const bestMove = line.match(/^bestmove\s+(\S+)/)?.[1];
    request.resolve({
      scoreCp: request.result.scoreCp ?? 0,
      mateIn: request.result.mateIn,
      bestMove: bestMove && bestMove !== '(none)' ? bestMove : undefined,
      depth: request.result.depth,
      topMoves: request.topMoves,
    });
  }

  private handleProcessFailure(error: Error): void {
    this.failAllPending(error);

    if (!this.isStopping) {
      console.error('[game-analysis] stockfish process error:', error.message);
    }
  }

  private failAllPending(error: Error): void {
    this.rejectAndClear(this.pendingUci, error);
    this.pendingUci = null;

    this.rejectAndClear(this.pendingReady, error);
    this.pendingReady = null;

    this.rejectAndClear(this.pendingEvaluation, error);
    this.pendingEvaluation = null;
  }

  private rejectAndClear<T>(request: Deferred<T> | null, error: Error): void {
    if (!request) {
      return;
    }

    clearTimeout(request.timeout);
    request.reject(error);
  }

  private async sendCommand(command: string): Promise<void> {
    this.safeWrite(command);
  }

  private safeWrite(command: string): void {
    const processRef = this.process;
    if (!processRef || processRef.stdin.destroyed) {
      throw new Error('Analysis Stockfish process is not running');
    }

    processRef.stdin.write(`${command}\n`);
  }

  private createTimeout(durationMs: number, onTimeout: () => void): ReturnType<typeof setTimeout> {
    return setTimeout(onTimeout, durationMs);
  }
}

function getSideToMove(fen: string): 'w' | 'b' {
  const sideToMove = fen.split(/\s+/)[1];
  return sideToMove === 'b' ? 'b' : 'w';
}
