import postgres from "postgres"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const connectionString = process.env.DATABASE_URL

// Vercel serverless: no persistent connections, use short-lived pool
const globalForDb = globalThis as unknown as { _db: ReturnType<typeof postgres> | undefined }

export const db =
  globalForDb._db ??
  postgres(connectionString, {
    ssl: "require",
    max: 3,
    idle_timeout: 20,
    connect_timeout: 30,
    max_lifetime: 60 * 30,
    // Vercel functions are short-lived — don't keep idle connections
    connection: {
      application_name: "paisax",
    },
  })

if (process.env.NODE_ENV !== "production") globalForDb._db = db
