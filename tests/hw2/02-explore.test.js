import { describe, expect, it } from 'vitest';
import { loadDomainApi, makePuzzle } from '../hw1/helpers/domain-api.js';

describe('HW2 explore mode', () => {
  it('supports enter -> discard explore flow', async () => {
    const { createGame, createSudoku } = await loadDomainApi();
    const game = createGame({ sudoku: createSudoku(makePuzzle()) });

    game.enterExploreMode();
    expect(game.getExploreStatus().inExplore).toBe(true);

    game.guess({ row: 0, col: 2, value: 4 });
    expect(game.getSudoku().getGrid()[0][2]).toBe(4);

    game.discardExplore();
    expect(game.getExploreStatus().inExplore).toBe(false);
    expect(game.getSudoku().getGrid()[0][2]).toBe(0);
  });

  it('supports enter -> commit explore flow into main history', async () => {
    const { createGame, createSudoku } = await loadDomainApi();
    const game = createGame({ sudoku: createSudoku(makePuzzle()) });

    game.enterExploreMode();
    game.guess({ row: 0, col: 2, value: 4 });

    game.commitExplore();

    expect(game.getExploreStatus().inExplore).toBe(false);
    expect(game.getSudoku().getGrid()[0][2]).toBe(4);
    expect(game.canUndo()).toBe(true);

    game.undo();
    expect(game.getSudoku().getGrid()[0][2]).toBe(0);
  });

  it('marks failed explore path on conflict', async () => {
    const { createGame, createSudoku } = await loadDomainApi();
    const game = createGame({ sudoku: createSudoku(makePuzzle()) });

    game.enterExploreMode();

    game.guess({ row: 0, col: 2, value: 5 });

    const status = game.getExploreStatus();
    expect(status.hasConflict).toBe(true);
    expect(status.isKnownFailedPath).toBe(true);
  });

  it('supports rollback to explore start after several moves', async () => {
    const { createGame, createSudoku } = await loadDomainApi();
    const game = createGame({ sudoku: createSudoku(makePuzzle()) });

    game.enterExploreMode();
    game.guess({ row: 0, col: 2, value: 4 });
    game.guess({ row: 1, col: 1, value: 7 });

    game.rollbackExploreToStart();

    expect(game.getSudoku().getGrid()[0][2]).toBe(0);
    expect(game.getSudoku().getGrid()[1][1]).toBe(0);
  });
});
