
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const SALT_ROUNDS = 12;

const createUser = async ({ name, email, password }) => {
  const existingUser = await query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  if (existingUser.rows.length > 0) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const result = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      const duplicateError = new Error(
        'An account with this email already exists.'
      );
      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  }
};

// Login an existing user
const loginUser = async ({ email, password }) => {
  const result = await query(
    `SELECT id, name, email, password_hash, created_at
     FROM users
     WHERE LOWER(email) = LOWER($1)`,
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatches) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      algorithm: 'HS256',
    }
  );

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.created_at,
  };

  return {
    user: safeUser,
    token,
  };
};

// Change the authenticated user's password
const changePassword = async ({
  userId,
  currentPassword,
  newPassword,
}) => {
  const result = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  const user = result.rows[0];

  if (!user) {
    const error = new Error('User account not found.');
    error.statusCode = 404;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    user.password_hash
  );

  if (!passwordMatches) {
    const error = new Error('Your current password is incorrect.');
    error.statusCode = 400;
    throw error;
  }

  const samePassword = await bcrypt.compare(
    newPassword,
    user.password_hash
  );

  if (samePassword) {
    const error = new Error(
      'Your new password must be different from your current password.'
    );
    error.statusCode = 400;
    throw error;
  }

  const newPasswordHash = await bcrypt.hash(
    newPassword,
    SALT_ROUNDS
  );

  await query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [newPasswordHash, userId]
  );

  return true;
};

module.exports = {
  createUser,
  loginUser,
  changePassword,
};
