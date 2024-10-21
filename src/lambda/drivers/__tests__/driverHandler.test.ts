import { vi, describe, it, expect, beforeEach } from 'vitest';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Callback,
  Context,
} from 'aws-lambda';

import type { DeepPartial } from '@/utils/DeepPartial.js';

// Mock the entire userServices module
vi.mock('../driverServices', () => ({
  createDriverService: vi.fn(),
  getDriverService: vi.fn(),
  getDriversService: vi.fn(),
  updateDriverService: vi.fn(),
  deleteDriverService: vi.fn(),
}));

// Import after mocking
import { handler as createDriver } from '../createDriver.js';
import { handler as getDriver } from '../getDriver.js';
import { handler as getDrivers } from '../getDrivers.js';
import { handler as updateDriver } from '../updateDriver.js';
import { handler as deleteDriver } from '../deleteDriver.js';
import {
  createDriverService,
  getDriverService,
  getDriversService,
  updateDriverService,
  deleteDriverService,
} from '../driverServices.js';

const DRIVER_ID = 'driver-id';
const mockDriver = {
  id: DRIVER_ID,
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
  phone: '303-555-1212',
  address: '11382 High St. Northglenn, CO 80233',
  vehicleMake: 'Ford',
  vehicleModel: 'F150',
  vehicleYear: 1998,
};

const requestContext = {
  authorizer: {
    claims: {
      sub: DRIVER_ID,
      'custom:role': 'driver',
    },
  },
};
const requestContextAdmin = {
  authorizer: {
    claims: {
      sub: 'admin-id',
      'custom:role': 'admin',
    },
  },
};
const requestContextUser = {
  authorizer: {
    claims: {
      sub: 'user-id',
      'custom:role': 'user',
    },
  },
};

