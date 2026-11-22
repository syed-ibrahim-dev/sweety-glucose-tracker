const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');
const {
  daily,
  monthToDate,
  previousMonth,
  exportCsv,
} = require('../src/controllers/report.controller');

const runController = async (controller, query) => {
  const req = {
    query,
    user: { userId: 1 },
  };

  const res = {
    statusCode: 200,
    data: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    send(data) {
      this.data = data;
      return this;
    },
  };

  let nextError = null;

  await controller(req, res, (error) => {
    nextError = error;
  });

  return { res, nextError };
};

const reportControllers = [
  ['Daily report', daily],
  ['Month-to-date report', monthToDate],
  ['Previous-month report', previousMonth],
];

for (const [name, controller] of reportControllers) {
  test(`${name} rejects a missing date`, async () => {
    const { res } = await runController(controller, {});

    assert.equal(res.statusCode, 400);
    assert.equal(
      res.data.message,
      'A valid date in YYYY-MM-DD format is required.'
    );
  });

  test(`${name} rejects an invalid calendar date`, async () => {
    const { res } = await runController(controller, {
      date: '2026-02-30',
    });

    assert.equal(res.statusCode, 400);
    assert.equal(
      res.data.message,
      'A valid date in YYYY-MM-DD format is required.'
    );
  });

  test(`${name} rejects an incorrectly formatted date`, async () => {
    const { res } = await runController(controller, {
      date: '20-11-2026',
    });

    assert.equal(res.statusCode, 400);
  });

  test(`${name} rejects a future date`, async () => {
    const futureDate = new Date();
    futureDate.setUTCDate(futureDate.getUTCDate() + 10);

    const date = futureDate.toISOString().slice(0, 10);

    const { res } = await runController(controller, { date });

    assert.equal(res.statusCode, 400);
    assert.equal(
      res.data.message,
      'Report date cannot be in the future.'
    );
  });
}

test('CSV export rejects a missing export type', async () => {
  const { res } = await runController(exportCsv, {
    date: '2026-11-20',
  });

  assert.equal(res.statusCode, 400);
  assert.equal(
    res.data.message,
    'Invalid export type. Use daily, month_to_date, or previous_month.'
  );
});

test('CSV export rejects an unsupported export type', async () => {
  const { res } = await runController(exportCsv, {
    date: '2026-11-20',
    type: 'weekly',
  });

  assert.equal(res.statusCode, 400);
});

test('Report endpoints require authentication', async () => {
  const endpoints = [
    '/api/reports/daily',
    '/api/reports/month-to-date',
    '/api/reports/previous-month',
    '/api/reports/export',
  ];

  for (const endpoint of endpoints) {
    const response = await request(app).get(endpoint);

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
  }
});
