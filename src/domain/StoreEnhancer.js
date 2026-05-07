import { createGame, createSudoku } from '../domain/index.js';

export function enhanceGridStoreWithDomain(userGridStore, gridStore, invalidCellsStore) {
  let gameInstance = null;

  function initializeDomain(initialGrid) {
    const sudoku = createSudoku(initialGrid);
    gameInstance = createGame({ sudoku });

    gameInstance.subscribe((state) => {
      userGridStore.set(state.grid);
      invalidCellsStore.set(Array.from(state.invalidCells));
    });

    return gameInstance;
  }

  function interceptSet(pos, value) {
    if (!gameInstance) {
      throw new Error('Domain not initialized. Call initializeDomain first.');
    }

    gameInstance.guess({ row: pos.y, col: pos.x, value });
  }

  function undo() {
    if (gameInstance) gameInstance.undo();
  }

  function redo() {
    if (gameInstance) gameInstance.redo();
  }

  function canUndo() {
    return gameInstance ? gameInstance.canUndo() : false;
  }

  function canRedo() {
    return gameInstance ? gameInstance.canRedo() : false;
  }

  function isWon() {
    return gameInstance ? gameInstance.isWon() : false;
  }

  function getCandidateHint() {
    return gameInstance ? gameInstance.getCandidateHint() : null;
  }

  function getNextStepHint() {
    return gameInstance ? gameInstance.getNextStepHint() : null;
  }

  function enterExploreMode() {
    return gameInstance ? gameInstance.enterExploreMode() : null;
  }

  function commitExplore() {
    return gameInstance ? gameInstance.commitExplore() : false;
  }

  function discardExplore() {
    return gameInstance ? gameInstance.discardExplore() : false;
  }

  function rollbackExploreToStart() {
    return gameInstance ? gameInstance.rollbackExploreToStart() : false;
  }

  function getExploreStatus() {
    return gameInstance ? gameInstance.getExploreStatus() : null;
  }

  function getGameInstance() {
    return gameInstance;
  }

  return {
    initializeDomain,
    interceptSet,
    undo,
    redo,
    canUndo,
    canRedo,
    isWon,
    getCandidateHint,
    getNextStepHint,
    enterExploreMode,
    commitExplore,
    discardExplore,
    rollbackExploreToStart,
    getExploreStatus,
    getGameInstance
  };
}
