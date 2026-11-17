const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const db = postgres(process.env.DATABASE_URL, { ssl: 'require' });

(async () => {
  console.log("Starting Database Backup...");
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const users = await db`SELECT * FROM users`;
  const gameStates = await db`SELECT * FROM game_states`;
  const orders = await db`SELECT * FROM orders`;
  const withdrawals = await db`SELECT * FROM withdrawals`;
  const commissions = await db`SELECT * FROM referral_commissions`;

  const backupData = {
    timestamp,
    counts: {
      users: users.length,
      gameStates: gameStates.length,
      orders: orders.length,
      withdrawals: withdrawals.length,
      commissions: commissions.length,
    },
    users,
    gameStates,
    orders,
    withdrawals,
    commissions,
  };

  const backupFile = path.join(backupDir, `db_backup_${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

  console.log(`✅ Backup successfully created at: ${backupFile}`);
  console.log("Counts:", backupData.counts);

  await db.end();
})().catch(e => {
  console.error("Backup failed:", e);
  process.exit(1);
});
