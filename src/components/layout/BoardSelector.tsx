import { useBoard } from '../../context/BoardContext';
import { boards } from '../../boards';

export default function BoardSelector() {
  const { board, setBoard } = useBoard();

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500 font-medium">Placa:</span>
      <select
        value={board.id}
        onChange={(e) => setBoard(e.target.value)}
        className="px-2 py-1 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent cursor-pointer font-medium"
      >
        {boards.map((b) => (
          <option key={b.id} value={b.id}>
            {b.icon} {b.name}
          </option>
        ))}
      </select>
      <span className="text-[11px] text-gray-400 hidden sm:inline">
        {board.chip} · {board.voltage}V · {board.flashSize}
      </span>
    </div>
  );
}
