
const { query } = require('../config/db');

// Convert API time slot to the value currently used by PostgreSQL
const toDatabaseSlot = (slot) => {
  return slot === 'morning_fasting' ? 'morning' : slot;
};

// Convert database time slot back to the API format
const toApiSlot = (slot) => {
  return slot === 'morning' ? 'morning_fasting' : slot;
};

// CREATE: Add a glucose reading
const createReading = async (userId, readingData) => {
  const { reading_date, time_slot, glucose_value } = readingData;
  const databaseSlot = toDatabaseSlot(time_slot);

  const existingReading = await query(
    `SELECT id
     FROM readings
     WHERE user_id = $1
       AND reading_date = $2
       AND time_slot = $3`,
    [userId, reading_date, databaseSlot]
  );

  if (existingReading.rows.length > 0) {
    const error = new Error(
      'A reading for this time slot already exists on this date.'
    );
    error.statusCode = 409;
    throw error;
  }

  const dailyCount = await query(
    `SELECT COUNT(*) AS count
     FROM readings
     WHERE user_id = $1
       AND reading_date = $2`,
    [userId, reading_date]
  );

  if (Number(dailyCount.rows[0].count) >= 4) {
    const error = new Error(
      'You can record a maximum of 4 readings per day.'
    );
    error.statusCode = 409;
    throw error;
  }

  try {
    const result = await query(
      `INSERT INTO readings
         (user_id, reading_date, time_slot, glucose_value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, reading_date, time_slot, glucose_value,
                 created_at, updated_at`,
      [userId, reading_date, databaseSlot, glucose_value]
    );

    const reading = result.rows[0];
    reading.time_slot = toApiSlot(reading.time_slot);

    return reading;
  } catch (error) {
    if (error.code === '23505') {
      const duplicateError = new Error(
        'A reading for this time slot already exists on this date.'
      );
      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  }
};

// READ: Fetch readings belonging to this user
// Optional date filter: YYYY-MM-DD
const getReadings = async (userId, date = null) => {
  let sql = `
    SELECT
      id,
      user_id,
      reading_date,
      time_slot,
      glucose_value,
      created_at,
      updated_at
    FROM readings
    WHERE user_id = $1
  `;

  const params = [userId];

  if (date) {
    sql += ` AND reading_date = $2`;
    params.push(date);
  }

  sql += `
    ORDER BY reading_date DESC,
    CASE time_slot
      WHEN 'morning' THEN 1
      WHEN 'after_breakfast' THEN 2
      WHEN 'after_lunch' THEN 3
      WHEN 'after_dinner' THEN 4
      ELSE 5
    END ASC
  `;

  const result = await query(sql, params);

  return result.rows.map((reading) => ({
    ...reading,
    time_slot: toApiSlot(reading.time_slot),
  }));
};

// UPDATE: Edit an existing glucose reading
const updateReading = async (userId, readingId, readingData) => {
  const { reading_date, time_slot, glucose_value } = readingData;
  const databaseSlot = toDatabaseSlot(time_slot);

  // Verify that the reading belongs to this user
  const ownedReading = await query(
    `SELECT id
     FROM readings
     WHERE id = $1 AND user_id = $2`,
    [readingId, userId]
  );

  if (ownedReading.rows.length === 0) {
    const error = new Error('Reading not found.');
    error.statusCode = 404;
    throw error;
  }

  // Check for another reading in the same date and slot
  const duplicateReading = await query(
    `SELECT id
     FROM readings
     WHERE user_id = $1
       AND reading_date = $2
       AND time_slot = $3
       AND id != $4`,
    [userId, reading_date, databaseSlot, readingId]
  );

  if (duplicateReading.rows.length > 0) {
    const error = new Error(
      'A reading for this time slot already exists on this date.'
    );
    error.statusCode = 409;
    throw error;
  }

  // Check daily maximum, excluding the reading being updated
  const dailyCount = await query(
    `SELECT COUNT(*) AS count
     FROM readings
     WHERE user_id = $1
       AND reading_date = $2
       AND id != $3`,
    [userId, reading_date, readingId]
  );

  if (Number(dailyCount.rows[0].count) >= 4) {
    const error = new Error(
      'You can record a maximum of 4 readings per day.'
    );
    error.statusCode = 409;
    throw error;
  }

  try {
    const result = await query(
      `UPDATE readings
       SET reading_date = $1,
           time_slot = $2,
           glucose_value = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
         AND user_id = $5
       RETURNING id, user_id, reading_date, time_slot, glucose_value,
                 created_at, updated_at`,
      [reading_date, databaseSlot, glucose_value, readingId, userId]
    );

    const reading = result.rows[0];
    reading.time_slot = toApiSlot(reading.time_slot);

    return reading;
  } catch (error) {
    if (error.code === '23505') {
      const duplicateError = new Error(
        'A reading for this time slot already exists on this date.'
      );
      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  }
};

// DELETE: Remove an existing glucose reading
const deleteReading = async (userId, readingId) => {
  const result = await query(
    `DELETE FROM readings
     WHERE id = $1
       AND user_id = $2
     RETURNING id, user_id, reading_date, time_slot, glucose_value`,
    [readingId, userId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Reading not found.');
    error.statusCode = 404;
    throw error;
  }

  const reading = result.rows[0];
  reading.time_slot = toApiSlot(reading.time_slot);

  return reading;
};

module.exports = {
  createReading,
  getReadings,
  updateReading,
  deleteReading,
};
