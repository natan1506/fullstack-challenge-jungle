import { useState } from "react";
import { gamesApi, walletApi } from "../services/api";
import { useGameStore } from "../stores/game.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";
import { toast } from "./Toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BetControls() {
  const [amount, setAmount] = useState("10.00");
  const { status, myBetStatus, setMyBetStatus, multiplier } = useGameStore();
  const qc = useQueryClient();
  const auth = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => walletApi.getMe(auth.user?.access_token).then((r) => r.data),
    refetchInterval: 3000,
    enabled: !!auth.user?.access_token,
  });

  const betMutation = useMutation({
    mutationFn: () => gamesApi.placeBet(Math.round(parseFloat(amount) * 100)),
    onSuccess: () => {
      setMyBetStatus("pending");
      qc.invalidateQueries({ queryKey: ["wallet"] });
      toast("Aposta realizada!", "success");
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message ?? "Erro ao apostar";
      toast(Array.isArray(msg) ? msg.join(", ") : msg, "error");
    },
  });

  const cashOutMutation = useMutation({
    mutationFn: () => gamesApi.cashOut(),
    onSuccess: () => {
      setMyBetStatus("won");
      qc.invalidateQueries({ queryKey: ["wallet"] });
      toast(`Cash out em ${multiplier.toFixed(2)}x! 💰`, "success");
    },
    onError: (e: any) => {
      const msg = e.response?.data?.message ?? "Erro ao sacar";
      toast(Array.isArray(msg) ? msg.join(", ") : msg, "error");
    },
  });

  const amountValue = parseFloat(amount) || 0;
  const balance = wallet ? Number(wallet.balance) : 0;
  const canBet = status === "betting" && !myBetStatus;
  const canCashOut = status === "running" && myBetStatus === "pending";

  function handleBet() {
    if (amountValue < 1) { toast("Aposta mínima: R$ 1,00", "error"); return; }
    if (amountValue > 1000) { toast("Aposta máxima: R$ 1.000,00", "error"); return; }
    if (amountValue > balance) { toast("Saldo insuficiente", "error"); return; }
    betMutation.mutate();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Controles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Saldo</span>
          <span className="text-green-400 font-bold text-lg">
            {wallet ? `R$ ${balance.toFixed(2)}` : "..."}
          </span>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            max="1000"
            step="1"
            disabled={!canBet}
            placeholder="Valor (R$)"
          />
          <Button
            onClick={handleBet}
            disabled={!canBet || betMutation.isPending}
            variant="success"
          >
            {betMutation.isPending ? "..." : "Apostar"}
          </Button>
        </div>

        {canCashOut && (
          <Button
            onClick={() => cashOutMutation.mutate()}
            disabled={cashOutMutation.isPending}
            variant="warning"
            size="lg"
            className="w-full text-base font-bold"
          >
            {cashOutMutation.isPending ? "..." : `💰 Cash Out ${multiplier.toFixed(2)}x`}
          </Button>
        )}

        {myBetStatus === "won" && status !== "running" && (
          <p className="text-green-400 text-center font-bold text-sm">✅ Saque realizado!</p>
        )}
        {myBetStatus === "pending" && status === "crashed" && (
          <p className="text-red-400 text-center font-bold text-sm">💥 Aposta perdida</p>
        )}
      </CardContent>
    </Card>
  );
}
