import postgres from "postgres"

const connectionString = process.env.DATABASE_URL!

// Single shared connection (Next.js hot-reload safe via global cache)
const globalForDb = globalThis as unknown as { _db: ReturnType<typeof postgres> | undefined }

export const db =
  globalForDb._db ??
  postgres(connectionString, {
    ssl: "require",
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  })

if (process.env.NODE_ENV !== "production") globalForDb._db = db
