const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: '123', database: 'Pizza&PastaInn' });

async function main() {
  const res = await pool.query(
    "SELECT * FROM \"orders\" WHERE order_id = 31"
  );
  console.log('=== Order 31 ===');
  console.log(res.rows[0]);
  pool.end();
}
main().catch(e => { console.error(e); pool.end(); });
