import { describe, expect, it } from 'vitest';
import { loadDomainApi, makePuzzle } from '../hw1/helpers/domain-api.js';

describe('HW2 hint behavior', () => {
  it('provides candidate hint through domain api', async () => {
    const { createSudoku } = await loadDomainApi();
    const sudoku = createSudoku(makePuzzle());

    const hint = sudoku.getCandidateHint();

    expect(hint).toBeTruthy();
    expect(typeof hint.row).toBe('number');
    expect(typeof hint.col).toBe('number');
    expect(Array.isArray(hint.candidates)).toBe(true);
    expect(hint.candidates.length).toBeGreaterThan(0);
  });

  it('provides next-step hint when there is a single-candidate cell', async () => {
    const { createSudoku } = await loadDomainApi();
    const grid = makePuzzle();
    const sudoku = createSudoku(grid);

    const next = sudoku.getNextStepHint();

    expect(next).toBeTruthy();
    expect(typeof next.row).toBe('number');
    expect(typeof next.col).toBe('number');
    expect(next.value).toBeGreaterThanOrEqual(1);
    expect(next.value).toBeLessThanOrEqual(9);
  });

  it('exposes hint api through Game', async () => {
    const { createGame, createSudoku } = await loadDomainApi();
    const game = createGame({ sudoku: createSudoku(makePuzzle()) });

    expect(game.getCandidateHint()).toBeTruthy();
    expect(game.getNextStepHint()).toBeTruthy();
  });
});
