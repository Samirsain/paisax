const postgres = require('postgres');
const db = postgres('postgresql://postgres:GBNR1Ql0jDzraOlq@db.dlkkvikhajfujitopkzk.supabase.co:5432/postgres', { ssl: 'require' });

(async () => {
  // Check all tables
  const tables = await db`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log('=== ALL TABLES IN DB ===');
  tables.forEach(t => console.log(' ✓', t.table_name));

  // Check users
  const users = await db`SELECT id, name, phone, invite_code, invited_by, created_at FROM users ORDER BY created_at DESC LIMIT 20`;
  console.log('\n=== USERS ===', users.length, 'registered');
  users.forEach(u => console.log(` - ${u.name} | ${u.phone} | code: ${u.invite_code} | joined: ${new Date(u.created_at).toLocaleString('en-IN')}`));

  // Check game states
  const gs = await db`SELECT user_id, updated_at FROM game_states`;
  console.log('\n=== GAME_STATES ===', gs.length, 'records');

  // Check orders if table exists
  try {
    const orders = await db`SELECT id, user_id, plan_id, amount, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10`;
    console.log('\n=== ORDERS ===', orders.length, 'orders');
    orders.forEach(o => console.log(` - ${o.id} | ${o.plan_id} | ₹${o.amount} | ${o.status}`));
  } catch {
    console.log('\n=== ORDERS === table not created yet');
  }

  await db.end();
  console.log('\n✅ DB connection working fine!');
})().catch(e => { console.error('DB ERROR:', e.message); process.exit(1); });
