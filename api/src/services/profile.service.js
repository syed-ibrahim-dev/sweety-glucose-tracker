const { query } = require('../config/db');

// Get the logged-in user's profile
const getProfile = async (userId) => {
  const result = await query(
    `SELECT id, name, email, created_at
     FROM users
     WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    const error = new Error('User profile not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

// Update the logged-in user's profile
const updateProfile = async (userId, { name, email }) => {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email is already used by another account
  const existingUser = await query(
    `SELECT id
     FROM users
     WHERE LOWER(email) = LOWER($1)
       AND id != $2`,
    [normalizedEmail, userId]
  );

  if (existingUser.rows.length > 0) {
    const error = new Error('This email is already being used by another account.');
    error.statusCode = 409;
    throw error;
  }

  try {
    const result = await query(
      `UPDATE users
       SET name = $1, email = $2
       WHERE id = $3
       RETURNING id, name, email, created_at`,
      [normalizedName, normalizedEmail, userId]
    );

    if (result.rows.length === 0) {
      const error = new Error('User profile not found.');
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      const duplicateError = new Error(
        'This email is already being used by another account.'
      );
      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  }
};

module.exports = {
  getProfile,
  updateProfile,
};