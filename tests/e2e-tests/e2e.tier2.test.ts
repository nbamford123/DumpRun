import { describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';

import { TestClient, type TestUser } from './TestClient';

dotenv.config();

describe('Basic DB Operations', () => {
  let client: TestClient;
  let adminUser: TestUser;
  let regularUser: TestUser;
  let driver: TestUser;

  const username = process.env.USER_TEST_USER_USERNAME || '';
  const drivername = process.env.DRIVER_TEST_USER_USERNAME || '';

  beforeAll(async () => {
    client = new TestClient();

    const shared_password = process.env.TEST_USER_PASSWORD || '';
    // Set up test users
    adminUser = {
      username: process.env.ADMIN_TEST_USER_USERNAME || '',
      password: shared_password,
    };
    regularUser = {
      username,
      password: shared_password,
    };
    driver = {
      username: drivername,
      password: shared_password,
    };

    // Authenticate users
    adminUser.token = await client.authenticateUser(
      adminUser.username,
      adminUser.password,
    );
    regularUser.token = await client.authenticateUser(
      regularUser.username,
      regularUser.password,
    );
    driver.token = await client.authenticateUser(
      driver.username,
      driver.password,
    );
  });

  it('should verify system health', async () => {
    const response = await client.request('GET', '/v1/health/postgres', {
      token: adminUser.token,
    });
    expect(response.status).toBe(200);

    const dynamoResponse = await client.request('GET', '/v1/health/dynamodb', {
      token: adminUser.token,
    });
    expect(dynamoResponse.status).toBe(200);
  });

  it('basic user CRUD', async () => {
    const newUser = {
      address: '11382 High St. Northglenn, CO 80233',
      name: 'John Doe',
      email: 'john-d@example.com',
      phone: '303-451-6266',
    };
    let response = await client.request('GET', '/v1/users', {
      token: adminUser.token,
    });
    expect(response.status).toBe(200);

    response = await client.request('POST', '/v1/users', {
      token: regularUser.token,
      body: newUser,
    });
    expect(response.status).toBe(201);
    expect(response.data).toEqual({
      ...newUser,
      id: regularUser.username,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    response = await client.request(
      'GET',
      `/v1/users/${regularUser.username}`,
      {
        token: regularUser.token,
      },
    );
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      ...newUser,
      id: regularUser.username,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    response = await client.request(
      'PUT',
      `/v1/users/${regularUser.username}`,
      {
        token: regularUser.token,
        body: {
          name: 'Doe John',
        },
      },
    );
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      ...newUser,
      id: regularUser.username,
      name: 'Doe John',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    response = await client.request(
      'DELETE',
      `/v1/users/${regularUser.username}`,
      {
        token: regularUser.token,
      },
    );
    expect(response.status).toBe(204);

    response = await client.request(
      'GET',
      `/v1/users/${regularUser.username}`,
      {
        token: regularUser.token,
      },
    );
    expect(response.status).toBe(404);
  }, 20000);

  it('basic driver CRUD', async () => {
    const newDriver = {
      email: 'test-driver@example.com',
      name: 'Test Driver',
      phone: '303-555-1212',
      address: '11382 High St. Northglenn, CO 80233',
      vehicleMake: 'Ford',
      vehicleModel: 'F150',
      vehicleYear: 1998,
    };

    let response = await client.request('GET', '/v1/drivers', {
      token: adminUser.token,
    });
    expect(response.status).toBe(200);

    response = await client.request('POST', '/v1/drivers', {
      token: driver.token,
      body: newDriver,
    });
    expect(response.status).toBe(201);
    expect(response.data).toEqual({
      ...newDriver,
      id: driver.username,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    response = await client.request('GET', `/v1/drivers/${driver.username}`, {
      token: driver.token,
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      ...newDriver,
      id: driver.username,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    response = await client.request('PUT', `/v1/drivers/${driver.username}`, {
      token: driver.token,
      body: {
        name: 'Doe John',
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      ...newDriver,
      id: driver.username,
      name: 'Doe John',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    response = await client.request(
      'DELETE',
      `/v1/drivers/${driver.username}`,
      {
        token: driver.token,
      },
    );
    expect(response.status).toBe(204);

    response = await client.request('GET', `/v1/drivers/${driver.username}`, {
      token: driver.token,
    });
    expect(response.status).toBe(404);
  }, 20000);

  it('basic pickup CRUD', async () => {
    const newPickup = {
      location: '11382 High St. Northglenn, CO 80233',
      estimatedWeight: 150,
      requestedTime: new Date(Date.now() + 60000).toISOString(),
      wasteType: 'green',
    };

    let response = await client.request('GET', '/v1/pickups', {
      token: adminUser.token,
      params: {
        status: 'pending',
      },
    });
    expect(response.status).toBe(200);

    response = await client.request('POST', '/v1/pickups', {
      token: regularUser.token,
      body: newPickup,
    });
    expect(response.status).toBe(201);
    expect(response.data).toEqual({
      ...newPickup,
      userId: regularUser.username,
      status: 'pending',
      id: expect.any(String),
    });
    const pickupId = response.data.id;

    response = await client.request('GET', `/v1/pickups/${pickupId}`, {
      token: regularUser.token,
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      ...newPickup,
      id: pickupId,
      userId: regularUser.username,
      status: 'pending',
    });

    response = await client.request('PUT', `/v1/pickups/${pickupId}`, {
      token: regularUser.token,
      body: {
        status: 'available',
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      ...newPickup,
      id: pickupId,
      userId: regularUser.username,
      status: 'available',
    });

    response = await client.request('GET', '/v1/pickups/available', {
      token: driver.token,
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual([
      {
        ...newPickup,
        id: pickupId,
        userId: regularUser.username,
        status: 'available',
      },
    ]);

    response = await client.request('POST', `/v1/pickups/${pickupId}/accept`, {
      token: driver.token,
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      ...newPickup,
      id: pickupId,
      userId: regularUser.username,
      driverId: driver.username,
      status: 'accepted',
    });

    response = await client.request(
      'POST',
      `/v1/pickups/${pickupId}/cancel-acceptance`,
      {
        token: driver.token,
      },
    );
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      ...newPickup,
      id: pickupId,
      userId: regularUser.username,
      status: 'available',
    });

    response = await client.request('DELETE', `/v1/pickups/${pickupId}`, {
      token: adminUser.token,
      params: {
        hardDelete: 'true',
      },
    });
    expect(response.status).toBe(204);

    response = await client.request('GET', `/v1/pickups/${pickupId}`, {
      token: driver.token,
    });
    // This should be a 404, needs to be fixed in the lambda
    expect(response.status).toBe(500);
  }, 20000);
});
