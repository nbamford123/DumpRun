import { vi, describe, it, expect, beforeEach } from 'vitest';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Callback,
  Context,
} from 'aws-lambda';
import type { DeepPartial } from '@/utils/DeepPartial.js';

// Mock the entire userServices module
vi.mock('../pickupServices', () => ({
  createPickupService: vi.fn(),
  getPickupService: vi.fn(),
  getPickupsService: vi.fn(),
  updatePickupService: vi.fn(),
  deletePickupService: vi.fn(),
  availablePickupsService: vi.fn(),
  acceptPickupService: vi.fn(),
  cancelAcceptedPickup: vi.fn(),
}));

// Import after mocking
import {
  createPickup,
  getPickup,
  getPickups,
  updatePickup,
  deletePickup,
  availablePickups,
  acceptPickup,
  cancelAcceptedPickup,
} from '../pickupHandlers.js';
import {
  createPickupService,
  getPickupService,
  getPickupsService,
  updatePickupService,
  deletePickupService,
  availablePickupsService,
  acceptPickupService,
} from '../pickupServices.js';

const USER_ID = 'user-id';
const DRIVER_ID = 'driver-id';
const mockPickup = {
  location: '11382 High St. Northglenn, CO 80233',
  estimatedWeight: 150,
  requestedTime: new Date(Date.now() + 60000).toISOString(),
  wasteType: 'green',
};
const mockCreatedPickup = {
  ...mockPickup,
  userId: USER_ID,
  status: 'available',
  createdAt: '2024-09-22T12:00:00Z',
  updatedAt: '2024-09-22T12:00:00Z',
};
const mockAcceptedPickup = {
  ...mockCreatedPickup,
  driverId: DRIVER_ID,
  status: 'accepted',
};
const requestContext = {
  authorizer: {
    claims: {
      sub: USER_ID,
      'custom:role': 'user',
    },
  },
};
const requestContextDriver = {
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
      sub: USER_ID,
      'custom:role': 'admin',
    },
  },
};

