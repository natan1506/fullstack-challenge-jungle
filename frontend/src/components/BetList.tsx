import { useGameStore } from "../stores/game.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function BetList() {
  const { bets, hydrated } = useGameStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apostas da rodada</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {!hydrated ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-800">
                <div className="w-20 h-3 bg-gray-800 rounded animate-pulse" />
                <div className="w-14 h-3 bg-gray-800 rounded animate-pulse" />
                <div className="w-12 h-5 bg-gray-800 rounded-full animate-pulse" />
              </div>
            ))
          ) : bets.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">Nenhuma aposta ainda</p>
          ) : (
            bets.map((bet) => (
              <div key={bet.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-800 last:border-0">
                <span className="text-gray-300 font-medium">{bet.username}</span>
                <span className="text-gray-400">R$ {(parseInt(bet.amountCents) / 100).toFixed(2)}</span>
                <Badge variant={bet.status as any}>
                  {bet.status === "won"
                    ? `✅ ${bet.cashOutMultiplier}x`
                    : bet.status === "lost"
                    ? "💥 perdeu"
                    : "⏳ ativo"}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
