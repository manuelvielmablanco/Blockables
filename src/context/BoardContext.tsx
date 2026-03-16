import { createContext, useContext, useState, ReactNode } from 'react';
import type { BoardProfile } from '../boards';
import { defaultBoard, getBoardById } from '../boards';

interface BoardContextType {
  board: BoardProfile;
  setBoard: (id: string) => void;
}

const BoardContext = createContext<BoardContextType>({
  board: defaultBoard,
  setBoard: () => {},
});

export function BoardProvider({ children }: { children: ReactNode }) {
  const [board, setBoardState] = useState<BoardProfile>(defaultBoard);

  const setBoard = (id: string) => {
    setBoardState(getBoardById(id));
  };

  return (
    <BoardContext.Provider value={{ board, setBoard }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  return useContext(BoardContext);
}
