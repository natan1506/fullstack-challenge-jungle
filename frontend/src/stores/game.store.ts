import { create } from "zustand";

export type RoundStatus = "betting" | "running" | "crashed";

export interface Bet {
  id: string;
  username: string;
  amountCents: string;
  status: string;
  cashOutMultiplier: number | null;
}

interface GameState {
  roundId: string | null;
  serverSeedHash: string | null;
  hydrated: boolean;
  status: RoundStatus;
  multiplier: number;
  bets: Bet[];
  secondsLeft: number;
  history: { id: string; crashPoint: number }[];
  myBetStatus: string | null;

  setRoundId: (id: string) => void;
  setServerSeedHash: (hash: string) => void;
  setStatus: (s: RoundStatus) => void;
  setMultiplier: (m: number) => void;
  setBets: (bets: Bet[]) => void;
  addBet: (bet: Bet) => void;
  updateBet: (id: string, updates: Partial<Bet>) => void;
  setSecondsLeft: (s: number) => void;
  addHistory: (item: { id: string; crashPoint: number }) => void;
  setMyBetStatus: (s: string | null) => void;
  setHydrated: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  roundId: null,
  serverSeedHash: null,
  hydrated: false,
  status: "betting",
  multiplier: 1,
  bets: [],
  secondsLeft: 20,
  history: [],
  myBetStatus: null,

  setRoundId: (id) => set({ roundId: id }),
  setServerSeedHash: (hash) => set({ serverSeedHash: hash }),
  setStatus: (status) => set({ status }),
  setMultiplier: (multiplier) => set({ multiplier }),
  setBets: (bets) => set({ bets }),
  addBet: (bet) => set((s) => ({ bets: [...s.bets, bet] })),
  updateBet: (id, updates) =>
    set((s) => ({ bets: s.bets.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),
  setSecondsLeft: (secondsLeft) => set({ secondsLeft }),
  addHistory: (item) => set((s) => ({ history: [item, ...s.history].slice(0, 20) })),
  setMyBetStatus: (myBetStatus) => set({ myBetStatus }),
  setHydrated: () => set({ hydrated: true }),
}));
