import { vi, describe, it, expect, beforeEach } from 'vitest';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Callback,
  Context,
} from 'aws-lambda';
import { schemas } from '@/schemas/zodSchemas.js';

// Mock the entire userServices module
vi.mock('../driverServices', () => ({
  createDriverService: vi.fn(),
  getDriverService: vi.fn(),
  updateDriverService: vi.fn(),
  deleteDriverService: vi.fn(),
}));

// Import after mocking
import {
  createDriver,
  getDriver,
  updateDriver,
  deleteDriver,
} from '../driverHandlers.js';
import {
  createDriverService,
  getDriverService,
  updateDriverService,
  deleteDriverService,
} from '../driverServices.js';

describe('driver lambdas', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should create a driver successfully', async () => {
    const mockDriver = {
      username: 'testuser',
      email: 'test@example.com',
      name: 'Test User',
      phone: '303-555-1212',
      address: '11382 High St. Northglenn, CO 80233',
      password: 'password',
      vehicleMake: 'Ford',
      vehicleModel: 'F150',
      vehicleYear: 1998,
    };
    const mockCreatedDriver = {
      ...mockDriver,
      createdAt: '2024-09-22T12:00:00Z',
      updatedAt: '2024-09-22T12:00:00Z',
    };

    // Mock createUserService
    (
      createDriverService as vi.MockedFunction<typeof createDriverService>
    ).mockResolvedValue(mockCreatedDriver);

    const event: Partial<APIGatewayProxyEvent> = {
      body: JSON.stringify(mockDriver),
    };

    const result = await createDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );
    expect(result?.statusCode).toBe(201);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockCreatedDriver,
    );
    expect(createDriverService).toHaveBeenCalledWith(mockDriver);
  });

  it('should return 400 for invalid create driver input', async () => {
    const invalidDriver = {
      username: 'testuser',
      // Missing required fields
    };

    const event: Partial<APIGatewayProxyEvent> = {
      body: JSON.stringify(invalidDriver),
    };

    const result = await createDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

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
    const mockDriver = {
      username: 'testuser',
      email: 'test@example.com',
      name: 'Test User',
      phone: '303-555-1212',
      address: '11382 High St. Northglenn, CO 80233',
      password: 'password',
      vehicleMake: 'Ford',
      vehicleModel: 'F150',
      vehicleYear: 1998,
    };

    // Mock createDriverService to throw an error
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

  it('should get a driver successfully', async () => {
    const mockDriver = {
      username: 'testuser',
      email: 'test@example.com',
      name: 'Test User',
      phone: '303-555-1212',
      address: '11382 High St. Northglenn, CO 80233',
      password: 'password',
      vehicleMake: 'Ford',
      vehicleModel: 'F150',
      vehicleYear: 1998,
    };

    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(mockDriver);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: 'user123' },
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
    expect(getDriverService).toHaveBeenCalledWith('user123');
  });

  it('should return 404 for get non-existent user', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(null);
    7;
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: 'nonexistent' },
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
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {},
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

  it('should return 500 for get driver internal server error', async () => {
    // Mock createUserService to throw an error
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockRejectedValue(new Error('Database error'));

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: 'nonexistent' },
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
      username: 'testuser',
      email: 'test@example.com',
      name: 'Test User',
      phone: '303-555-1212',
      address: '11382 High St. Northglenn, CO 80233',
      password: 'password',
      vehicleMake: 'Ford',
      vehicleModel: 'F150',
      vehicleYear: 1998,
      createdAt: '2023-09-23T12:00:00Z',
      updatedAt: '2023-09-24T12:00:00Z',
    };

    (
      updateDriverService as vi.MockedFunction<typeof updateDriverService>
    ).mockResolvedValue(mockUpdatedDriver);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: 'user123' },
      body: JSON.stringify({ name: 'John Updated', phone: '1234567890' }),
    };

    const result = await updateDriver(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );
    console.log(result);
    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockUpdatedDriver,
    );
    expect(updateDriverService).toHaveBeenCalledWith('user123', {
      name: 'John Updated',
      phone: '1234567890',
    });
  });

  it('should return 400 for invalid update driver input', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: 'user123' },
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

  it('should return 404 for update user non-existent driver', async () => {
    (
      updateDriverService as vi.MockedFunction<typeof updateDriverService>
    ).mockResolvedValue(null);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: 'nonexistent' },
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

  it('should return 500 for update user internal server error', async () => {
    // Mock updateDriverService to throw an error
    (
      updateDriverService as vi.MockedFunction<typeof updateDriverService>
    ).mockRejectedValue(new Error('Database error'));

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: 'nonexistent' },
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

  it('should return 404 for delete user non-existent driver', async () => {
    (
      deleteDriverService as vi.MockedFunction<typeof deleteDriverService>
    ).mockResolvedValue(null);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: 'nonexistent' },
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

  it('should return 500 for delete driver internal server error', async () => {
    // Mock createUserService to throw an error
    (
      deleteDriverService as vi.MockedFunction<typeof deleteDriverService>
    ).mockRejectedValue(new Error('Database error'));

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: '22' },
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
