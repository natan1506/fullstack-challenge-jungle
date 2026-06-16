import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const walletApi = {
  create: () => api.post("/wallets"),
  getMe: (token?: string) =>
    api.get("/wallets/me", token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
};

export const gamesApi = {
  getCurrent: () => api.get("/games/rounds/current"),
  getHistory: (page = 1) => api.get(`/games/rounds/history?page=${page}&limit=20`),
  placeBet: (amountCents: number) => api.post("/games/bet", { amountCents }),
  cashOut: () => api.post("/games/bet/cashout"),
  getMyBets: () => api.get("/games/bets/me"),
};
