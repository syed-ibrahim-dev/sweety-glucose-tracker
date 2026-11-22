
const express = require('express');
const router = express.Router();

const {
  register,
  login,
  changeUserPassword,
} = require('../controllers/auth.controller');

const {
  validateRegister,
  validateLogin,
  validateChangePassword,
} = require('../validators/auth.validator');

const { authenticate } = require('../middleware/auth.middleware');

// Register a new user
router.post('/register', validateRegister, register);

// Log in an existing user
router.post('/login', validateLogin, login);

// Change password (requires authentication)
router.put(
  '/change-password',
  authenticate,
  validateChangePassword,
  changeUserPassword
);

module.exports = router;
