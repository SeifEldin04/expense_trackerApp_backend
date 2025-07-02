// const { Pool } = require('pg');

// const pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//     ssl: {
//         rejectUnauthorized: false // This allows connecting to cloud-hosted databases
//     }
// });

// const pool = new Pool({
//     host: 'localhost',
//     port: 5432,
//     user: 'postgres',
//     password: 'Seif33200',
//     database: 'expensetwo',
//     charset: 'utf8'
// });

// pool.connect((err) => {
//     if (err) {
//         console.error('Connection error', err.stack);
//     } else {
//         console.log('Connected to the database');
//     }
// });

// module.exports = pool;






const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// اختبار الاتصال فعليًا
pool.connect()
  .then(client => {
    console.log('✅ Connected to Supabase PostgreSQL');
    client.release(); // رجع الاتصال للـ pool
  })
  .catch(err => {
    console.error('❌ Failed to connect to Supabase PostgreSQL:', err.message);
  });

module.exports = pool;
