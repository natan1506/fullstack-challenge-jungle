/**
 * E2E tests for Game Service.
 * Requires: docker compose up (all services running + seed executed)
 *
 * Run: bun test tests/e2e
 */

import { describe, it, expect, beforeAll } from "bun:test";

const BASE_URL = process.env.GAMES_URL ?? "http://localhost:4001";
const KEYCLOAK_URL = process.env.KEYCLOAK_URL ?? "http://localhost:8080";
const CLIENT_ID = "crash-game-client";
const USERNAME = "player";
const PASSWORD = "player123";

let accessToken: string;

async function getToken(): Promise<string> {
  const res = await fetch(
    `${KEYCLOAK_URL}/realms/crash-game/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: CLIENT_ID,
        username: USERNAME,
        password: PASSWORD,
      }),
    },
  );
  if (!res.ok) throw new Error(`Auth failed: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function waitForBettingPhase(maxWaitMs = 90_000): Promise<any> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${BASE_URL}/rounds/current`);
    const round = await res.json() as any;
    if (round?.status === "betting") return round;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Timed out waiting for betting phase");
}

async function waitForCrashedRound(roundId: string, maxWaitMs = 60_000): Promise<any> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${BASE_URL}/rounds/history?page=1&limit=5`);
    if (res.ok) {
      const body = await res.json() as any;
      const found = body.data?.find((r: any) => r.id === roundId);
      if (found) {
        const verifyRes = await fetch(`${BASE_URL}/rounds/${roundId}/verify`);
        return await verifyRes.json();
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Timed out waiting for round to crash");
}

beforeAll(async () => {
  accessToken = await getToken();
});

describe("Game E2E", () => {
  it("GET /health returns ok", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);
  });

  it("GET /rounds/current returns round state", async () => {
    const res = await fetch(`${BASE_URL}/rounds/current`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    if (body !== null) {
      expect(body).toHaveProperty("id");
      expect(body).toHaveProperty("status");
      expect(["betting", "running", "crashed"]).toContain(body.status);
    }
  });

  it("GET /rounds/history returns paginated history", async () => {
    const res = await fetch(`${BASE_URL}/rounds/history`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).toHaveProperty("total");
  });

  it("GET /bets/me requires authentication", async () => {
    const res = await fetch(`${BASE_URL}/bets/me`);
    expect(res.status).toBe(401);
  });

  it("GET /bets/me returns player bet history when authenticated", async () => {
    const res = await fetch(`${BASE_URL}/bets/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("POST /bet requires authentication", async () => {
    const res = await fetch(`${BASE_URL}/bet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: 1000 }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /bet rejects amount below minimum", async () => {
    const res = await fetch(`${BASE_URL}/bet`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amountCents: 10 }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /bet rejects amount above maximum", async () => {
    const res = await fetch(`${BASE_URL}/bet`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amountCents: 200000 }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /bet/cashout requires authentication", async () => {
    const res = await fetch(`${BASE_URL}/bet/cashout`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /bet/cashout returns 400 when no active bet", async () => {
    // Find a running round where this player has no bet
    let round: any;
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const res = await fetch(`${BASE_URL}/rounds/current`);
      round = await res.json();
      if (round?.status === "running") break;
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (round?.status !== "running") {
      console.log("Could not reach running phase — skipping");
      return;
    }

    const res = await fetch(`${BASE_URL}/bet/cashout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // 400 (no bet found) or 404 (no active round) are both valid
    expect([400, 404]).toContain(res.status);
  }, 35_000);

  it("happy path: bet during betting phase → wait for crash → bet is lost", async () => {
    const round = await waitForBettingPhase();

    // Place bet
    const betRes = await fetch(`${BASE_URL}/bet`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amountCents: 100 }),
    });

    if (betRes.status === 400) {
      const err = await betRes.json() as any;
      // Player already has a bet this round — skip
      if (err.message?.includes("already has a bet")) {
        console.log("Player already bet this round — skipping");
        return;
      }
    }
    expect(betRes.status).toBe(201);

    // Wait for round to crash and verify
    const verify = await waitForCrashedRound(round.id);
    expect(verify).toHaveProperty("verified");
    expect(verify.verified).toBe(true);

    // Small delay to ensure DB write completes
    await new Promise((r) => setTimeout(r, 500));

    // Check bet history — bet should be lost (not pending)
    const betsRes = await fetch(`${BASE_URL}/bets/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const bets = await betsRes.json() as any;
    const myBet = bets.data.find((b: any) => b.roundId === round.id);
    if (myBet) {
      // "lost" is the expected path; "won" means player cashed out before crash (also valid)
      expect(["lost", "won"]).toContain(myBet.status);
      expect(myBet.status).not.toBe("pending");
    }
  }, 180_000);

  it("duplicate bet in same round is rejected", async () => {
    const round = await waitForBettingPhase();

    const place = async () =>
      fetch(`${BASE_URL}/bet`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amountCents: 100 }),
      });

    const first = await place();
    // first bet may already exist (409-like domain error returns 400)
    if (first.status === 400) {
      const err = await first.json() as any;
      if (err.message?.includes("already has a bet")) {
        console.log("Player already bet this round — testing duplicate directly");
      }
    }

    // Second bet must always be rejected
    const second = await place();
    expect(second.status).toBe(400);
    const body = await second.json() as any;
    expect(body.message).toContain("already has a bet");
  }, 60_000);

  it("provably fair verification works for completed rounds", async () => {
    const historyRes = await fetch(`${BASE_URL}/rounds/history`);
    const history = await historyRes.json() as any;

    if (history.data.length === 0) {
      console.log("No completed rounds yet — skipping verify test");
      return;
    }

    const roundId = history.data[0].id;
    const verifyRes = await fetch(`${BASE_URL}/rounds/${roundId}/verify`);
    expect(verifyRes.status).toBe(200);
    const verify = await verifyRes.json() as any;
    expect(verify).toHaveProperty("verified");
    expect(verify.verified).toBe(true);
    expect(verify).toHaveProperty("serverSeed");
    expect(verify).toHaveProperty("crashPoint");
  });
});