describe('pickup lambdas', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should create a pickup successfully', async () => {
    // Mock createPickupService
    (
      createPickupService as vi.MockedFunction<typeof createPickupService>
    ).mockResolvedValue(mockCreatedPickup);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      body: JSON.stringify(mockPickup),
      requestContext,
    };

    const result = await createPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );
    expect(result?.statusCode).toBe(201);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockCreatedPickup,
    );
    expect(createPickupService).toHaveBeenCalledWith('user-id', mockPickup);
  });

  it('should return 400 for invalid create pickup input', async () => {
    const mockInvalidPickup = {
      location: '11382 High St. Northglenn, CO 80233',
    };

    const event: DeepPartial<APIGatewayProxyEvent> = {
      body: JSON.stringify(mockInvalidPickup),
      requestContext,
    };

    const result = await createPickup(
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

  it('should create a pickup successfully as admin', async () => {
    // Mock createPickupService
    (
      createPickupService as vi.MockedFunction<typeof createPickupService>
    ).mockResolvedValue(mockCreatedPickup);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      body: JSON.stringify(mockPickup),
      requestContext: requestContextAdmin,
    };

    const result = await createPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );
    expect(result?.statusCode).toBe(201);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockCreatedPickup,
    );
    expect(createPickupService).toHaveBeenCalledWith('user-id', mockPickup);
  });

  it('should return 403 for createPickup invalid custom role', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      body: JSON.stringify(mockPickup),
      requestContext: requestContextDriver,
    };

    const result = await createPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toHaveProperty(
      'message',
      'Not authorized',
    );
  });

  it('should return 500 for create pickup internal server error', async () => {
    // Mock createDriverService to throw an error
    (
      createPickupService as vi.MockedFunction<typeof createPickupService>
    ).mockRejectedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      body: JSON.stringify(mockPickup),
      requestContext,
    };

    const result = await createPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Internal Server Error',
    });
  });

  it('should get a pickup successfully as admin', async () => {
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockCreatedPickup);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext: requestContextAdmin,
    };

    const result = await getPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockCreatedPickup,
    );
    expect(getPickupService).toHaveBeenCalledWith('123');
  });

  it('should get a pickup successfully', async () => {
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockCreatedPickup);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext,
    };

    const result = await getPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockCreatedPickup,
    );
    expect(getPickupService).toHaveBeenCalledWith('123');
  });

  it('should get a deleted pickup successfully as admin', async () => {
    const mockDeletedPickup = { ...mockCreatedPickup, status: 'deleted' };
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockDeletedPickup);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123', includeDeleted: true },
      requestContext: requestContextAdmin,
    };

    const result = await getPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockDeletedPickup,
    );
    expect(getPickupService).toHaveBeenCalledWith('123');
  });

  it('should get a pickup successfully as driver when assigned', async () => {
    const mockAcceptedPickup = { ...mockCreatedPickup, driverId: DRIVER_ID };
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockAcceptedPickup);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext: requestContextDriver,
    };

    const result = await getPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockAcceptedPickup,
    );
    expect(getPickupService).toHaveBeenCalledWith('123');
  });

  it('should get a pickup successfully as driver when available', async () => {
    const mockAcceptedPickup = { ...mockCreatedPickup, driverId: DRIVER_ID };
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockAcceptedPickup);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext: requestContextDriver,
    };

    const result = await getPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockAcceptedPickup,
    );
    expect(getPickupService).toHaveBeenCalledWith('123');
  });

  it('should fail to get a pickup successfully as driver when not available or assigned', async () => {
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue({ ...mockCreatedPickup, status: 'in_progress' });

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext: requestContextDriver,
    };

    const result = await getPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should fail to get a pickup successfully as driver when deleted', async () => {
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue({ ...mockAcceptedPickup, status: 'deleted' });

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123', includeDeleted: true },
      requestContext: requestContextDriver,
    };

    const result = await getPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(404);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Pickup not found',
    });
    expect(getPickupService).toHaveBeenCalledWith('123');
  });

  it('should fail to get a pickup successfully as user when deleted', async () => {
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue({ ...mockCreatedPickup, status: 'deleted' });

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123', includeDeleted: true },
      requestContext,
    };

    const result = await getPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(404);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Pickup not found',
    });
    expect(getPickupService).toHaveBeenCalledWith('123');
  });

  it('should fail to get a pickup successfully as user when wrong id', async () => {
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue({ ...mockCreatedPickup, userId: '456' });

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext,
    };

    const result = await getPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should return 404 for get non-existent pickup', async () => {
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(null);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: 'nonexistent' },
      requestContext,
    };

    const result = await getPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(404);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Pickup not found',
    });
  });

  it('should return 400 for get pickup missing pickupId', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {},
    };

    const result = await getPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(400);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Missing pickupId in path parameters',
    });
  });

  it('should return 500 for get pickup internal server error', async () => {
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockRejectedValue(new Error('Database error'));

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: 'nonexistent' },
    };

    const result = await getPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Internal Server Error',
    });
  });

  it('should get pickups successfully when admin', async () => {
    const mockPickups = [mockCreatedPickup, { ...mockCreatedPickup, id: 234 }];
    (
      getPickupsService as vi.MockedFunction<typeof getPickupsService>
    ).mockResolvedValue({ pickups: mockPickups, nextCursor: 'def345' });

    const event: DeepPartial<APIGatewayProxyEvent> = {
      queryStringParameters: {
        status: ['pending', 'assigned'],
        limit: 22,
        cursor: 'abc123',
      },
      requestContext: requestContextAdmin,
    };

    const result = await getPickups(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(getPickupsService).toHaveBeenCalledWith(22, 'abc123', [
      'pending',
      'assigned',
    ]);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      pickups: mockPickups,
      nextCursor: 'def345',
    });
  });

  it('should fail to get pickups when not admin', async () => {
    const mockPickups = [mockCreatedPickup, { ...mockCreatedPickup, id: 234 }];
    (
      getPickupsService as vi.MockedFunction<typeof getPickupsService>
    ).mockResolvedValue(mockPickups);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      queryStringParameters: {
        status: ['pending', 'assigned'],
        limit: 22,
        cursor: 'abc123',
      },
      requestContext,
    };

    const result = await getPickups(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should return 500 for get pickups internal server error', async () => {
    (
      getPickupsService as vi.MockedFunction<typeof getPickupsService>
    ).mockRejectedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      queryStringParameters: {
        status: ['pending', 'assigned'],
        limit: 22,
        cursor: 'abc123',
      },
      requestContext: requestContextAdmin,
    };

    const result = await getPickups(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Internal Server Error',
    });
  });

  it('should update a pickup successfully', async () => {
    const mockUpdatedPickup = {
      ...mockCreatedPickup,
      estimatedWeight: 200,
      createdAt: '2023-09-23T12:00:00Z',
      updatedAt: '2023-09-24T12:00:00Z',
    };
    // Update calls get pickup
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockCreatedPickup);

    (
      updatePickupService as vi.MockedFunction<typeof updatePickupService>
    ).mockResolvedValue(mockUpdatedPickup);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext,
      body: JSON.stringify({ estimatedWeight: 200 }),
    };

    const result = await updatePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );
    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockUpdatedPickup,
    );
    expect(updatePickupService).toHaveBeenCalledWith('123', {
      estimatedWeight: 200,
    });
  });

  it('should return 400 for invalid update pickup input', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext,
      body: JSON.stringify({ estimatedWeight: -100 }),
    };
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockCreatedPickup);

    const result = await updatePickup(
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

  it('should return 400 for invalid update pickup input with unallowed fields', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext,
      body: JSON.stringify({ userdId: 234 }),
    };
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockCreatedPickup);

    const result = await updatePickup(
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

  it('should return 400 for update pickup missing pickupid', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext,
      body: JSON.stringify({ estimatedWeight: -100 }),
    };

    const result = await updatePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(400);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toHaveProperty(
      'message',
      'Missing pickupId in path parameters',
    );
  });

  it('should return 404 for update pickup non-existent pickup', async () => {
    // Update calls get pickup
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(null);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: 'invalid' },
      requestContext,
      body: JSON.stringify({ estimatedWeight: 400 }),
    };

    const result = await updatePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(404);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Pickup not found',
    });
  });

  it('should return 404 for update pickup with deleted pickup', async () => {
    // Update calls get pickup
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue({ ...mockCreatedPickup, status: 'deleted' });

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: 123 },
      requestContext,
      body: JSON.stringify({ estimatedWeight: 400 }),
    };

    const result = await updatePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(404);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Pickup not found',
    });
  });

  it('should return 500 for update pickup internal server error', async () => {
    // Update calls get pickup
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockCreatedPickup);

    // Mock updateDriverService to throw an error
    (
      updatePickupService as vi.MockedFunction<typeof updatePickupService>
    ).mockRejectedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext,
      body: JSON.stringify({ estimatedWeight: 400 }),
    };

    const result = await updatePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );
    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Internal server error',
    });
  });

  it('should return 200 for valid delete pickup', async () => {
    const mockDeletedPickup = { ...mockCreatedPickup, status: 'deleted' };
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockCreatedPickup);
    (
      deletePickupService as vi.MockedFunction<typeof deletePickupService>
    ).mockResolvedValue(mockDeletedPickup);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext,
    };

    const result = await deletePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(deletePickupService).toHaveBeenCalledWith('123');
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockDeletedPickup,
    );
  });

  it('should return 200 for valid delete pickup when admin', async () => {
    const mockDeletedPickup = { ...mockCreatedPickup, status: 'deleted' };
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockCreatedPickup);
    (
      deletePickupService as vi.MockedFunction<typeof deletePickupService>
    ).mockResolvedValue(mockDeletedPickup);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext: requestContextAdmin,
    };

    const result = await deletePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(deletePickupService).toHaveBeenCalledWith('123');
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockDeletedPickup,
    );
  });

  it('should return 204 for valid hard delete pickup when admin', async () => {
    // Update calls get pickup
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockCreatedPickup);
    (
      deletePickupService as vi.MockedFunction<typeof deletePickupService>
    ).mockResolvedValue(mockCreatedPickup);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      queryStringParameters: {
        hardDelete: 'true',
      },
      requestContext: requestContextAdmin,
    };

    const result = await deletePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(204);
    expect(deletePickupService).toHaveBeenCalledWith('123', true);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Pickup deleted successfully',
    });
  });

  it('should return 400 for delete pickup missing pickup id', async () => {
    (
      deletePickupService as vi.MockedFunction<typeof deletePickupService>
    ).mockResolvedValue(null);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext,
    };

    const result = await deletePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(400);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Missing pickupId in path parameters',
    });
  });

  it('should return 404 for delete pickup non-existent pickup', async () => {
    (
      deletePickupService as vi.MockedFunction<typeof deletePickupService>
    ).mockResolvedValue(null);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: 'nonexistent' },
      requestContext,
    };

    const result = await deletePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(404);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Pickup not found',
    });
  });

  it('should return 404 for delete pickup deleted pickup', async () => {
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue({ ...mockCreatedPickup, status: 'deleted' });

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext,
    };

    const result = await deletePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(404);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Pickup not found',
    });
  });

  it('should return 403 for delete pickup with driver role', async () => {
    // Update calls get pickup
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockCreatedPickup);
    (
      deletePickupService as vi.MockedFunction<typeof deletePickupService>
    ).mockResolvedValue(mockCreatedPickup);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext: requestContextDriver,
    };

    const result = await deletePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized to delete this pickup',
    });
  });

  it('should return 403 for delete pickup with improper pickup status', async () => {
    // delete calls get pickup
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue({ ...mockCreatedPickup, status: 'in_progress' });

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext: requestContext,
    };

    const result = await deletePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Cannot delete pickup with status in_progress',
    });

    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue({ ...mockCreatedPickup, status: 'completed' });

    const result2 = await deletePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result2 as APIGatewayProxyResult).body)).toEqual({
      message: 'Cannot delete pickup with status completed',
    });

    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue({ ...mockCreatedPickup, status: 'pending' });

    const result4 = await deletePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result4 as APIGatewayProxyResult).body)).toEqual({
      message: 'Cannot delete pickup with status pending',
    });
  });

  it('should return 500 for delete pickup internal server error', async () => {
    // Update calls get pickup
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockCreatedPickup);
    // Mock deletePickupService to throw an error
    (
      deletePickupService as vi.MockedFunction<typeof deletePickupService>
    ).mockRejectedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
      requestContext,
    };

    const result = await deletePickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Internal server error',
    });
  });
});

