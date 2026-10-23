import postgres from "postgres"

const db = postgres(process.env.DATABASE_URL!, { ssl: "require" })

async function migrate() {
  console.log("Running PaisaX schema migration...")

  await db`
    CREATE TABLE IF NOT EXISTS users (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT NOT NULL,
      phone       TEXT NOT NULL UNIQUE,
      pass_hash   TEXT NOT NULL,
      invite_code TEXT NOT NULL UNIQUE,
      invited_by  TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  console.log("✓ users table")

  await db`
    CREATE TABLE IF NOT EXISTS game_states (
      user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      state       JSONB NOT NULL DEFAULT '{}',
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  console.log("✓ game_states table")

  await db`
    CREATE TABLE IF NOT EXISTS orders (
      id                  TEXT PRIMARY KEY,
      user_id             UUID NOT NULL REFERENCES users(id),
      plan_id             TEXT NOT NULL,
      amount              INT NOT NULL,
      status              TEXT NOT NULL DEFAULT 'PENDING',
      txn_id              TEXT,
      pay_url             TEXT,
      webhook_payload     JSONB,
      webhook_received_at TIMESTAMPTZ,
      credited_to_wallet  BOOLEAN DEFAULT false,
      created_at          TIMESTAMPTZ DEFAULT now(),
      updated_at          TIMESTAMPTZ DEFAULT now()
    )
  `
  console.log("✓ orders table")

  await db`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id             TEXT PRIMARY KEY,
      user_id        UUID NOT NULL REFERENCES users(id),
      account_name   TEXT NOT NULL,
      account_number TEXT NOT NULL,
      bank_name      TEXT,
      ifsc_code      TEXT NOT NULL,
      amount         INT NOT NULL,
      fee            INT NOT NULL,
      net_amount     INT NOT NULL,
      status         TEXT NOT NULL DEFAULT 'PENDING',
      utr            TEXT,
      admin_note     TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  console.log("✓ withdrawals table")

  console.log("✅ Migration complete!")
  await db.end()
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
