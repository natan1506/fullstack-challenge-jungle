import { useSocket } from "../hooks/useSocket";
import { MultiplierDisplay } from "../components/MultiplierDisplay";
import { BetControls } from "../components/BetControls";
import { BetList } from "../components/BetList";
import { RoundHistory } from "../components/RoundHistory";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import { walletApi } from "../services/api";
import { useGameStore } from "../stores/game.store";
import { Button } from "@/components/ui/button";

export function GamePage() {
  const auth = useAuth();
  const { serverSeedHash } = useGameStore();
  useSocket();

  useEffect(() => {
    if (auth.user?.access_token) {
      localStorage.setItem("access_token", auth.user.access_token);
      walletApi.create().catch(() => {});
    }
  }, [auth.user]);

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
        <div className="w-full max-w-sm bg-[#13131a] border border-[#1f1f2e] rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.1)] p-8 flex flex-col gap-6">
          <div className="text-center">
            <p className="text-purple-400 text-2xl font-black tracking-wide mb-1">🎰 Crash Game</p>
            <p className="text-gray-400 text-sm">Faça login para começar a jogar</p>
          </div>
          <Button size="lg" className="w-full text-base" onClick={() => auth.signinRedirect()}>
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-white">🎰 Crash Game</h1>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{auth.user?.profile?.preferred_username}</span>
            <Button variant="ghost" size="sm" onClick={() => auth.signoutRedirect()}>
              Sair
            </Button>
          </div>
        </div>

        <RoundHistory />
        <MultiplierDisplay />

        {serverSeedHash && (
          <p className="text-center text-xs text-gray-600 font-mono">
            🔐 seed hash: {serverSeedHash}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BetControls />
          <BetList />
        </div>
      </div>
    </div>
  );
}