it('should return 200 for a valid accept pickup', async () => {
  // Update calls get pickup
  (
    getPickupService as vi.MockedFunction<typeof getPickupService>
  ).mockResolvedValue(mockCreatedPickup);

  (
    acceptPickupService as vi.MockedFunction<typeof acceptPickupService>
  ).mockResolvedValue(mockAcceptedPickup);

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext: requestContextDriver,
  };

  const result = await acceptPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(200);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
    mockAcceptedPickup,
  );
});

it('should return 200 for admin accept pickup', async () => {
  // Update calls get pickup
  (
    getPickupService as vi.MockedFunction<typeof getPickupService>
  ).mockResolvedValue(mockCreatedPickup);

  (
    acceptPickupService as vi.MockedFunction<typeof acceptPickupService>
  ).mockResolvedValue(mockAcceptedPickup);

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext: requestContextAdmin,
  };

  const result = await acceptPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(200);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
    mockAcceptedPickup,
  );
});

it('should return 400 for acceptPickup with an invalid pickupId', async () => {
  // Update calls get pickup
  (
    acceptPickupService as vi.MockedFunction<typeof acceptPickupService>
  ).mockResolvedValue(null);

  const event: DeepPartial<APIGatewayProxyEvent> = {
    requestContext: requestContextDriver,
  };

  const result = await acceptPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(400);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
    message: 'Missing pickupId in path parameters',
  });
});

