import postgres from "postgres"

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!
const db = postgres(connectionString, { ssl: "require" })

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

  // Add saved bank account columns to users table
  await db`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
  `
  await db`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
  `
  await db`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name TEXT;
  `
  await db`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_ifsc TEXT;
  `
  await db`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_updated_at TIMESTAMPTZ;
  `
  console.log("✓ users table bank details columns")

  // Backfill any user's bank details from their latest withdrawal if not set
  await db`
    UPDATE users u
    SET bank_account_name = w.account_name,
        bank_account_number = w.account_number,
        bank_name = w.bank_name,
        bank_ifsc = w.ifsc_code,
        bank_updated_at = w.created_at
    FROM (
      SELECT DISTINCT ON (user_id) user_id, account_name, account_number, bank_name, ifsc_code, created_at
      FROM withdrawals
      ORDER BY user_id, created_at DESC
    ) w
    WHERE u.id = w.user_id AND u.bank_account_number IS NULL;
  `
  // Add referral_commissions table for 3-level MLM referral rewards
  await db`
    CREATE TABLE IF NOT EXISTS referral_commissions (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id          TEXT NOT NULL,
      payer_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      level             INT NOT NULL,
      percent           NUMERIC(5, 2) NOT NULL,
      order_amount      INT NOT NULL,
      commission_amount NUMERIC(10, 2) NOT NULL,
      status            TEXT NOT NULL DEFAULT 'PAID',
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT unique_order_recipient_level UNIQUE (order_id, recipient_id, level)
    );
  `
  await db`CREATE INDEX IF NOT EXISTS idx_ref_comm_recipient ON referral_commissions(recipient_id);`
  await db`CREATE INDEX IF NOT EXISTS idx_ref_comm_order ON referral_commissions(order_id);`
  await db`CREATE INDEX IF NOT EXISTS idx_ref_comm_payer ON referral_commissions(payer_id);`
  // Add gift_cards and gift_card_redemptions tables
  await db`
    CREATE TABLE IF NOT EXISTS gift_cards (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code        TEXT NOT NULL UNIQUE,
      amount      INT NOT NULL,
      max_uses    INT NOT NULL DEFAULT 1,
      used_count  INT NOT NULL DEFAULT 0,
      is_active   BOOLEAN NOT NULL DEFAULT true,
      created_by  TEXT DEFAULT 'admin',
      note        TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at  TIMESTAMPTZ
    );
  `
  await db`CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(UPPER(code));`
  console.log("✓ gift_cards table and index")

  await db`
    CREATE TABLE IF NOT EXISTS gift_card_redemptions (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      card_id       UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
      user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code          TEXT NOT NULL,
      amount        INT NOT NULL,
      redeemed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT unique_card_user_redemption UNIQUE (card_id, user_id)
    );
  `
  await db`CREATE INDEX IF NOT EXISTS idx_gift_card_redemptions_user ON gift_card_redemptions(user_id);`
  await db`CREATE INDEX IF NOT EXISTS idx_gift_card_redemptions_card ON gift_card_redemptions(card_id);`
  console.log("✓ gift_card_redemptions table and indexes")

  console.log("✅ Migration complete!")
  await db.end()
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
