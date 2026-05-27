const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: '123', database: 'Pizza&PastaInn' });

async function main() {
  const tables = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  console.log('=== Tables ===');
  tables.rows.forEach(r => console.log(r.table_name));

  const res = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_address'"
  );
  console.log('=== columns in user_address ===');
  res.rows.forEach(r => console.log(r));

  pool.end();
}
main().catch(e => { console.error(e); pool.end(); });
