import postgres from "postgres"

const SUPABASE_URL = "postgresql://postgres.dlkkvikhajfujitopkzk:GBNR1Ql0jDzraOlq@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
const NEON_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!NEON_URL) {
  console.error("NEON DATABASE_URL is not set!")
  process.exit(1)
}

const supabase = postgres(SUPABASE_URL, { ssl: "require", max: 5, idle_timeout: 30 })
const neon = postgres(NEON_URL, { ssl: "require", max: 5, idle_timeout: 30 })

async function migrateData() {
  console.log("=========================================")
  console.log("Starting Data Migration: Supabase -> Neon")
  console.log("=========================================")

  // 1. Fetch Users from Supabase
  console.log("\n1. Fetching users from Supabase...")
  const users = await supabase`SELECT * FROM users`
  console.log(`Found ${users.length} users in Supabase.`)

  for (const u of users) {
    await neon`
      INSERT INTO users (
        id, name, phone, pass_hash, invite_code, invited_by, created_at,
        bank_account_name, bank_account_number, bank_name, bank_ifsc, bank_updated_at
      ) VALUES (
        ${u.id}, ${u.name}, ${u.phone}, ${u.pass_hash}, ${u.invite_code}, ${u.invited_by}, ${u.created_at},
        ${u.bank_account_name}, ${u.bank_account_number}, ${u.bank_name}, ${u.bank_ifsc}, ${u.bank_updated_at}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        pass_hash = EXCLUDED.pass_hash,
        invite_code = EXCLUDED.invite_code,
        invited_by = EXCLUDED.invited_by,
        bank_account_name = COALESCE(EXCLUDED.bank_account_name, users.bank_account_name),
        bank_account_number = COALESCE(EXCLUDED.bank_account_number, users.bank_account_number),
        bank_name = COALESCE(EXCLUDED.bank_name, users.bank_name),
        bank_ifsc = COALESCE(EXCLUDED.bank_ifsc, users.bank_ifsc),
        bank_updated_at = COALESCE(EXCLUDED.bank_updated_at, users.bank_updated_at)
    `
  }
  console.log(`✓ Migrated ${users.length} users into Neon.`)

  // 2. Fetch Orders from Supabase
  console.log("\n2. Fetching orders from Supabase...")
  const orders = await supabase`SELECT * FROM orders`
  console.log(`Found ${orders.length} orders in Supabase.`)

  for (const o of orders) {
    await neon`
      INSERT INTO orders (
        id, user_id, plan_id, amount, status, txn_id, pay_url,
        webhook_payload, webhook_received_at, credited_to_wallet, created_at, updated_at
      ) VALUES (
        ${o.id}, ${o.user_id}, ${o.plan_id}, ${o.amount}, ${o.status}, ${o.txn_id}, ${o.pay_url},
        ${o.webhook_payload ? JSON.stringify(o.webhook_payload) : null}::jsonb,
        ${o.webhook_received_at}, ${o.credited_to_wallet}, ${o.created_at}, ${o.updated_at}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        txn_id = COALESCE(EXCLUDED.txn_id, orders.txn_id),
        credited_to_wallet = EXCLUDED.credited_to_wallet,
        updated_at = EXCLUDED.updated_at
    `
  }
  console.log(`✓ Migrated ${orders.length} orders into Neon.`)

  // 3. Fetch Withdrawals from Supabase
  console.log("\n3. Fetching withdrawals from Supabase...")
  const withdrawals = await supabase`SELECT * FROM withdrawals`
  console.log(`Found ${withdrawals.length} withdrawals in Supabase.`)

  for (const w of withdrawals) {
    await neon`
      INSERT INTO withdrawals (
        id, user_id, account_name, account_number, bank_name, ifsc_code,
        amount, fee, net_amount, status, utr, admin_note, created_at, updated_at
      ) VALUES (
        ${w.id}, ${w.user_id}, ${w.account_name}, ${w.account_number}, ${w.bank_name}, ${w.ifsc_code},
        ${w.amount}, ${w.fee}, ${w.net_amount}, ${w.status}, ${w.utr}, ${w.admin_note}, ${w.created_at}, ${w.updated_at}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        utr = COALESCE(EXCLUDED.utr, withdrawals.utr),
        admin_note = COALESCE(EXCLUDED.admin_note, withdrawals.admin_note),
        updated_at = EXCLUDED.updated_at
    `
  }
  console.log(`✓ Migrated ${withdrawals.length} withdrawals into Neon.`)

  // 4. Fetch Referral Commissions from Supabase
  console.log("\n4. Fetching referral_commissions from Supabase...")
  const commissions = await supabase`SELECT * FROM referral_commissions`.catch(() => [])
  console.log(`Found ${commissions.length} referral commissions in Supabase.`)

  for (const c of commissions) {
    await neon`
      INSERT INTO referral_commissions (
        id, order_id, payer_id, recipient_id, level, percent, order_amount, commission_amount, status, created_at
      ) VALUES (
        ${c.id}, ${c.order_id}, ${c.payer_id}, ${c.recipient_id}, ${c.level}, ${c.percent}, ${c.order_amount}, ${c.commission_amount}, ${c.status}, ${c.created_at}
      )
      ON CONFLICT (order_id, recipient_id, level) DO NOTHING
    `
  }
  console.log(`✓ Migrated ${commissions.length} commissions into Neon.`)

  // 5. Fetch and Merge Game States
  console.log("\n5. Fetching game_states from Supabase and ensuring all paid plans are active...")
  const gameStates = await supabase`SELECT * FROM game_states`
  console.log(`Found ${gameStates.length} game_states in Supabase.`)

  // Create a map of user_id -> paid orders
  const paidOrdersByUser = new Map<string, any[]>()
  for (const o of orders) {
    if (o.status === "SUCCESS" || o.credited_to_wallet) {
      const list = paidOrdersByUser.get(o.user_id) || []
      list.push(o)
      paidOrdersByUser.set(o.user_id, list)
    }
  }

  for (const gs of gameStates) {
    let state = typeof gs.state === "string" ? JSON.parse(gs.state) : gs.state
    if (!state) state = {}
    if (!Array.isArray(state.owned)) state.owned = []
    if (!Array.isArray(state.history)) state.history = []

    const userPaidOrders = paidOrdersByUser.get(gs.user_id) || []
    let updated = false

    // Guarantee that every paid order is in state.owned!
    for (const order of userPaidOrders) {
      if (order.plan_id !== "recharge") {
        const hasPlan = state.owned.some((o: any) => o.id === order.id || o.planId === order.plan_id)
        if (!hasPlan) {
          const buyTime = order.created_at ? new Date(order.created_at).getTime() : Date.now()
          state.owned.push({
            id: order.id,
            planId: order.plan_id,
            claimed: 0,
            boughtAt: buyTime,
            lastClaimAt: null
          })
          state.history.unshift({
            id: `BUY_${order.id}`,
            at: buyTime,
            coins: 0,
            kind: "buy",
            planId: order.plan_id
          })
          updated = true
          console.log(`Restored missing plan ${order.plan_id} (order ${order.id}) for user ${gs.user_id}`)
        }
      }
    }

    await neon`
      INSERT INTO game_states (user_id, state, updated_at)
      VALUES (${gs.user_id}, ${JSON.stringify(state)}::jsonb, ${gs.updated_at || new Date().toISOString()})
      ON CONFLICT (user_id) DO UPDATE SET
        state = EXCLUDED.state,
        updated_at = EXCLUDED.updated_at
    `
  }
  console.log(`✓ Migrated and verified ${gameStates.length} game states into Neon.`)

  console.log("\n=========================================")
  console.log("🎉 Migration completed successfully!")
  console.log("=========================================")

  await supabase.end()
  await neon.end()
}

migrateData().catch((err) => {
  console.error("Migration error:", err)
  process.exit(1)
})
