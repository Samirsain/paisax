const postgres = require('postgres');
const db = postgres(process.env.DATABASE_URL, { ssl: 'require' });

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getISTDateString(t) {
  const d = new Date(t + IST_OFFSET_MS);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseGameState(rawState) {
  if (!rawState) return {};
  if (typeof rawState === "string") {
    try { return JSON.parse(rawState); } catch { return {}; }
  }
  if (typeof rawState === "object") return rawState;
  return {};
}

(async () => {
  console.log("Setting up daily_claims table in PostgreSQL...");

  await db`
    CREATE TABLE IF NOT EXISTS daily_claims (
      id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_instance_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      day_number INT NOT NULL,
      claim_date TEXT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'SUCCESS',
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT uq_daily_claims_user_plan_date UNIQUE (user_id, plan_instance_id, claim_date)
    )
  `;

  await db`CREATE INDEX IF NOT EXISTS idx_daily_claims_user_id ON daily_claims(user_id)`;
  await db`CREATE INDEX IF NOT EXISTS idx_daily_claims_claim_date ON daily_claims(claim_date)`;
  await db`CREATE INDEX IF NOT EXISTS idx_daily_claims_created_at ON daily_claims(created_at DESC)`;

  console.log("✓ daily_claims table and indexes ready.");

  // Backfill existing history claims from game_states so transaction history and admin metrics are complete
  const rows = await db`SELECT user_id, state FROM game_states`;
  let backfilled = 0;

  for (const r of rows) {
    const state = parseGameState(r.state);
    const history = Array.isArray(state.history) ? state.history : [];
    const owned = Array.isArray(state.owned) ? state.owned : [];

    for (const h of history) {
      if (h && h.kind === 'claim' && Number(h.coins) > 0) {
        const at = Number(h.at) || Date.now();
        const istDate = getISTDateString(at);
        const dayNumber = Number(h.day) || 1;
        const planId = h.planId || 'free';
        
        // Find matching owned plan or fallback
        const matchingOwned = owned.find(o => o.planId === planId);
        const planInstanceId = matchingOwned?.id || `HIST_${planId}_${r.user_id.slice(0, 8)}`;
        const claimId = h.id || `CLM_${planInstanceId}_D${dayNumber}_${at}`;

        try {
          await db`
            INSERT INTO daily_claims (
              id, user_id, plan_instance_id, plan_id, day_number, claim_date, amount, status, created_at
            ) VALUES (
              ${claimId}, ${r.user_id}, ${planInstanceId}, ${planId}, ${dayNumber}, ${istDate}, ${Number(h.coins)}, 'SUCCESS', ${new Date(at)}
            )
            ON CONFLICT (user_id, plan_instance_id, claim_date) DO NOTHING
          `;
          backfilled++;
        } catch (e) {
          // ignore duplicate or foreign key issue
        }
      }
    }
  }

  console.log(`✓ Backfilled ${backfilled} historical claim records into daily_claims.`);

  const [countRow] = await db`SELECT COUNT(*) as cnt FROM daily_claims`;
  console.log(`Total rows in daily_claims now: ${countRow.cnt}`);

  await db.end();
})().catch(e => {
  console.error("Migration error:", e);
  process.exit(1);
});
