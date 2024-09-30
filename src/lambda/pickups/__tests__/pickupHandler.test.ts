import { vi, describe, it, expect, beforeEach } from 'vitest';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Callback,
  Context,
} from 'aws-lambda';
import { AuthInfoSchema } from '@/schemas/zodSchemas.js';
import type { DeepPartial } from '@/utils/DeepPartial.js';

// Mock the entire userServices module
vi.mock('../pickupServices', () => ({
  createPickupService: vi.fn(),
  getPickupService: vi.fn(),
  updatePickupService: vi.fn(),
  deletePickupService: vi.fn(),
}));

vi.mock('@/schemas/zodSchemas.js', async (importOriginal) => {
  const originalModule = (await importOriginal()) as Record<string, unknown>;
  return {
    ...originalModule,
    AuthInfoSchema: {
      parse: vi.fn(),
    },
  };
});

// Import after mocking
import {
  createPickup,
  getPickup,
  updatePickup,
  deletePickup,
  availablePickups,
  acceptPickup,
} from '../pickupHandlers.js';
import {
  createPickupService,
  getPickupService,
  updatePickupService,
  deletePickupService,
  availablePickupsService,
  acceptPickupService,
} from '../pickupServices.js';

const USER_ID = 'user-id';
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
const mockAuthInfo = {
  sub: USER_ID,
  'custom:role': 'user',
};
const requestContext = {
  authorizer: {
    claims: {
      sub: USER_ID,
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
    // Mock authInfo
    (AuthInfoSchema.parse as vi.Mock).mockReturnValue(mockAuthInfo);

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
    // Mock authInfo
    const mockAuthInfo = {
      'custom:role': 'user',
    };
    (AuthInfoSchema.parse as vi.Mock).mockReturnValue(mockAuthInfo);

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

  it('should return 403 for invalid custom role', async () => {
    // Mock authInfo
    const mockAuthInfo = {
      'custom:role': 'driver',
    };
    (AuthInfoSchema.parse as vi.Mock).mockReturnValue(mockAuthInfo);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      body: JSON.stringify(mockPickup),
      requestContext,
    };

    const result = await createPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toHaveProperty(
      'message',
      'Forbidden: Insufficient permissions to create pickup',
    );
  });

  it('should return 500 for create pickup internal server error', async () => {
    // Mock createDriverService to throw an error
    (
      createPickupService as vi.MockedFunction<typeof createPickupService>
    ).mockRejectedValue(new Error('Database error'));
    (AuthInfoSchema.parse as vi.Mock).mockReturnValue(mockAuthInfo);

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

  it('should get a pickup successfully', async () => {
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockPickup);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: '123' },
    };

    const result = await getPickup(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockPickup,
    );
    expect(getPickupService).toHaveBeenCalledWith('123');
  });

  it('should return 404 for get non-existent pickup', async () => {
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(null);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { pickupId: 'nonexistent' },
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
    // Mock authInfo
    (AuthInfoSchema.parse as vi.Mock).mockReturnValue(mockAuthInfo);

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
      body: JSON.stringify({ estimatedWeight: -100 }), // Assuming empty name is invalid
    };
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockCreatedPickup);
    // Mock authInfo
    (AuthInfoSchema.parse as vi.Mock).mockReturnValue(mockAuthInfo);

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

  it('should return 404 for update pickup non-existent pickup', async () => {
    // Update calls get pickup
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(null);

    // Mock authInfo
    (AuthInfoSchema.parse as vi.Mock).mockReturnValue(mockAuthInfo);

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

  it('should return 500 for update pickup internal server error', async () => {
    // Update calls get pickup
    (
      getPickupService as vi.MockedFunction<typeof getPickupService>
    ).mockResolvedValue(mockCreatedPickup);

    // Mock authInfo
    (AuthInfoSchema.parse as vi.Mock).mockReturnValue(mockAuthInfo);
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

  // it('should return 404 for delete user non-existent driver', async () => {
  //   (
  //     deleteDriverService as vi.MockedFunction<typeof deleteDriverService>
  //   ).mockResolvedValue(null);

  //   const event: Partial<APIGatewayProxyEvent> = {
  //     pathParameters: { driverId: 'nonexistent' },
  //   };

  //   const result = await deleteDriver(
  //     event as APIGatewayProxyEvent,
  //     {} as any,
  //     {} as any,
  //   );

  //   expect(result?.statusCode).toBe(404);
  //   expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
  //     message: 'Driver not found',
  //   });
  // });

  // it('should return 500 for delete driver internal server error', async () => {
  //   // Mock createUserService to throw an error
  //   (
  //     deleteDriverService as vi.MockedFunction<typeof deleteDriverService>
  //   ).mockRejectedValue(new Error('Database error'));

  //   const event: Partial<APIGatewayProxyEvent> = {
  //     pathParameters: { driverId: '22' },
  //   };

  //   const result = await deleteDriver(
  //     event as APIGatewayProxyEvent,
  //     {} as any,
  //     {} as any,
  //   );

  //   expect(result?.statusCode).toBe(500);
  //   expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
  //     message: 'Internal Server Error',
  //   });
  // });
});