it('should return 403 for an invalid role for accept pickup', async () => {
  // Update calls get pickup
  (
    getPickupService as vi.MockedFunction<typeof getPickupService>
  ).mockResolvedValue(mockCreatedPickup);

  (
    acceptPickupService as vi.MockedFunction<typeof acceptPickupService>
  ).mockResolvedValue(mockAcceptedPickup);

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext,
  };

  const result = await acceptPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(403);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
    message: 'Not authorized to accept this pickup',
  });
});

it('should return 404 for pickup not found for accept pickup', async () => {
  // Update calls get pickup
  (
    getPickupService as vi.MockedFunction<typeof getPickupService>
  ).mockResolvedValue(null);

  (
    acceptPickupService as vi.MockedFunction<typeof acceptPickupService>
  ).mockResolvedValue(mockAcceptedPickup);

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext: requestContextDriver,
  };

  const result = await acceptPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(404);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
    message: 'Pickup not found',
  });
});

it('should return 404 for deleted pickup for accept pickup', async () => {
  // Update calls get pickup
  (
    getPickupService as vi.MockedFunction<typeof getPickupService>
  ).mockResolvedValue({ ...mockCreatedPickup, status: 'deleted' });

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext: requestContextDriver,
  };

  const result = await acceptPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(404);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
    message: 'Pickup not found',
  });
});

