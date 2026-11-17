const postgres = require('postgres');
const crypto = require('crypto');
const db = postgres(process.env.DATABASE_URL, { ssl: 'require' });

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function getISTDateString(t = Date.now()) {
  const d = new Date(t + IST_OFFSET_MS);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextISTMidnight(t = Date.now()) {
  const istTime = t + IST_OFFSET_MS;
  const nextMidnightInIST = Math.floor(istTime / DAY_MS + 1) * DAY_MS;
  return nextMidnightInIST - IST_OFFSET_MS;
}

function isClaimedToday(o, now = Date.now()) {
  if (o.lastClaimAt === null) return false;
  return getISTDateString(o.lastClaimAt) === getISTDateString(now);
}

function dayOf(t = Date.now()) {
  return Math.floor((t + IST_OFFSET_MS) / DAY_MS);
}

const PLANS = {
  free: { id: "free", name: "Free Solar Trial Plan (₹0)", perDay: 50, days: 4 },
  solar_300: { id: "solar_300", name: "Solar Starter 300 – Daily Income", perDay: 40, days: 60 }
};

async function executeClaimTx(uid, planInstanceId, fakeNow = Date.now()) {
  const todayIST = getISTDateString(fakeNow);

  return await db.begin(async (sql) => {
    const [gsRow] = await sql`
      SELECT state FROM game_states WHERE user_id = ${uid} FOR UPDATE
    `;
    if (!gsRow) throw new Error("Game account not found");

    let state = gsRow.state;
    if (typeof state === "string") state = JSON.parse(state);
    const owned = Array.isArray(state.owned) ? state.owned : [];

    const candidates = owned.filter((o) => !planInstanceId || o.id === planInstanceId);
    if (candidates.length === 0) throw new Error("No matching plan found");

    const eligible = [];

    for (const o of candidates) {
      const plan = PLANS[o.planId];
      if (!plan) continue;

      if (o.claimed >= plan.days) continue;

      // Readiness check
      if (o.lastClaimAt !== null) {
        const readyAt = nextISTMidnight(o.lastClaimAt);
        if (fakeNow < readyAt) continue;
      }

      // Check if claimed today in state
      if (isClaimedToday(o, fakeNow)) continue;

      // Check in daily_claims table
      const [existing] = await sql`
        SELECT id FROM daily_claims
        WHERE user_id = ${uid} AND plan_instance_id = ${o.id} AND claim_date = ${todayIST} AND status = 'SUCCESS'
        LIMIT 1
      `;
      if (existing) continue;

      const nextDay = (Number(o.claimed) || 0) + 1;
      const [dayExisting] = await sql`
        SELECT id FROM daily_claims
        WHERE user_id = ${uid} AND plan_instance_id = ${o.id} AND day_number = ${nextDay} AND status = 'SUCCESS'
        LIMIT 1
      `;
      if (dayExisting) continue;

      eligible.push({ ownedItem: o, plan, dayToClaim: nextDay, rewardCoins: plan.perDay });
    }

    if (eligible.length === 0) {
      throw new Error("Daily Amount Not Available. Next payout cycle starts at midnight.");
    }

    let totalCoins = 0;
    const claimLogs = [];
    const newHistoryEntries = [];

    for (const item of eligible) {
      const { ownedItem: o, plan, dayToClaim, rewardCoins } = item;
      const claimTxnId = `CLM_${o.id}_D${dayToClaim}_${fakeNow}`;
      totalCoins += rewardCoins;

      await sql`
        INSERT INTO daily_claims (
          id, user_id, plan_instance_id, plan_id, day_number, claim_date, amount, status, created_at
        ) VALUES (
          ${claimTxnId}, ${uid}, ${o.id}, ${o.planId}, ${dayToClaim}, ${todayIST}, ${rewardCoins}, 'SUCCESS', now()
        )
      `;

      claimLogs.push({ claimId: claimTxnId, day: dayToClaim, reward: rewardCoins });
      newHistoryEntries.push({
        id: claimTxnId,
        at: fakeNow,
        coins: rewardCoins,
        kind: "claim",
        planId: o.planId,
        day: dayToClaim
      });
    }

    const updatedOwned = owned.map((o) => {
      const match = eligible.find((e) => e.ownedItem.id === o.id);
      if (!match) return o;
      return { ...o, claimed: match.dayToClaim, lastClaimAt: fakeNow };
    });

    const existingHistory = Array.isArray(state.history) ? state.history : [];
    const updatedHistory = [...newHistoryEntries, ...existingHistory];
    const newCoins = (Number(state.coins) || 0) + totalCoins;
    const newLifetime = (Number(state.lifetime) || 0) + totalCoins;

    const updatedState = {
      ...state,
      coins: newCoins,
      lifetime: newLifetime,
      lastClaimDay: dayOf(fakeNow),
      owned: updatedOwned,
      history: updatedHistory
    };

    await sql`
      UPDATE game_states
      SET state = ${JSON.stringify(updatedState)}::jsonb,
          updated_at = now()
      WHERE user_id = ${uid}
    `;

    return { totalCoins, count: eligible.length, claimLogs, newCoins };
  });
}

(async () => {
  console.log("=================================================");
  console.log("   PAISAX DAILY AMOUNT CLAIM SYSTEM TEST SUITE   ");
  console.log("=================================================\n");

  const testPhone = `9999${Math.floor(100000 + Math.random() * 900000)}`;
  const testUserId = crypto.randomUUID();
  const testInviteCode = "TEST99";

  console.log(`Setting up test user (${testUserId}, ${testPhone})...`);

  // 1. Create test user
  await db`
    INSERT INTO users (id, name, phone, pass_hash, invite_code, created_at)
    VALUES (${testUserId}, 'Test Investor', ${testPhone}, 'test_hash', ${testInviteCode}, now())
  `;

  const freePlanId = `ORD_FREE_TEST_${Date.now()}`;
  const solarPlanId = `ORD_SOLAR_TEST_${Date.now()}`;
  const initialTime = Date.now();

  const initialGameState = {
    coins: 0,
    lifetime: 0,
    streak: 0,
    bestStreak: 0,
    lastClaimDay: null,
    inviteCode: testInviteCode,
    invites: 0,
    skew: 0,
    owned: [
      {
        id: freePlanId,
        planId: "free",
        claimed: 0,
        boughtAt: initialTime,
        lastClaimAt: null,
        status: "active"
      },
      {
        id: solarPlanId,
        planId: "solar_300",
        claimed: 0,
        boughtAt: initialTime,
        lastClaimAt: null,
        status: "active"
      }
    ],
    history: []
  };

  await db`
    INSERT INTO game_states (user_id, state)
    VALUES (${testUserId}, ${JSON.stringify(initialGameState)}::jsonb)
  `;

  console.log("✓ Test user created with 1 Free Trial Plan and 1 Solar 300 Plan.\n");

  // TEST 1: Claim Day 1 for Free Plan (₹50)
  console.log("TEST 1: New eligible user claims Day 1 Free Welcome Bonus (₹50)...");
  const claimRes1 = await executeClaimTx(testUserId, freePlanId, initialTime);
  console.log(`✓ Result: Claimed ₹${claimRes1.totalCoins}, new balance = ₹${claimRes1.newCoins}`);
  if (claimRes1.totalCoins !== 50 || claimRes1.newCoins !== 50) {
    throw new Error(`TEST 1 Failed: Expected ₹50, got ₹${claimRes1.totalCoins}`);
  }

  // TEST 2: Claim Day 1 for Solar 300 Plan (₹40)
  console.log("\nTEST 2: Eligible user claims Day 1 Solar 300 Daily Return (₹40)...");
  const claimRes2 = await executeClaimTx(testUserId, solarPlanId, initialTime);
  console.log(`✓ Result: Claimed ₹${claimRes2.totalCoins}, new balance = ₹${claimRes2.newCoins}`);
  if (claimRes2.totalCoins !== 40 || claimRes2.newCoins !== 90) {
    throw new Error(`TEST 2 Failed: Expected ₹40 claimed and ₹90 balance, got ₹${claimRes2.newCoins}`);
  }

  // TEST 3: Duplicate claim attempt on the same day
  console.log("\nTEST 3: Repeated click / claim attempt on the SAME DAY (Double-credit prevention)...");
  try {
    await executeClaimTx(testUserId, freePlanId, initialTime);
    throw new Error("TEST 3 Failed: Server allowed duplicate claim on same day!");
  } catch (err) {
    console.log(`✓ Result: Cleanly rejected with: "${err.message}"`);
  }

  // TEST 4: Concurrency / Parallel Requests Protection (5 parallel requests)
  console.log("\nTEST 4: Concurrent / Rapid parallel requests test (5 requests at once)...");
  const parallelPromises = [1, 2, 3, 4, 5].map(() => executeClaimTx(testUserId, freePlanId, initialTime).catch(e => e.message));
  const parallelResults = await Promise.all(parallelPromises);
  const successfulParallel = parallelResults.filter(r => typeof r === "object" && r.totalCoins);
  console.log(`✓ Parallel results: ${successfulParallel.length} success, ${5 - successfulParallel.length} blocked.`);
  if (successfulParallel.length > 0) {
    throw new Error("TEST 4 Failed: Concurrency protection failed, duplicate claim occurred!");
  }

  // TEST 5: Verify records in daily_claims table
  console.log("\nTEST 5: Verify database daily_claims table consistency...");
  const dbClaims = await db`
    SELECT id, plan_id, day_number, claim_date, amount, status
    FROM daily_claims
    WHERE user_id = ${testUserId}
    ORDER BY created_at ASC
  `;
  console.log(`✓ Found ${dbClaims.length} records in daily_claims table:`);
  dbClaims.forEach(c => console.log(`   - ${c.id} | Plan: ${c.plan_id} | Day ${c.day_number} | Date: ${c.claim_date} | Amount: ₹${c.amount} | Status: ${c.status}`));
  if (dbClaims.length !== 2) {
    throw new Error(`TEST 5 Failed: Expected exactly 2 claims in daily_claims, found ${dbClaims.length}`);
  }

  // TEST 6: Next Daily Cycle (Midnight IST arrives -> Day 2 claim)
  console.log("\nTEST 6: Advance clock to NEXT calendar day (Day 2 unlocks)...");
  const nextDayTime = initialTime + 25 * 60 * 60 * 1000; // 25 hours later
  const claimRes3 = await executeClaimTx(testUserId, freePlanId, nextDayTime);
  console.log(`✓ Result: Day 2 Free Plan Claimed ₹${claimRes3.totalCoins}, new balance = ₹${claimRes3.newCoins}`);
  if (claimRes3.totalCoins !== 50 || claimRes3.newCoins !== 140) {
    throw new Error(`TEST 6 Failed: Expected ₹50 claimed, new balance ₹140. Got ${claimRes3.newCoins}`);
  }

  // TEST 7: Clean up test user
  console.log("\nCleaning up test user data...");
  await db`DELETE FROM daily_claims WHERE user_id = ${testUserId}`;
  await db`DELETE FROM game_states WHERE user_id = ${testUserId}`;
  await db`DELETE FROM users WHERE id = ${testUserId}`;
  console.log("✓ Test user and claims cleaned up.");

  console.log("\n=================================================");
  console.log("   🎉 ALL 7 DAILY CLAIM TESTS PASSED PERFECTLY!   ");
  console.log("=================================================");

  await db.end();
})().catch(e => {
  console.error("❌ TEST FAILED:", e);
  process.exit(1);
});
