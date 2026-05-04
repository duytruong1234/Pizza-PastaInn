const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '123',
  database: 'Pizza&PastaInn',
});

async function main() {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'toppings'
    `);
    console.log('Table exists:', tableCheck.rows.length > 0);
    
    if (tableCheck.rows.length > 0) {
      const cols = await pool.query(`
        SELECT column_name, data_type FROM information_schema.columns 
        WHERE table_name = 'toppings' ORDER BY ordinal_position
      `);
      console.log('Columns:', cols.rows);
      
      const data = await pool.query('SELECT * FROM toppings LIMIT 10');
      console.log('Data count:', data.rows.length);
      console.log('Data:', JSON.stringify(data.rows, null, 2));
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}
main();
