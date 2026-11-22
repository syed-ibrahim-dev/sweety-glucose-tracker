
const VALID_TIME_SLOTS = [
  'morning_fasting',
  'after_breakfast',
  'after_lunch',
  'after_dinner',
];

// Get today's date in India (YYYY-MM-DD)
const getTodayInIndia = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const validateReading = (req, res, next) => {
  const { reading_date, time_slot, glucose_value } = req.body;
  const errors = [];

  // Validate reading date
  if (!reading_date) {
    errors.push('Reading date is required.');
  } else if (
    typeof reading_date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(reading_date)
  ) {
    errors.push('Reading date must be in YYYY-MM-DD format.');
  } else {
    const date = new Date(`${reading_date}T00:00:00.000Z`);

    // Reject invalid calendar dates (e.g. 2026-02-30)
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== reading_date
    ) {
      errors.push('Please provide a valid calendar date.');
    } else {
      // Compare against today's date in India
      const today = getTodayInIndia();

      if (reading_date > today) {
        errors.push('Reading date cannot be in the future.');
      }
    }
  }

  // Validate time slot
  if (!time_slot) {
    errors.push('Time slot is required.');
  } else if (!VALID_TIME_SLOTS.includes(time_slot)) {
    errors.push('Please select a valid time slot.');
  }

  // Validate glucose value
  if (
    glucose_value === undefined ||
    glucose_value === null ||
    glucose_value === ''
  ) {
    errors.push('Glucose value is required.');
  } else if (
    !Number.isInteger(Number(glucose_value)) ||
    Number(glucose_value) < 40 ||
    Number(glucose_value) > 600
  ) {
    errors.push('Glucose value must be a whole number between 40 and 600 mg/dL.');
  }

  // Return validation errors
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  // Normalize value to a number
  req.body.glucose_value = Number(glucose_value);

  next();
};

module.exports = {
  validateReading,
  VALID_TIME_SLOTS,
};
