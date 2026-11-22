
const {
  createReading,
  getReadings,
  updateReading,
  deleteReading,
} = require('../services/reading.service');

// CREATE: Add a glucose reading
const create = async (req, res, next) => {
  try {
    const reading = await createReading(req.user.userId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Glucose reading created successfully.',
      data: { reading },
    });
  } catch (error) {
    next(error);
  }
};

// READ: Get all readings or filter by date
const list = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const date = req.query.date || null;

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Date must use YYYY-MM-DD format.',
      });
    }

    const readings = await getReadings(userId, date);

    return res.status(200).json({
      success: true,
      count: readings.length,
      data: readings,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE: Edit an existing glucose reading
const update = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const readingId = Number(req.params.id);

    if (!Number.isInteger(readingId) || readingId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reading ID.',
      });
    }

    const reading = await updateReading(userId, readingId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Glucose reading updated successfully.',
      data: { reading },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE: Remove an existing glucose reading
const remove = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const readingId = Number(req.params.id);

    if (!Number.isInteger(readingId) || readingId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reading ID.',
      });
    }

    const reading = await deleteReading(userId, readingId);

    return res.status(200).json({
      success: true,
      message: 'Glucose reading deleted successfully.',
      data: { reading },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  update,
  remove,
};
