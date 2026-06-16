import { useEffect } from "react";
import { io } from "socket.io-client";
import { useGameStore } from "../stores/game.store";
import { gamesApi } from "../services/api";

const socket = io("http://localhost:8000", { transports: ["websocket"], path: "/socket.io" });

export function useSocket() {
  const store = useGameStore();

  useEffect(() => {
    // Hydrate state from REST on connect so user sees current round immediately
    Promise.all([
      gamesApi.getCurrent().catch(() => null),
      gamesApi.getHistory().catch(() => null),
    ]).then(([currentRes, historyRes]) => {
      const round = currentRes?.data;
      if (round) {
        store.setRoundId(round.id);
        store.setStatus(round.status);
        store.setBets(round.bets ?? []);
        if (round.serverSeedHash) store.setServerSeedHash(round.serverSeedHash);
        if (round.multiplier) store.setMultiplier(round.multiplier);
      }
      const rounds = historyRes?.data?.data ?? [];
      rounds.slice().reverse().forEach((r: any) => {
        store.addHistory({ id: r.id, crashPoint: r.crashPoint });
      });
      store.setHydrated();
    });

    socket.on("betting:started", ({ roundId, serverSeedHash }: { roundId: string; serverSeedHash: string }) => {
      store.setRoundId(roundId);
      store.setServerSeedHash(serverSeedHash);
      store.setStatus("betting");
      store.setMultiplier(1);
      store.setBets([]);
      store.setMyBetStatus(null);
    });

    socket.on("betting:tick", ({ secondsLeft }: { secondsLeft: number }) => {
      store.setSecondsLeft(secondsLeft);
    });

    socket.on("round:started", () => {
      store.setStatus("running");
    });

    socket.on("round:tick", ({ multiplier }: { multiplier: number }) => {
      store.setMultiplier(multiplier);
    });

    socket.on("round:crashed", ({ crashPoint, roundId, bets }: any) => {
      store.setStatus("crashed");
      store.setMultiplier(crashPoint);
      store.setBets(bets);
      store.addHistory({ id: roundId, crashPoint });
    });

    socket.on("bet:placed", (bet: any) => {
      store.addBet(bet);
    });

    socket.on("bet:cashout", ({ id, cashOutMultiplier }: any) => {
      store.updateBet(id, { status: "won", cashOutMultiplier });
    });

    return () => {
      socket.off("betting:started");
      socket.off("betting:tick");
      socket.off("round:started");
      socket.off("round:tick");
      socket.off("round:crashed");
      socket.off("bet:placed");
      socket.off("bet:cashout");
    };
  }, []);
}
