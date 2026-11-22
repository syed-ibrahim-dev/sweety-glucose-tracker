
const { query } = require('../config/db');

// Format PostgreSQL DATE values consistently as YYYY-MM-DD
const formatReading = (reading) => ({
  ...reading,
  reading_date:
    reading.reading_date instanceof Date
      ? reading.reading_date.toISOString().slice(0, 10)
      : reading.reading_date,
  time_slot:
    reading.time_slot === 'morning'
      ? 'morning_fasting'
      : reading.time_slot,
});

// Calculate report statistics and fetch readings for a date range
const getReport = async (userId, startDate, endDate, period) => {
  const statisticsResult = await query(
    `SELECT
       COUNT(*) AS reading_count,
       MAX(glucose_value) AS highest,
       MIN(glucose_value) AS lowest,
       ROUND(AVG(glucose_value)::numeric, 1) AS average
     FROM readings
     WHERE user_id = $1
       AND reading_date >= $2::date
       AND reading_date < $3::date`,
    [userId, startDate, endDate]
  );

  const readingsResult = await query(
    `SELECT
       id,
       user_id,
       TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
       time_slot,
       glucose_value,
       created_at,
       updated_at
     FROM readings
     WHERE user_id = $1
       AND reading_date >= $2::date
       AND reading_date < $3::date
     ORDER BY reading_date ASC,
       CASE time_slot
         WHEN 'morning' THEN 1
         WHEN 'after_breakfast' THEN 2
         WHEN 'after_lunch' THEN 3
         WHEN 'after_dinner' THEN 4
         ELSE 5
       END ASC`,
    [userId, startDate, endDate]
  );

  const stats = statisticsResult.rows[0];

  return {
    period,
    start_date: startDate,
    end_date: endDate,
    summary: {
      reading_count: Number(stats.reading_count),
      highest:
        stats.highest === null ? null : Number(stats.highest),
      lowest:
        stats.lowest === null ? null : Number(stats.lowest),
      average:
        stats.average === null ? null : Number(stats.average),
    },
    readings: readingsResult.rows.map(formatReading),
  };
};

// DAILY REPORT: Readings for the selected date
const getDailyReport = async (userId, selectedDate) => {
  return getReport(
    userId,
    selectedDate,
    addDays(selectedDate, 1),
    'daily'
  );
};

// MONTH-TO-DATE REPORT: First day of month through selected date
const getMonthToDateReport = async (userId, selectedDate) => {
  const startDate = `${selectedDate.slice(0, 7)}-01`;

  return getReport(
    userId,
    startDate,
    addDays(selectedDate, 1),
    'month_to_date'
  );
};

// PREVIOUS MONTH REPORT: Entire calendar month before selected date
const getPreviousMonthReport = async (userId, selectedDate) => {
  const [year, month] = selectedDate.split('-').map(Number);

  const previousMonthDate = new Date(
    Date.UTC(year, month - 2, 1)
  );

  const startDate = previousMonthDate.toISOString().slice(0, 10);

  const endDate = new Date(
    Date.UTC(year, month - 1, 1)
  ).toISOString().slice(0, 10);

  return getReport(
    userId,
    startDate,
    endDate,
    'previous_month'
  );
};

// Add days using UTC to avoid local timezone date shifts
const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
};
