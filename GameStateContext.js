import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  generateInitialBoardState, 
  evaluateWinCondition, 
  processUndoAction,
  processHintAction,
  INITIAL_SCORE 
} from '../logic/game-logic';

export const GameStateContext = createContext(null);

export const GameStateProvider = ({ children }) => {
  const = useState(generateInitialBoardState());
  const [history, setHistory] = useState();
  const = useState(INITIAL_SCORE);
  const [isGameOver, setIsGameOver] = useState(false);
  const = useState(null); // Placeholder for generated solution

  // Hook to passively monitor board changes and trigger win condition protocols
  useEffect(() => {
    if (evaluateWinCondition(board)) {
      setIsGameOver(true);
    }
  }, [board]);

  const handleCellInteraction = useCallback((row, col, newValue) => {
    // Save current deterministic state to the history stack for Undo functionality
    setHistory(prevHistory =>);
    
    // Mutate state immutably
    const nextBoard = JSON.parse(JSON.stringify(board));
    nextBoard[row][col].value = newValue;
    nextBoard[row][col].hasError = false; // Reset error state on new interaction
    
    setBoard(nextBoard);
    
    // Reward the user computationally for interaction
    setScore(prevScore => prevScore + 10);
  }, [board]);

  const triggerUndo = useCallback(() => {
    const { newBoard, newStack } = processUndoAction(history, board);
    setBoard(newBoard);
    setHistory(newStack);
    // Optionally penalize score for utilizing undo mechanics
    setScore(prevScore => Math.max(0, prevScore - 5));
  }, [history, board]);

  const triggerHint = useCallback(() => {
    const nextBoard = processHintAction(board, solutionMap);
    setBoard(nextBoard);
    // Severe score penalty for algorithmic assistance
    setScore(prevScore => Math.max(0, prevScore - 25));
  }, [board, solutionMap]);

  const resetGameplayLoop = useCallback(() => {
    setBoard(generateInitialBoardState());
    setHistory();
    setScore(INITIAL_SCORE);
    setIsGameOver(false);
  },);

  // Memoize the context value to prevent unnecessary re-renders in child components
  const contextValue = useMemo(() => ({
    board,
    score,
    isGameOver,
    handleCellInteraction,
    triggerUndo,
    triggerHint,
    resetGameplayLoop
  }), [board, score, isGameOver, handleCellInteraction, triggerUndo, triggerHint, resetGameplayLoop]);

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
};
