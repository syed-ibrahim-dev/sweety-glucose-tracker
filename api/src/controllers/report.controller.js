
const {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
} = require('../services/report.service');

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

// Validate YYYY-MM-DD and ensure it is a real calendar date
const isValidDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
};

// Shared selected-date validation
const validateSelectedDate = (req, res) => {
  const date = req.query.date;

  if (!date || !isValidDate(date)) {
    res.status(400).json({
      success: false,
      message: 'A valid date in YYYY-MM-DD format is required.',
    });

    return null;
  }

  if (date > getTodayInIndia()) {
  res.status(400).json({
    success: false,
    message: 'Report date cannot be in the future.',
  });

  return null;
}

  return date;
};

// DAILY REPORT
const daily = async (req, res, next) => {
  try {
    const selectedDate = validateSelectedDate(req, res);

    if (!selectedDate) return;

    const report = await getDailyReport(
      req.user.userId,
      selectedDate
    );

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// MONTH-TO-DATE REPORT
const monthToDate = async (req, res, next) => {
  try {
    const selectedDate = validateSelectedDate(req, res);

    if (!selectedDate) return;

    const report = await getMonthToDateReport(
      req.user.userId,
      selectedDate
    );

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// PREVIOUS MONTH REPORT
const previousMonth = async (req, res, next) => {
  try {
    const selectedDate = validateSelectedDate(req, res);

    if (!selectedDate) return;

    const report = await getPreviousMonthReport(
      req.user.userId,
      selectedDate
    );

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// CSV cell escaping
const escapeCsvCell = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  let text = String(value);

  // Prevent spreadsheet formula injection
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  // Escape quotes and wrap cell in quotes
  return `"${text.replace(/"/g, '""')}"`;
};

// CSV EXPORT
const exportCsv = async (req, res, next) => {
  try {
    const selectedDate = validateSelectedDate(req, res);

    if (!selectedDate) return;

    const type = req.query.type;

    const allowedTypes = [
      'daily',
      'month_to_date',
      'previous_month',
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid export type. Use daily, month_to_date, or previous_month.',
      });
    }

    let report;

    switch (type) {
      case 'daily':
        report = await getDailyReport(
          req.user.userId,
          selectedDate
        );
        break;

      case 'month_to_date':
        report = await getMonthToDateReport(
          req.user.userId,
          selectedDate
        );
        break;

      case 'previous_month':
        report = await getPreviousMonthReport(
          req.user.userId,
          selectedDate
        );
        break;
    }

    const headers = [
      'Reading Date',
      'Time Slot',
      'Glucose Value (mg/dL)',
      'Created At',
      'Updated At',
    ];

    const rows = report.readings.map((reading) => [
      reading.reading_date,
      reading.time_slot,
      reading.glucose_value,
      reading.created_at,
      reading.updated_at,
    ]);

    const csvContent = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((row) =>
        row.map(escapeCsvCell).join(',')
      ),
    ].join('\r\n');

    const filename = `sweety-${type}-${report.start_date}-to-${report.end_date}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    // UTF-8 BOM helps Excel recognize UTF-8 CSV files
    return res.status(200).send(`\uFEFF${csvContent}`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  daily,
  monthToDate,
  previousMonth,
  exportCsv,
};
