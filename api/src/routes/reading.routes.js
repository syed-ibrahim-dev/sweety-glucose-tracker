
const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { validateReading } = require('../validators/reading.validator');

const {
  create,
  list,
  update,
  remove,
} = require('../controllers/reading.controller');

// All reading routes require authentication
router.use(authenticate);

// GET: Fetch readings
router.get('/', list);

// POST: Create a reading
router.post('/', validateReading, create);

// PUT: Update a reading
router.put('/:id', validateReading, update);

// DELETE: Delete a reading
router.delete('/:id', remove);

module.exports = router;