it('should return 409 for a pickup not in available state for accept pickup', async () => {
  // accept calls get pickup
  (
    getPickupService as vi.MockedFunction<typeof getPickupService>
  ).mockResolvedValue({ ...mockCreatedPickup, status: 'cancelled' });

  (
    acceptPickupService as vi.MockedFunction<typeof acceptPickupService>
  ).mockResolvedValue(mockAcceptedPickup);

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext: requestContextDriver,
  };

  const result = await acceptPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(409);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
    message: 'Pickup not available',
  });
});

it('should return 500 for accept pickup internal server error', async () => {
  // Update calls get pickup
  (
    getPickupService as vi.MockedFunction<typeof getPickupService>
  ).mockResolvedValue(mockCreatedPickup);
  // Mock deletePickupService to throw an error
  (
    acceptPickupService as vi.MockedFunction<typeof acceptPickupService>
  ).mockRejectedValue(new Error('Database error'));

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext: requestContextDriver,
  };

  const result = await acceptPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(500);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
    message: 'Internal server error',
  });
});

it('should return 200 for a valid admin  get available pickups', async () => {
  const pickups = [
    mockCreatedPickup,
    { ...mockCreatedPickup, pickupId: 234 },
    { ...mockCreatedPickup, pickupId: 456 },
  ];
  (
    availablePickupsService as vi.MockedFunction<typeof availablePickupsService>
  ).mockResolvedValue(pickups);

  const event: DeepPartial<APIGatewayProxyEvent> = {
    requestContext: requestContextAdmin,
  };

  const result = await availablePickups(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(200);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(pickups);
});

it('should return 200 for a valid get available pickups', async () => {
  const pickups = [
    mockCreatedPickup,
    { ...mockCreatedPickup, pickupId: 234 },
    { ...mockCreatedPickup, pickupId: 456 },
  ];
  (
    availablePickupsService as vi.MockedFunction<typeof availablePickupsService>
  ).mockResolvedValue(pickups);

  const event: DeepPartial<APIGatewayProxyEvent> = {
    requestContext: requestContextDriver,
  };

  const result = await availablePickups(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(200);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(pickups);
});

it('should return 403 for a user get available pickups', async () => {
  const pickups = [
    mockCreatedPickup,
    { ...mockCreatedPickup, pickupId: 234 },
    { ...mockCreatedPickup, pickupId: 456 },
  ];
  (
    availablePickupsService as vi.MockedFunction<typeof availablePickupsService>
  ).mockResolvedValue(pickups);

  const event: DeepPartial<APIGatewayProxyEvent> = {
    requestContext: requestContext,
  };

  const result = await availablePickups(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(403);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
    message: 'Not authorized to accept this pickup',
  });
});

it('should return 500 for available pickups internal server error', async () => {
  // Mock availablePickupsService to throw an error
  (
    availablePickupsService as vi.MockedFunction<typeof availablePickupsService>
  ).mockRejectedValue(new Error('Database error'));

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext: requestContextDriver,
  };

  const result = await availablePickups(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(500);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
    message: 'Internal server error',
  });
});

