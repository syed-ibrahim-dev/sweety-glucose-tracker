const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');

test('GET /api/health returns API health status', async () => {
  const response = await request(app).get('/api/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.message, 'Sweety API is running');
  assert.ok(response.body.timestamp);
});

test('POST /api/auth/register rejects missing fields', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Validation failed.');
  assert.ok(response.body.errors.includes('Name is required.'));
  assert.ok(response.body.errors.includes('Email is required.'));
  assert.ok(response.body.errors.includes('Password is required.'));
});

test('POST /api/auth/register rejects invalid email', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'invalid-email',
      password: 'password123',
    });

  assert.equal(response.status, 400);
  assert.ok(
    response.body.errors.includes('Please provide a valid email address.')
  );
});

test('POST /api/auth/register rejects short passwords', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'short',
    });

  assert.equal(response.status, 400);
  assert.ok(
    response.body.errors.includes(
      'Password must be at least 8 characters long.'
    )
  );
});

test('POST /api/auth/login rejects missing credentials', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.ok(response.body.errors.includes('Email is required.'));
  assert.ok(response.body.errors.includes('Password is required.'));
});

test('POST /api/auth/login rejects invalid email', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'invalid-email',
      password: 'password123',
    });

  assert.equal(response.status, 400);
  assert.ok(
    response.body.errors.includes('Please provide a valid email address.')
  );
});

test('PUT /api/auth/change-password rejects mismatched passwords', async () => {
  const response = await request(app)
    .put('/api/auth/change-password')
    .send({
      currentPassword: 'oldpassword123',
      newPassword: 'newpassword123',
      confirmPassword: 'differentpassword123',
    });

  assert.equal(response.status, 401);
  assert.equal(
    response.body.message,
    'Authentication required. Please log in.'
  );
});

test('Unknown API routes return 404', async () => {
  const response = await request(app).get('/api/unknown-route');

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'Route not found');
});
