const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

const DEMO_EMAIL = 'demo@sweety.app';
const DEMO_PASSWORD = 'SweetyDemo@2026';

const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (LOWER(email))
       DO UPDATE SET
         name = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash
       RETURNING id, name, email`,
      ['Sweety Demo User', DEMO_EMAIL, passwordHash]
    );

    const user = userResult.rows[0];

    // Replace only this demo user's sample readings.
    await client.query(
      'DELETE FROM readings WHERE user_id = $1',
      [user.id]
    );

    // Four readings for today and two for the previous month.
    await client.query(
      `INSERT INTO readings
         (user_id, reading_date, time_slot, glucose_value)
       VALUES
         ($1, CURRENT_DATE, 'morning', 105),
         ($1, CURRENT_DATE, 'after_breakfast', 145),
         ($1, CURRENT_DATE, 'after_lunch', 132),
         ($1, CURRENT_DATE, 'after_dinner', 118),
         ($1, (
           DATE_TRUNC('month', CURRENT_DATE)
           - INTERVAL '1 month'
           + INTERVAL '9 days'
         )::date, 'after_lunch', 126),
         ($1, (
           DATE_TRUNC('month', CURRENT_DATE)
           - INTERVAL '1 month'
           + INTERVAL '19 days'
         )::date, 'after_dinner', 112)`,
      [user.id]
    );

    await client.query('COMMIT');

    console.log('\nSweety demo data created successfully.');
    console.log(`Demo user: ${user.email}`);
    console.log('Sample readings: 6');
    console.log('Password: available in the README demo credentials section.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Unable to create demo data:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();