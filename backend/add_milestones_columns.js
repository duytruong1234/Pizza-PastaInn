const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: '123', database: 'Pizza&PastaInn' });

async function main() {
  console.log('=== Adding confirmed_at, preparing_at, cancelled_at to orders table ===');
  await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITHOUT TIME ZONE");
  await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMP WITHOUT TIME ZONE");
  await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITHOUT TIME ZONE");
  console.log('=== Columns added successfully! ===');
  pool.end();
}
main().catch(e => { console.error(e); pool.end(); });
