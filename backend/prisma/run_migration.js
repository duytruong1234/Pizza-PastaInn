const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '123',
    database: 'Pizza&PastaInn'
  });
  
  try {
    await client.connect();
    console.log('Connected to database');

    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS store_id INTEGER,
      ADD COLUMN IF NOT EXISTS customer_latitude NUMERIC(10, 7),
      ADD COLUMN IF NOT EXISTS customer_longitude NUMERIC(10, 7),
      ADD COLUMN IF NOT EXISTS shipping_distance_meters NUMERIC;
    `);
    console.log('[OK] Columns added successfully');

    const { rows } = await client.query(`
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_stores'
    `);
    if (rows.length === 0) {
      await client.query(`
        ALTER TABLE orders
        ADD CONSTRAINT fk_orders_stores 
        FOREIGN KEY (store_id) REFERENCES stores(store_id);
      `);
      console.log('[OK] FK constraint fk_orders_stores added');
    } else {
      console.log('[SKIP] FK constraint fk_orders_stores already exists');
    }

    // Verify
    const { rows: cols } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('store_id', 'customer_latitude', 'customer_longitude', 'shipping_distance_meters')
      ORDER BY column_name;
    `);
    console.log('\n[INFO] Verified columns:');
    cols.forEach(c => console.log(`   - ${c.column_name}: ${c.data_type}`));
  } catch (err) {
    console.error('[ERROR] Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
