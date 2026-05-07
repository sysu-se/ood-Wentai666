export class Sudoku {
  constructor(initialGrid) {
    this.grid = this._deepCloneGrid(initialGrid);
    this.initialGrid = this._deepCloneGrid(initialGrid);
  }

  guess(move) {
    const { row, col, value } = move;
    this._validatePosition(row, col);
    this._validateValue(value);

    if (this.initialGrid[row][col] !== 0) {
      throw new Error(`Cannot modify initial cell at [${row}, ${col}]`);
    }

    this.grid[row][col] = value;
  }

  getGrid() {
    return this._deepCloneGrid(this.grid);
  }

  getInitialGrid() {
    return this._deepCloneGrid(this.initialGrid);
  }

  isValid() {
    return this.getConflicts().length === 0;
  }

  isComplete() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.grid[row][col] === 0) return false;
      }
    }
    return this.isValid();
  }

  getCandidates(row, col) {
    this._validatePosition(row, col);

    if (this.grid[row][col] !== 0) {
      return [];
    }

    const candidates = [];
    for (let value = 1; value <= 9; value++) {
      if (this._isAllowed(row, col, value)) {
        candidates.push(value);
      }
    }
    return candidates;
  }

  getCandidateHint() {
    let best = null;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.grid[row][col] !== 0) continue;

        const candidates = this.getCandidates(row, col);
        if (candidates.length === 0) {
          return {
            row,
            col,
            candidates,
            conflict: true
          };
        }

        if (!best || candidates.length < best.candidates.length) {
          best = { row, col, candidates, conflict: false };
        }
      }
    }

    return best;
  }

  getNextStepHint() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.grid[row][col] !== 0) continue;

        const candidates = this.getCandidates(row, col);
        if (candidates.length === 1) {
          return {
            row,
            col,
            value: candidates[0],
            reason: 'single-candidate'
          };
        }
      }
    }

    return null;
  }

  hasConflict() {
    return this.getConflicts().length > 0;
  }

  getConflicts() {
    const conflicts = [];

    const pushConflict = (type, row, col, peerRow, peerCol, value) => {
      conflicts.push({ type, row, col, peerRow, peerCol, value });
    };

    for (let row = 0; row < 9; row++) {
      const seen = new Map();
      for (let col = 0; col < 9; col++) {
        const value = this.grid[row][col];
        if (value === 0) continue;

        if (seen.has(value)) {
          const prevCol = seen.get(value);
          pushConflict('row', row, col, row, prevCol, value);
        } else {
          seen.set(value, col);
        }
      }
    }

    for (let col = 0; col < 9; col++) {
      const seen = new Map();
      for (let row = 0; row < 9; row++) {
        const value = this.grid[row][col];
        if (value === 0) continue;

        if (seen.has(value)) {
          const prevRow = seen.get(value);
          pushConflict('col', row, col, prevRow, col, value);
        } else {
          seen.set(value, row);
        }
      }
    }

    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const seen = new Map();
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const row = boxRow * 3 + i;
            const col = boxCol * 3 + j;
            const value = this.grid[row][col];
            if (value === 0) continue;

            if (seen.has(value)) {
              const prev = seen.get(value);
              pushConflict('box', row, col, prev.row, prev.col, value);
            } else {
              seen.set(value, { row, col });
            }
          }
        }
      }
    }

    return conflicts;
  }

  getInvalidCells() {
    const invalid = new Set();
    const conflicts = this.getConflicts();

    for (const conflict of conflicts) {
      invalid.add(`${conflict.row},${conflict.col}`);
      invalid.add(`${conflict.peerRow},${conflict.peerCol}`);
    }

    return invalid;
  }

  clone() {
    const cloned = new Sudoku(this.grid);
    cloned.initialGrid = this._deepCloneGrid(this.initialGrid);
    return cloned;
  }

  toJSON() {
    return {
      grid: this.getGrid(),
      initialGrid: this.getInitialGrid()
    };
  }

  static fromJSON(data) {
    const sudoku = new Sudoku(data.initialGrid);
    sudoku.grid = sudoku._deepCloneGrid(data.grid);
    return sudoku;
  }

  toString() {
    let result = '';
    for (let row = 0; row < 9; row++) {
      if (row % 3 === 0 && row !== 0) {
        result += '\n------+-------+------\n';
      }
      for (let col = 0; col < 9; col++) {
        if (col % 3 === 0 && col !== 0) {
          result += '| ';
        }
        result += (this.grid[row][col] || '.') + ' ';
      }
      result += '\n';
    }
    return result;
  }

  _deepCloneGrid(grid) {
    return grid.map((row) => [...row]);
  }

  _validatePosition(row, col) {
    if (row < 0 || row >= 9 || col < 0 || col >= 9) {
      throw new Error(`Invalid position: [${row}, ${col}]`);
    }
  }

  _validateValue(value) {
    if (!Number.isInteger(value) || value < 0 || value > 9) {
      throw new Error(`Invalid value: ${value}`);
    }
  }

  _isAllowed(row, col, value) {
    for (let c = 0; c < 9; c++) {
      if (this.grid[row][c] === value) return false;
    }

    for (let r = 0; r < 9; r++) {
      if (this.grid[r][col] === value) return false;
    }

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (this.grid[r][c] === value) return false;
      }
    }

    return true;
  }
}

export function createSudoku(initialGrid) {
  return new Sudoku(initialGrid);
}

export function createSudokuFromJSON(data) {
  return Sudoku.fromJSON(data);
}
