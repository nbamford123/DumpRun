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
  const shared_password = process.env.TEST_USER_PASSWORD || '';

  beforeAll(async () => {
    client = new TestClient();

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
      adminUser.password
    );
    regularUser.token = await client.authenticateUser(
      regularUser.username,
      regularUser.password
    );
    driver.token = await client.authenticateUser(
      driver.username,
      driver.password
    );
  });

  it('should verify system health', async () => {
    const response = await client.request('GET', '/health/postgres', {
      token: adminUser.token,
    });
    expect(response.status).toBe(200);

    const dynamoResponse = await client.request('GET', '/health/dynamodb', {
      token: adminUser.token,
    });
    expect(dynamoResponse.status).toBe(200);
  });

  it('basic user CRUD', async () => {
    const newUser = {
      address: {
        street: '11382 High St.',
        city: 'Northglenn',
        state: 'CO',
        zipCode: '80233',
      },
      firstName: 'John',
      lastName: 'Doe',
      email: 'john-d@example.com',
      phoneNumber: '303-451-6266',
    };
    let response = await client.request('GET', '/users', {
      token: adminUser.token,
    });
    expect(response.status).toBe(200);

    response = await client.request('POST', '/users', {
      token: adminUser.token,
      body: newUser,
    });
    expect(response.status).toBe(201);
    const createdUser = response.data;
    expect(createdUser).toEqual({
      ...newUser,
      id: createdUser.id,
      deletedAt: null,
      isDeleted: false,
      pickupNotes: null,
      preferredContact: 'TEXT',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    // Check email and phone 409s
    // Check cognito rollback when db creation fails? Presumably on the duplicated email?
    // Cleanup with prisma deletion?
    // Authenticate new user
    const newUserToken = await client.authenticateUser(
      createdUser.id,
      shared_password
    );
    expect(newUserToken).toBeDefined();
    response = await client.request('GET', `/users/${createdUser.id}`, {
      token: newUserToken,
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      ...newUser,
      id: createdUser.id,
      deletedAt: null,
      isDeleted: false,
      pickupNotes: null,
      preferredContact: 'TEXT',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    response = await client.request('PUT', `/users/${createdUser.id}`, {
      token: newUserToken,
      body: {
        firstName: 'Doe',
        lastName: 'John',
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      ...newUser,
      id: createdUser.id,
      firstName: 'Doe',
      lastName: 'John',
      deletedAt: null,
      isDeleted: false,
      pickupNotes: null,
      preferredContact: 'TEXT',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    response = await client.request('DELETE', `/users/${createdUser.id}`, {
      token: newUserToken,
    });
    expect(response.status).toBe(204);

    response = await client.request('GET', `/users/${createdUser.id}`, {
      token: adminUser.token,
    });
    expect(response.status).toBe(404);
  }, 20000);

  it('basic driver CRUD', async () => {
    const newDriver = {
      email: 'test-driver@example.com',
      firstName: 'Test',
      lastName: 'Driver',
      phoneNumber: '303-555-1212',
      address: {
        street: '11382 High St.',
        city: 'Northglenn',
        state: 'CO',
        zipCode: '80233',
      },
      vehicleMake: 'Ford',
      vehicleModel: 'F150',
      vehicleYear: 1998,
    };

    let response = await client.request('GET', '/drivers', {
      token: adminUser.token,
    });
    expect(response.status).toBe(200);

    response = await client.request('POST', '/drivers', {
      token: adminUser.token,
      body: newDriver,
    });
    expect(response.status).toBe(201);
    const createdDriver = response.data;
    expect(createdDriver).toEqual({
      ...newDriver,
      id: createdDriver.id,
      preferredContact: 'TEXT',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    // Check email and phone 409s
    // Check cognito rollback when db creation fails? Presumably on the duplicated email?
    // Cleanup with prisma deletion?
    // Authenticate new user
    const newDriverToken = await client.authenticateUser(
      createdDriver.id,
      shared_password
    );
    expect(newDriverToken).toBeDefined();
    response = await client.request('GET', `/drivers/${createdDriver.id}`, {
      token: newDriverToken,
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      ...newDriver,
      id: createdDriver.id,
      preferredContact: 'TEXT',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    response = await client.request('PUT', `/drivers/${createdDriver.id}`, {
      token: newDriverToken,
      body: {
        firstName: 'Doe',
        lastName: 'John',
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      ...newDriver,
      id: createdDriver.id,
      firstName: 'Doe',
      lastName: 'John',
      preferredContact: 'TEXT',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    response = await client.request('DELETE', `/drivers/${createdDriver.id}`, {
      token: newDriverToken,
    });
    expect(response.status).toBe(204);

    response = await client.request('GET', `/drivers/${createdDriver.id}`, {
      token: adminUser.token,
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

    let response = await client.request('GET', '/pickups', {
      token: adminUser.token,
      params: {
        status: 'pending',
      },
    });
    expect(response.status).toBe(200);

    response = await client.request('POST', '/pickups', {
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

    response = await client.request('GET', `/pickups/${pickupId}`, {
      token: regularUser.token,
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      ...newPickup,
      id: pickupId,
      userId: regularUser.username,
      status: 'pending',
    });

    response = await client.request('PUT', `/pickups/${pickupId}`, {
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

    response = await client.request('GET', '/pickups/available', {
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

    response = await client.request('POST', `/pickups/${pickupId}/accept`, {
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
      `/pickups/${pickupId}/cancel-acceptance`,
      {
        token: driver.token,
      }
    );
    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      ...newPickup,
      id: pickupId,
      userId: regularUser.username,
      status: 'cancelled',
    });

    response = await client.request('DELETE', `/pickups/${pickupId}`, {
      token: adminUser.token,
      params: {
        hardDelete: 'true',
      },
    });
    expect(response.status).toBe(204);

    response = await client.request('GET', `/pickups/${pickupId}`, {
      token: driver.token,
    });
    // This should be a 404, needs to be fixed in the lambda
    expect(response.status).toBe(404);
  }, 20000);
});
