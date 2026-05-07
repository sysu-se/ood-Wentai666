import { Sudoku } from './Sudoku.js';

export class Game {
  constructor({ sudoku, maxHistorySize = 100 } = {}) {
    if (!sudoku) {
      throw new Error('Game requires a Sudoku instance');
    }

    this.sudoku = sudoku;
    this.maxHistorySize = maxHistorySize;
    this.past = [];
    this.future = [];
    this.subscribers = [];

    this.exploreSession = null;
    this.failedExploreSignatures = new Set();
  }

  guess(move) {
    if (this.isExploreMode()) {
      this.exploreSession.past.push(this.sudoku.clone());
      this.exploreSession.future = [];
      this._trimHistory(this.exploreSession.past);
    } else {
      this.past.push(this.sudoku.clone());
      this.future = [];
      this._trimHistory(this.past);
    }

    this.sudoku.guess(move);

    if (this.isExploreMode() && this.sudoku.hasConflict()) {
      this._rememberExploreFailure();
    }

    this._notifySubscribers();
  }

  undo() {
    if (this.isExploreMode()) {
      if (this.exploreSession.past.length === 0) return;
      this.exploreSession.future.push(this.sudoku.clone());
      this.sudoku = this.exploreSession.past.pop();
      this._notifySubscribers();
      return;
    }

    if (!this.canUndo()) return;
    this.future.push(this.sudoku.clone());
    this.sudoku = this.past.pop();
    this._notifySubscribers();
  }

  redo() {
    if (this.isExploreMode()) {
      if (this.exploreSession.future.length === 0) return;
      this.exploreSession.past.push(this.sudoku.clone());
      this.sudoku = this.exploreSession.future.pop();
      this._notifySubscribers();
      return;
    }

    if (!this.canRedo()) return;
    this.past.push(this.sudoku.clone());
    this.sudoku = this.future.pop();
    this._notifySubscribers();
  }

  canUndo() {
    if (this.isExploreMode()) {
      return this.exploreSession.past.length > 0;
    }
    return this.past.length > 0;
  }

  canRedo() {
    if (this.isExploreMode()) {
      return this.exploreSession.future.length > 0;
    }
    return this.future.length > 0;
  }

  getSudoku() {
    return this.sudoku;
  }

  isWon() {
    return this.sudoku.isComplete();
  }

  reset() {
    this.past = [];
    this.future = [];
    this.exploreSession = null;
    this.failedExploreSignatures.clear();

    const initialGrid = this.sudoku.getInitialGrid();
    this.sudoku = new Sudoku(initialGrid);
    this._notifySubscribers();
  }

  getCandidateHint() {
    return this.sudoku.getCandidateHint();
  }

  getNextStepHint() {
    return this.sudoku.getNextStepHint();
  }

  isExploreMode() {
    return this.exploreSession !== null;
  }

  enterExploreMode() {
    if (this.isExploreMode()) {
      return this.getExploreStatus();
    }

    this.exploreSession = {
      base: this.sudoku.clone(),
      past: [],
      future: []
    };

    this._notifySubscribers();
    return this.getExploreStatus();
  }

  commitExplore() {
    if (!this.isExploreMode()) return false;

    this.past.push(this.exploreSession.base);
    this.future = [];
    this._trimHistory(this.past);
    this.exploreSession = null;

    this._notifySubscribers();
    return true;
  }

  discardExplore() {
    if (!this.isExploreMode()) return false;

    this.sudoku = this.exploreSession.base;
    this.exploreSession = null;

    this._notifySubscribers();
    return true;
  }

  rollbackExploreToStart() {
    if (!this.isExploreMode()) return false;

    this.sudoku = this.exploreSession.base.clone();
    this.exploreSession.past = [];
    this.exploreSession.future = [];

    this._notifySubscribers();
    return true;
  }

  getExploreStatus() {
    const inExplore = this.isExploreMode();
    const signature = this._signature();

    return {
      inExplore,
      hasConflict: this.sudoku.hasConflict(),
      isKnownFailedPath: this.failedExploreSignatures.has(signature),
      canRollbackToExploreStart: inExplore,
      canCommitExplore: inExplore,
      canDiscardExplore: inExplore
    };
  }

  toJSON() {
    return {
      sudoku: this.sudoku.toJSON(),
      past: this.past.map((s) => s.toJSON()),
      future: this.future.map((s) => s.toJSON()),
      maxHistorySize: this.maxHistorySize,
      exploreSession: this.exploreSession
        ? {
            base: this.exploreSession.base.toJSON(),
            past: this.exploreSession.past.map((s) => s.toJSON()),
            future: this.exploreSession.future.map((s) => s.toJSON())
          }
        : null,
      failedExploreSignatures: Array.from(this.failedExploreSignatures)
    };
  }

  static fromJSON(data) {
    const game = new Game({
      sudoku: Sudoku.fromJSON(data.sudoku),
      maxHistorySize: data.maxHistorySize
    });

    game.past = data.past.map((s) => Sudoku.fromJSON(s));
    game.future = data.future.map((s) => Sudoku.fromJSON(s));

    if (data.exploreSession) {
      game.exploreSession = {
        base: Sudoku.fromJSON(data.exploreSession.base),
        past: data.exploreSession.past.map((s) => Sudoku.fromJSON(s)),
        future: data.exploreSession.future.map((s) => Sudoku.fromJSON(s))
      };
    }

    game.failedExploreSignatures = new Set(data.failedExploreSignatures || []);
    return game;
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  _notifySubscribers() {
    const state = this._getGameState();
    this.subscribers.forEach((cb) => cb(state));
  }

  _getGameState() {
    return {
      sudoku: this.sudoku,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      won: this.isWon(),
      grid: this.sudoku.getGrid(),
      invalidCells: this.sudoku.getInvalidCells(),
      explore: this.getExploreStatus()
    };
  }

  _rememberExploreFailure() {
    this.failedExploreSignatures.add(this._signature());
  }

  _signature() {
    return JSON.stringify(this.sudoku.getGrid());
  }

  _trimHistory(historyStack) {
    if (historyStack.length > this.maxHistorySize) {
      historyStack.shift();
    }
  }
}

export function createGame(options) {
  return new Game(options);
}

export function createGameFromJSON(data) {
  return Game.fromJSON(data);
}
