import { describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';

import { TestClient, type TestUser } from './TestClient';

dotenv.config();

describe('End-to-End Flows', () => {
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

  //   it('should complete full ride lifecycle', async () => {
  //     // 1. User requests ride
  //     const rideRequest = {
  //       pickup: {
  //         latitude: 37.7749,
  //         longitude: -122.4194,
  //         address: '123 Test St',
  //       },
  //       dropoff: {
  //         latitude: 37.7833,
  //         longitude: -122.4167,
  //         address: '456 Example Ave',
  //       },
  //     };

  //     const createResponse = await client.request('POST', '/v1/pickups', {
  //       token: regularUser.token,
  //       body: rideRequest,
  //     });

  //     expect(createResponse.status).toBe(201);
  //     const pickupId = createResponse.data.pickupId;

  //     // 2. Driver accepts ride
  //     const acceptResponse = await client.request(
  //       'PUT',
  //       `/v1/pickups/${pickupId}/accept`,
  //       {
  //         token: driver.token,
  //       },
  //     );

  //     expect(acceptResponse.status).toBe(200);
  //     expect(acceptResponse.data.status).toBe('accepted');

  //     // 3. Driver starts ride
  //     const startResponse = await client.request(
  //       'PUT',
  //       `/v1/pickups/${pickupId}/start`,
  //       {
  //         token: driver.token,
  //       },
  //     );

  //     expect(startResponse.status).toBe(200);
  //     expect(startResponse.data.status).toBe('in_progress');

  //     // 4. Driver completes ride
  //     const completeResponse = await client.request(
  //       'PUT',
  //       `/v1/pickups/${pickupId}/complete`,
  //       {
  //         token: driver.token,
  //         body: {
  //           finalDistance: 5.2,
  //           finalDuration: 15,
  //         },
  //       },
  //     );

  //     expect(completeResponse.status).toBe(200);
  //     expect(completeResponse.data.status).toBe('completed');

  //     // 5. Verify ride history for both user and driver
  //     const userHistoryResponse = await client.request(
  //       'GET',
  //       '/v1/users/rides',
  //       {
  //         token: regularUser.token,
  //       },
  //     );

  //     expect(userHistoryResponse.status).toBe(200);
  //     expect(userHistoryResponse.data.rides).toContainEqual(
  //       expect.objectContaining({ id: pickupId }),
  //     );

  //     const driverHistoryResponse = await client.request(
  //       'GET',
  //       '/v1/drivers/rides',
  //       {
  //         token: driver.token,
  //       },
  //     );

  //     expect(driverHistoryResponse.status).toBe(200);
  //     expect(driverHistoryResponse.data.rides).toContainEqual(
  //       expect.objectContaining({ id: pickupId }),
  //     );
  //   });
  // });
});
