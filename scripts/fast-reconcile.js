const postgres = require('postgres');
require('dotenv').config({ path: 'c:/Users/Sai/Desktop/digi/steady/.env.local' });
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

function parseGameState(rawState) {
  if (!rawState) return {};
  if (typeof rawState === "string") {
    try { return JSON.parse(rawState); } catch { return {}; }
  }
  if (typeof rawState === "object") return rawState;
  return {};
}

async function fastReconcile() {
  console.log("Fetching bulk data from database...");
  const [users, gameStates, allClaims, rechs, gifts, withs, adjs, comms] = await Promise.all([
    sql`SELECT id, name, phone FROM users`,
    sql`SELECT user_id, state FROM game_states`,
    sql`SELECT id, user_id, plan_instance_id, plan_id, day_number, amount, created_at FROM daily_claims WHERE status = 'SUCCESS' ORDER BY created_at ASC`,
    sql`SELECT user_id, COALESCE(SUM(amount), 0) as total FROM orders WHERE plan_id = 'recharge' AND status = 'SUCCESS' GROUP BY user_id`,
    sql`SELECT user_id, COALESCE(SUM(amount), 0) as total FROM gift_card_redemptions GROUP BY user_id`,
    sql`SELECT user_id, balance_type, status, COALESCE(SUM(amount), 0) as total FROM withdrawals GROUP BY user_id, balance_type, status`,
    sql`SELECT user_id, balance_type, COALESCE(SUM(amount), 0) as total FROM wallet_adjustments GROUP BY user_id, balance_type`,
    sql`SELECT recipient_id, COALESCE(SUM(commission_amount), 0) as total FROM referral_commissions WHERE status = 'PAID' GROUP BY recipient_id`,
  ]);

  console.log(`Loaded ${users.length} users, ${gameStates.length} game_states, ${allClaims.length} claims.`);

  // Build maps
  const claimsByUser = new Map();
  for (const c of allClaims) {
    if (!claimsByUser.has(c.user_id)) claimsByUser.set(c.user_id, []);
    claimsByUser.get(c.user_id).push(c);
  }

  const rechMap = new Map();
  for (const r of rechs) rechMap.set(r.user_id, Number(r.total) || 0);

  const giftMap = new Map();
  for (const g of gifts) giftMap.set(g.user_id, Number(g.total) || 0);

  const mainWithMap = new Map();
  const refWithMap = new Map();
  for (const w of withs) {
    const amt = Number(w.total) || 0;
    if (w.status !== 'REJECTED') {
      if (w.balance_type === 'referral') {
        refWithMap.set(w.user_id, (refWithMap.get(w.user_id) || 0) + amt);
      } else {
        mainWithMap.set(w.user_id, (mainWithMap.get(w.user_id) || 0) + amt);
      }
    }
  }

  const mainAdjMap = new Map();
  const refAdjMap = new Map();
  for (const a of adjs) {
    const amt = Number(a.total) || 0;
    if (a.balance_type === 'referral') {
      refAdjMap.set(a.user_id, (refAdjMap.get(a.user_id) || 0) + amt);
    } else {
      mainAdjMap.set(a.user_id, (mainAdjMap.get(a.user_id) || 0) + amt);
    }
  }

  const commMap = new Map();
  for (const c of comms) commMap.set(c.recipient_id, Number(c.total) || 0);

  let updatedCount = 0;

  for (const gsRow of gameStates) {
    const uid = gsRow.user_id;
    const state = parseGameState(gsRow.state);
    const owned = Array.isArray(state.owned) ? state.owned : [];
    const history = Array.isArray(state.history) ? [...state.history] : [];
    const historyIds = new Set(history.map(h => h && h.id));

    const userClaims = claimsByUser.get(uid) || [];
    let modified = false;

    // 1. Reconcile owned plans with claims
    for (const o of owned) {
      if (!o) continue;
      const matching = userClaims.filter(
        c => c.plan_instance_id === o.id || (!o.id && c.plan_id === o.planId)
      );
      if (matching.length > 0) {
        const maxClaimDay = Math.max(...matching.map(c => Number(c.day_number) || 0));
        const maxClaimTime = Math.max(...matching.map(c => new Date(c.created_at).getTime()));
        if ((Number(o.claimed) || 0) < maxClaimDay) {
          o.claimed = maxClaimDay;
          modified = true;
        }
        if ((Number(o.lastClaimAt) || 0) < maxClaimTime) {
          o.lastClaimAt = maxClaimTime;
          modified = true;
        }
      }
    }

    // 2. Reconcile history with daily_claims
    for (const cl of userClaims) {
      if (!historyIds.has(cl.id)) {
        history.unshift({
          id: cl.id,
          at: cl.created_at ? new Date(cl.created_at).getTime() : Date.now(),
          coins: Number(cl.amount) || 0,
          kind: 'claim',
          planId: cl.plan_id,
          day: Number(cl.day_number) || 1,
        });
        historyIds.add(cl.id);
        modified = true;
      }
    }

    // 3. Compute authoritative coins balance
    const rechTotal = rechMap.get(uid) || 0;
    const giftTotal = giftMap.get(uid) || 0;
    const mainWithTotal = mainWithMap.get(uid) || 0;
    const refWithTotal = refWithMap.get(uid) || 0;
    const mainAdjTotal = mainAdjMap.get(uid) || 0;
    const refAdjTotal = refAdjMap.get(uid) || 0;
    const commTotal = (commMap.get(uid) || 0) + refAdjTotal;

    const dbClaimsTotal = userClaims.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    let otherEarnings = 0;
    let walletBuys = 0;
    for (const h of history) {
      if (!h) continue;
      const c = Number(h.coins) || 0;
      if ((h.kind === 'checkin' || h.kind === 'welcome' || h.kind === 'invite') && c > 0) {
        otherEarnings += c;
      }
      if (h.kind === 'buy' && c < 0) {
        walletBuys += Math.abs(c);
      }
    }

    const mainBalance = Math.max(0, rechTotal + giftTotal + dbClaimsTotal + otherEarnings + mainAdjTotal - mainWithTotal - walletBuys);
    const refBalance = Math.max(0, commTotal - refWithTotal);
    const authoritativeBalance = mainBalance + refBalance;

    if (state.coins !== authoritativeBalance) {
      state.coins = authoritativeBalance;
      modified = true;
    }

    state.owned = owned;
    state.history = history;

    if (modified) {
      await sql`
        UPDATE game_states
        SET state = ${JSON.stringify(state)}::jsonb,
            updated_at = now()
        WHERE user_id = ${uid}
      `;
      updatedCount++;

      if (uid === '6ed34c23-4a20-47b0-8059-2a83f469e4b8') {
        console.log(`>>> TARGET USER (Mayank) RECONCILED:`);
        console.log(`    New Coins: ₹${state.coins}`);
        console.log(`    Owned plans:`, JSON.stringify(state.owned, null, 2));
      }
    }
  }

  console.log(`\nAll done! Successfully reconciled ${updatedCount} users.`);
  await sql.end();
}

fastReconcile().catch(err => {
  console.error("Fast reconcile error:", err);
  process.exit(1);
});
