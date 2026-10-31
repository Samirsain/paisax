const postgres = require('postgres');
const db = postgres(process.env.DATABASE_URL, { ssl: 'require' });

(async () => {
  const withdrawals = await db`SELECT id, user_id, amount, status, created_at FROM withdrawals ORDER BY created_at DESC LIMIT 5`;
  console.log('Withdrawals:', withdrawals);

  const commissions = await db`SELECT id, order_id, recipient_id, commission_amount, level FROM referral_commissions LIMIT 5`;
  console.log('Commissions:', commissions);

  // Check a sample game_state
  const [sampleGs] = await db`SELECT user_id, state FROM game_states WHERE state->>'coins' != '0' LIMIT 1`;
  if (sampleGs) {
    console.log('Sample user with coins:', sampleGs.user_id, 'coins:', sampleGs.state.coins, 'history count:', sampleGs.state.history?.length);
  }

  await db.end();
})();
