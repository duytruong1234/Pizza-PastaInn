const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: '123', database: 'Pizza&PastaInn' });

async function main() {
  console.log('=== Adding user_address_id to orders table ===');
  await pool.query(
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_address_id INTEGER REFERENCES user_address(user_address_id) ON DELETE SET NULL"
  );
  console.log('=== Column added successfully! ===');
  pool.end();
}
main().catch(e => { console.error(e); pool.end(); });
