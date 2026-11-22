const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');
const {
  validateReading,
} = require('../src/validators/reading.validator');

const runValidator = (body) => {
  const req = { body: { ...body } };

  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
  };

  let nextCalled = false;

  validateReading(req, res, () => {
    nextCalled = true;
  });

  return { req, res, nextCalled };
};

test('GET /api/readings requires authentication', async () => {
  const response = await request(app).get('/api/readings');
  assert.equal(response.status, 401);
});

test('POST /api/readings requires authentication', async () => {
  const response = await request(app).post('/api/readings').send({});
  assert.equal(response.status, 401);
});

test('PUT /api/readings/:id requires authentication', async () => {
  const response = await request(app).put('/api/readings/1').send({});
  assert.equal(response.status, 401);
});

test('DELETE /api/readings/:id requires authentication', async () => {
  const response = await request(app).delete('/api/readings/1');
  assert.equal(response.status, 401);
});

test('Reading validator rejects missing fields', () => {
  const { res, nextCalled } = runValidator({});

  assert.equal(res.statusCode, 400);
  assert.equal(nextCalled, false);
  assert.ok(res.data.errors.includes('Reading date is required.'));
  assert.ok(res.data.errors.includes('Time slot is required.'));
  assert.ok(res.data.errors.includes('Glucose value is required.'));
});

test('Reading validator rejects invalid calendar dates', () => {
  const { res, nextCalled } = runValidator({
    reading_date: '2026-02-30',
    time_slot: 'morning_fasting',
    glucose_value: 100,
  });

  assert.equal(res.statusCode, 400);
  assert.equal(nextCalled, false);
  assert.ok(
    res.data.errors.includes('Please provide a valid calendar date.')
  );
});

test('Reading validator rejects invalid time slots', () => {
  const { res } = runValidator({
    reading_date: '2026-11-20',
    time_slot: 'invalid_slot',
    glucose_value: 100,
  });

  assert.equal(res.statusCode, 400);
  assert.ok(
    res.data.errors.includes('Please select a valid time slot.')
  );
});

test('Reading validator rejects glucose below 40', () => {
  const { res } = runValidator({
    reading_date: '2026-11-20',
    time_slot: 'morning_fasting',
    glucose_value: 39,
  });

  assert.equal(res.statusCode, 400);
  assert.ok(
    res.data.errors.includes(
      'Glucose value must be a whole number between 40 and 600 mg/dL.'
    )
  );
});

test('Reading validator rejects glucose above 600', () => {
  const { res } = runValidator({
    reading_date: '2026-11-20',
    time_slot: 'morning_fasting',
    glucose_value: 601,
  });

  assert.equal(res.statusCode, 400);
});

test('Reading validator rejects decimal glucose values', () => {
  const { res } = runValidator({
    reading_date: '2026-11-20',
    time_slot: 'morning_fasting',
    glucose_value: 100.5,
  });

  assert.equal(res.statusCode, 400);
});

test('Reading validator accepts a valid reading and normalizes glucose', () => {
  const { req, res, nextCalled } = runValidator({
    reading_date: '2026-11-20',
    time_slot: 'morning_fasting',
    glucose_value: '100',
  });

  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
  assert.equal(req.body.glucose_value, 100);
});
