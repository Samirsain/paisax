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
    CREATE TABLE IF NOT EXISTS referrals (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referrer_id UUID NOT NULL REFERENCES users(id),
      referred_id UUID NOT NULL REFERENCES users(id),
      bonus_paid  BOOLEAN NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  console.log("✓ referrals table")

  console.log("✅ Migration complete!")
  await db.end()
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
