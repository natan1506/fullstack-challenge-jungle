import { useGameStore } from "../stores/game.store";
import { Badge } from "@/components/ui/badge";

export function RoundHistory() {
  const { history } = useGameStore();

  return (
    <div className="flex gap-1.5 flex-wrap">
      {history.map((r) => (
        <Badge
          key={r.id}
          variant={r.crashPoint < 1.5 ? "crashed" : r.crashPoint < 3 ? "pending" : "won"}
        >
          {r.crashPoint.toFixed(2)}x
        </Badge>
      ))}
    </div>
  );
}
