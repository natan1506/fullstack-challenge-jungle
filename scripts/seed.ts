const KEYCLOAK_URL = process.env.KEYCLOAK_URL ?? "http://localhost:8080";
const WALLETS_URL = process.env.WALLETS_URL ?? "http://localhost:4002";
const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://admin:admin@localhost:5432/wallets";

const TEST_PLAYER = { username: "player", password: "player123" };
const INITIAL_BALANCE_CENTS = "100000"; // R$1000,00

async function waitForService(url: string, name: string, retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {}
    console.log(`Waiting for ${name}... (${i + 1}/${retries})`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`${name} not ready after ${retries} retries`);
}

async function getPlayerToken(): Promise<string> {
  const res = await fetch(
    `${KEYCLOAK_URL}/realms/crash-game/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "crash-game-client",
        username: TEST_PLAYER.username,
        password: TEST_PLAYER.password,
      }),
    },
  );
  if (!res.ok) throw new Error(`Player login failed: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function ensureWallet(playerToken: string): Promise<string> {
  const createRes = await fetch(`${WALLETS_URL}/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${playerToken}` },
  });

  if (createRes.status === 409) {
    console.log("Wallet already exists");
  } else if (!createRes.ok) {
    throw new Error(`Create wallet failed: ${await createRes.text()}`);
  } else {
    const w = await createRes.json();
    console.log(`Wallet created: ${w.id}`);
  }

  // Parse sub from JWT
  const payload = JSON.parse(
    Buffer.from(playerToken.split(".")[1], "base64url").toString(),
  );
  return payload.sub as string;
}

async function creditWallet(playerId: string) {
  const { Client } = await import("pg");
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const { rows } = await client.query(
    "SELECT balance_cents FROM wallets WHERE player_id = $1",
    [playerId],
  );

  if (rows.length === 0) {
    console.log("Wallet not found in DB yet — skipping credit");
    await client.end();
    return;
  }

  const current = BigInt(rows[0].balance_cents);
  if (current >= BigInt(INITIAL_BALANCE_CENTS)) {
    console.log(`Balance already R$${Number(current) / 100} — skipping credit`);
    await client.end();
    return;
  }

  await client.query(
    "UPDATE wallets SET balance_cents = $1 WHERE player_id = $2",
    [INITIAL_BALANCE_CENTS, playerId],
  );
  console.log(`Balance set → R$${Number(INITIAL_BALANCE_CENTS) / 100}`);
  await client.end();
}

async function main() {
  console.log("🌱 Starting seed...\n");

  await waitForService(`${KEYCLOAK_URL}/realms/crash-game`, "Keycloak");
  console.log("✅ Keycloak ready");

  await waitForService(`${WALLETS_URL}/health`, "Wallets service");
  console.log("✅ Wallets service ready");

  const playerToken = await getPlayerToken();
  console.log("✅ Player authenticated");

  const playerId = await ensureWallet(playerToken);
  console.log("✅ Wallet ready");

  await creditWallet(playerId);
  console.log("✅ Balance ready");

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test player ready:
  Username: ${TEST_PLAYER.username}
  Password: ${TEST_PLAYER.password}
  Balance:  R$${Number(INITIAL_BALANCE_CENTS) / 100}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
