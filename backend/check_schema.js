const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: '123', database: 'Pizza&PastaInn' });

async function main() {
  const res = await pool.query(
    "SELECT dp.dish_price_id, dp.dish_id, dp.size_id, dp.crust_id, dp.dish_price, s.size_name, c.crust_name FROM dish_prices dp LEFT JOIN sizes s ON dp.size_id = s.size_id LEFT JOIN crusts c ON dp.crust_id = c.crust_id WHERE dp.dish_id = 65 ORDER BY dp.dish_price_id"
  );
  console.log('=== Half-Half dish_prices ===');
  res.rows.forEach(r => console.log(r));
  pool.end();
}
main().catch(e => { console.error(e); pool.end(); });