it('should return 200 for a valid cancel accept pickup', async () => {
  (
    getPickupService as vi.MockedFunction<typeof getPickupService>
  ).mockResolvedValue(mockAcceptedPickup);
  (
    updatePickupService as vi.MockedFunction<typeof updatePickupService>
  ).mockResolvedValue(mockCreatedPickup);

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext: requestContextDriver,
  };

  const result = await cancelAcceptedPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(200);
  expect(updatePickupService).toHaveBeenCalledWith('123', {
    driverId: null,
    status: 'available',
  });
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
    mockCreatedPickup,
  );
});

it('should return 200 for admin cancel pickup', async () => {
  (
    getPickupService as vi.MockedFunction<typeof getPickupService>
  ).mockResolvedValue(mockAcceptedPickup);
  (
    updatePickupService as vi.MockedFunction<typeof updatePickupService>
  ).mockResolvedValue(mockCreatedPickup);

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext: requestContextAdmin,
  };

  const result = await cancelAcceptedPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(200);
  expect(updatePickupService).toHaveBeenCalledWith('123', {
    driverId: null,
    status: 'available',
  });
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
    mockCreatedPickup,
  );
});

it('should return 400 for cancelAcceptedPickup without pickupId', async () => {
  const event: DeepPartial<APIGatewayProxyEvent> = {
    requestContext: requestContextDriver,
  };

  const result = await cancelAcceptedPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(400);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
    message: 'Missing pickupId in path parameters',
  });
});

it('should return 403 for an invalid role for cancel accepted pickup', async () => {
  // Update calls get pickup
  (
    getPickupService as vi.MockedFunction<typeof getPickupService>
  ).mockResolvedValue(mockCreatedPickup);

  (
    acceptPickupService as vi.MockedFunction<typeof acceptPickupService>
  ).mockResolvedValue(mockAcceptedPickup);

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext,
  };

  const result = await cancelAcceptedPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(403);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
    message: 'Not authorized',
  });
});

it('should return 404 for pickup not found for cancel accepted pickup', async () => {
  // Update calls get pickup
  (
    getPickupService as vi.MockedFunction<typeof getPickupService>
  ).mockResolvedValue(null);

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext: requestContextDriver,
  };

  const result = await cancelAcceptedPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(404);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
    message: 'Pickup not found',
  });
});

it('should return 404 for deleted pickup for cancel accepted pickup', async () => {
  // Update calls get pickup
  (
    getPickupService as vi.MockedFunction<typeof getPickupService>
  ).mockResolvedValue({ ...mockAcceptedPickup, status: 'deleted' });

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext: requestContextDriver,
  };

  const result = await cancelAcceptedPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(404);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
    message: 'Pickup not found',
  });
});

it('should return 409 for a invalid pickup state cancel accept pickup', async () => {
  (
    getPickupService as vi.MockedFunction<typeof getPickupService>
  ).mockResolvedValue({ ...mockAcceptedPickup, status: 'pending' });
  (
    updatePickupService as vi.MockedFunction<typeof updatePickupService>
  ).mockResolvedValue(mockCreatedPickup);

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext: requestContextDriver,
  };

  const result = await cancelAcceptedPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(409);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
    message: "Pickup can't be cancelled, current status is: pending",
  });
});

it('should return 500 for cancel accepted pickup internal server error', async () => {
  // Mock availablePickupsService to throw an error
  (
    getPickupService as vi.MockedFunction<typeof getPickupService>
  ).mockRejectedValue(new Error('Database error'));

  const event: DeepPartial<APIGatewayProxyEvent> = {
    pathParameters: { pickupId: '123' },
    requestContext: requestContextDriver,
  };

  const result = await cancelAcceptedPickup(
    event as APIGatewayProxyEvent,
    {} as Context,
    {} as Callback,
  );

  expect(result?.statusCode).toBe(500);
  expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
    message: 'Internal server error',
  });
});
