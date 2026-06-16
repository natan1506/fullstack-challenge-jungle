/**
 * E2E tests for Wallet Service.
 * Requires: docker compose up (keycloak + wallets running)
 *
 * Run: bun test tests/e2e
 */

import { describe, it, expect, beforeAll } from "bun:test";

const BASE_URL = process.env.WALLETS_URL ?? "http://localhost:4002";
const KEYCLOAK_URL = process.env.KEYCLOAK_URL ?? "http://localhost:8080";
const CLIENT_ID = "crash-game-client";
const USERNAME = "player";
const PASSWORD = "player123";

let accessToken: string;

async function getToken(username = USERNAME, password = PASSWORD): Promise<string> {
  const res = await fetch(
    `${KEYCLOAK_URL}/realms/crash-game/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: CLIENT_ID,
        username,
        password,
      }),
    },
  );
  if (!res.ok) throw new Error(`Auth failed: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

beforeAll(async () => {
  accessToken = await getToken();
});

describe("Wallet E2E", () => {
  it("GET /health returns ok", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("status");
  });

  it("POST / creates wallet or returns 409 if exists", async () => {
    const res = await fetch(`${BASE_URL}/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([201, 409]).toContain(res.status);
  });

  it("GET /me returns wallet with balance", async () => {
    const res = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("playerId");
    expect(body).toHaveProperty("balance");
    expect(typeof body.balance).toBe("number");
  });

  it("GET /me requires authentication", async () => {
    const res = await fetch(`${BASE_URL}/me`);
    expect(res.status).toBe(401);
  });

  it("POST / requires authentication", async () => {
    const res = await fetch(`${BASE_URL}/`, { method: "POST" });
    expect(res.status).toBe(401);
  });
});
