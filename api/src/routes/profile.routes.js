const express = require('express');
const router = express.Router();

const {
  getMyProfile,
  updateMyProfile,
} = require('../controllers/profile.controller');

const { authenticate } = require('../middleware/auth.middleware');

// Protect all profile routes
router.use(authenticate);

// Get profile
router.get('/', getMyProfile);

// Update profile
router.put('/', updateMyProfile);

module.exports = router;