const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '123',
  database: 'Pizza&PastaInn',
});

pool.query('SELECT 1', (err, res) => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Successfully connected to Postgres');
  }
  pool.end();
});
