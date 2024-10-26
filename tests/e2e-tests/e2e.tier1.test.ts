import { describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';

import { TestClient, type TestUser } from './TestClient';

dotenv.config();

describe('API/Lambda operations (no db)', () => {
  let client: TestClient;
  let regularUser: TestUser;
  let driver: TestUser;

  const username = process.env.USER_TEST_USER_USERNAME || '';
  const drivername = process.env.DRIVER_TEST_USER_USERNAME || '';

  beforeAll(async () => {
    client = new TestClient();

    const shared_password = process.env.TEST_USER_PASSWORD || '';
    // Set up test users
    regularUser = {
      username,
      password: shared_password,
    };
    driver = {
      username: drivername,
      password: shared_password,
    };

    regularUser.token = await client.authenticateUser(
      regularUser.username,
      regularUser.password,
    );
    driver.token = await client.authenticateUser(
      driver.username,
      driver.password,
    );
  });

  it('system health endpoints', async () => {
    const response = await client.request('GET', '/v1/health/postgres', {
      token: regularUser.token,
    });
    expect(response.status).toBe(403);

    const dynamoResponse = await client.request('GET', '/v1/health/dynamodb', {
      token: regularUser.token,
    });
    expect(dynamoResponse.status).toBe(403);
  });

  it('user endpoints', async () => {
    let response = await client.request('GET', '/v1/users', {
      token: driver.token,
    });
    expect(response.status).toBe(403);

    response = await client.request('POST', '/v1/users', {
      token: regularUser.token,
      body: { bad: 'data' },
    });
    expect(response.status).toBe(400);

    response = await client.request(
      'GET',
      `/v1/users/${regularUser.username}`,
      {
        token: driver.token,
      },
    );
    expect(response.status).toBe(403);

    response = await client.request(
      'PUT',
      `/v1/users/${regularUser.username}`,
      {
        token: driver.token,
        body: {
          name: 'Doe John',
        },
      },
    );
    expect(response.status).toBe(403);

    response = await client.request(
      'DELETE',
      `/v1/users/${regularUser.username}`,
      {
        token: driver.token,
      },
    );
    expect(response.status).toBe(403);
  }, 20000);

  it('driver endpoints', async () => {
    let response = await client.request('GET', '/v1/drivers', {
      token: regularUser.token,
    });
    expect(response.status).toBe(403);

    response = await client.request('POST', '/v1/drivers', {
      token: driver.token,
      body: { bad: 'data' },
    });
    expect(response.status).toBe(400);

    response = await client.request('GET', `/v1/drivers/${driver.username}`, {
      token: regularUser.token,
    });
    expect(response.status).toBe(403);

    response = await client.request('PUT', `/v1/drivers/${driver.username}`, {
      token: regularUser.token,
      body: {
        name: 'Doe John',
      },
    });
    expect(response.status).toBe(403);

    response = await client.request(
      'DELETE',
      `/v1/drivers/${driver.username}`,
      {
        token: regularUser.token,
      },
    );
    expect(response.status).toBe(403);
  }, 20000);

  it('pickup endpoints', async () => {
    let response = await client.request('GET', '/v1/pickups', {
      token: regularUser.token,
      params: {
        status: 'pending',
      },
    });
    expect(response.status).toBe(403);

    response = await client.request('POST', '/v1/pickups', {
      token: driver.token,
      body: { bad: 'pickup' },
    });
    expect(response.status).toBe(403);

    // get pickup has to pull the pickup to validate, so I've synthesized this test id so it doesn't hit the db
    response = await client.request('GET', '/v1/pickups/test-pickup-id', {
      token: regularUser.token,
    });
    expect(response.status).toBe(404);

    response = await client.request('PUT', '/v1/pickups/test-pickup-id', {
      token: driver.token,
      body: {
        status: 'available',
      },
    });
    expect(response.status).toBe(403);

    response = await client.request('GET', '/v1/pickups/available', {
      token: regularUser.token,
    });
    expect(response.status).toBe(403);

    response = await client.request('POST', '/v1/pickups/abc123/accept', {
      token: regularUser.token,
    });
    expect(response.status).toBe(403);

    response = await client.request(
      'POST',
      '/v1/pickups/abc123/cancel-acceptance',
      {
        token: regularUser.token,
      },
    );
    expect(response.status).toBe(403);

    response = await client.request('DELETE', '/v1/pickups/test-pickup-id', {
      token: regularUser.token,
    });
    expect(response.status).toBe(404);
  }, 20000);
});