describe('driver lambdas', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should create a driver successfully', async () => {
    const mockCreatedDriver = {
      ...mockDriver,
      createdAt: '2024-09-22T12:00:00Z',
      updatedAt: '2024-09-22T12:00:00Z',
    };

    // Mock createDriverService
    (
      createDriverService as vi.MockedFunction<typeof createDriverService>
    ).mockResolvedValue(mockCreatedDriver);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext,
      body: JSON.stringify(mockDriver),
    };

    const result = await createDriver(event, {} as Context, {} as Callback);
    expect(result?.statusCode).toBe(201);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockCreatedDriver,
    );
    expect(createDriverService).toHaveBeenCalledWith(DRIVER_ID, mockDriver);
  });

  it('should return 400 for invalid create driver input', async () => {
    const invalidDriver = {
      username: 'testdriver',
      // Missing required fields
    };

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext,
      body: JSON.stringify(invalidDriver),
    };

    const result = await createDriver(event, {} as Context, {} as Callback);

    expect(result?.statusCode).toBe(400);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toHaveProperty(
      'message',
      'Invalid input',
    );
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toHaveProperty(
      'errors',
    );
  });

  it('should return 500 for create driver internal server error', async () => {
    (
      createDriverService as vi.MockedFunction<typeof createDriverService>
    ).mockRejectedValue(new Error('Database error'));

    const event: Partial<APIGatewayProxyEvent> = {
      body: JSON.stringify(mockDriver),
    };

    const result = await createDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Internal Server Error',
    });
  });

  it('admin should get drivers successfully', async () => {
    const mockDrivers = [
      mockDriver,
      {
        ...mockDriver,
        id: 'anotherid',
      },
    ];

    (
      getDriversService as vi.MockedFunction<typeof getDriversService>
    ).mockResolvedValue(mockDrivers);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
    };

    const result = await getDrivers(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockDrivers,
    );
  });

  it('admin should get drivers successfully with query params', async () => {
    const mockDrivers = [
      mockDriver,
      {
        ...mockDriver,
        id: 'anotherid',
      },
    ];

    (
      getDriversService as vi.MockedFunction<typeof getDriversService>
    ).mockResolvedValue(mockDrivers);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      queryStringParameters: {
        limit: 22,
        offset: 13,
      },
      requestContext: requestContextAdmin,
    };

    const result = await getDrivers(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockDrivers,
    );
    expect(getDriversService).toHaveBeenCalledWith(22, 13);
  });

  it('should not get drivers when not admin', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext,
    };

    const result = await getDrivers(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should return 500 for get drivers internal server error', async () => {
    // Mock createUserService to throw an error
    (
      getDriversService as vi.MockedFunction<typeof getDriversService>
    ).mockRejectedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
    };

    const result = await getDrivers(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Internal Server Error',
    });
  });

  it('should get a driver successfully', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(mockDriver);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: DRIVER_ID },
      requestContext,
    };

    const result = await getDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockDriver,
    );
    expect(getDriverService).toHaveBeenCalledWith(DRIVER_ID);
  });

  it('admin should get a driver successfully', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(mockDriver);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: DRIVER_ID },
      requestContext: requestContextAdmin,
    };

    const result = await getDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockDriver,
    );
    expect(getDriverService).toHaveBeenCalledWith(DRIVER_ID);
  });

  it('should not get a driver with wrong role', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(mockDriver);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: DRIVER_ID },
      requestContext: requestContextUser,
    };

    const result = await getDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should not get a driver with wrong id', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(mockDriver);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: 'def123' },
      requestContext,
    };

    const result = await getDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should return 404 for get non-existent driver', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(null);
    7;
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: DRIVER_ID },
      requestContext: requestContextAdmin,
    };

    const result = await getDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(404);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Driver not found',
    });
  });

  it('should return 400 for get driver missing userId', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext,
    };

    const result = await getDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(400);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Missing driverId in path parameters',
    });
  });

  it('should return a 403 for get driver invalid access', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: 'xyz' },
      requestContext,
    };

    const result = await getDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should return 500 for get driver internal server error', async () => {
    // Mock createUserService to throw an error
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockRejectedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: DRIVER_ID },
      requestContext,
    };

    const result = await getDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Internal Server Error',
    });
  });

  it('should update a driver successfully', async () => {
    const mockUpdatedDriver = {
      ...mockDriver,
      name: 'Test User',
      phone: '303-555-1212',
    };

    (
      updateDriverService as vi.MockedFunction<typeof updateDriverService>
    ).mockResolvedValue(mockUpdatedDriver);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: DRIVER_ID },
      requestContext,
      body: JSON.stringify({ name: 'John Updated', phone: '1234567890' }),
    };

    const result = await updateDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );
    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockUpdatedDriver,
    );
    expect(updateDriverService).toHaveBeenCalledWith(DRIVER_ID, {
      name: 'John Updated',
      phone: '1234567890',
    });
  });

  it('should return 400 for missing driver id in update user path', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext,
      body: JSON.stringify({ name: '' }), // Assuming empty name is invalid
    };

    const result = await updateDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(400);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toHaveProperty(
      'message',
      'Missing driverId in path parameters',
    );
  });

  it('should return 400 for invalid update driver input', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: DRIVER_ID },
      requestContext,
      body: JSON.stringify({ name: '' }), // Assuming empty name is invalid
    };

    const result = await updateDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(400);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toHaveProperty(
      'message',
      'Invalid input',
    );
  });

  it('should return 404 for update driver non-existent driver', async () => {
    (
      updateDriverService as vi.MockedFunction<typeof updateDriverService>
    ).mockResolvedValue(null);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: DRIVER_ID },
      requestContext: requestContextAdmin,
      body: JSON.stringify({ name: 'John Updated' }),
    };

    const result = await updateDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(404);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Driver not found',
    });
  });

  it('user should return 403 for update driver not authorized', async () => {
    (
      updateDriverService as vi.MockedFunction<typeof updateDriverService>
    ).mockResolvedValue(mockDriver);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: DRIVER_ID },
      requestContext: requestContextUser,
      body: JSON.stringify({ name: 'John Updated' }),
    };

    const result = await updateDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should return 500 for update driver internal server error', async () => {
    // Mock updateDriverService to throw an error
    (
      updateDriverService as vi.MockedFunction<typeof updateDriverService>
    ).mockRejectedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: DRIVER_ID },
      requestContext,
      body: JSON.stringify({ name: 'John Updated' }),
    };

    const result = await updateDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );
    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Internal Server Error',
    });
  });

  it('should return 204 for delete driver success', async () => {
    (
      deleteDriverService as vi.MockedFunction<typeof deleteDriverService>
    ).mockResolvedValue(mockDriver);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: DRIVER_ID },
      requestContext,
    };

    const result = await deleteDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(204);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockDriver,
    );
  });

  it('should return 204 for delete driver admin success', async () => {
    (
      deleteDriverService as vi.MockedFunction<typeof deleteDriverService>
    ).mockResolvedValue(mockDriver);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: DRIVER_ID },
      requestContext: requestContextAdmin,
    };

    const result = await deleteDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(204);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockDriver,
    );
  });

  it('should return 404 for delete driver non-existent driver', async () => {
    (
      deleteDriverService as vi.MockedFunction<typeof deleteDriverService>
    ).mockResolvedValue(null);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: 'nonexistent' },
      requestContext: requestContextAdmin,
    };

    const result = await deleteDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(404);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Driver not found',
    });
  });

  it('should return 400 for delete driver missing driver id parameter', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext,
    };

    const result = await deleteDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(400);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toHaveProperty(
      'message',
      'Missing driverId in path parameters',
    );
  });

  it('should return 403 for delete driver not authorized', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: 'abc123' },
      requestContext,
    };

    const result = await deleteDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should return 403 for delete driver wrong role', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: DRIVER_ID },
      requestContext: requestContextUser,
    };

    const result = await deleteDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should return 500 for delete driver internal server error', async () => {
    // Mock createUserService to throw an error
    (
      deleteDriverService as vi.MockedFunction<typeof deleteDriverService>
    ).mockRejectedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: DRIVER_ID },
      requestContext,
    };

    const result = await deleteDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Internal Server Error',
    });
  });
});
