const postgres = require("postgres");

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No DATABASE_URL found");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require" });

async function main() {
  console.log("Creating broadcast_notifications table...");
  await sql`
    CREATE TABLE IF NOT EXISTS broadcast_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      url TEXT,
      target TEXT NOT NULL DEFAULT 'ALL',
      sent_by TEXT NOT NULL DEFAULT 'ADMIN',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  console.log("✓ broadcast_notifications table created successfully");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
