import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent } from 'aws-lambda';

import {
  requestContextAdmin,
  requestContextDriver,
  requestContextUser,
  mockLambdaContext,
  getResult,
} from '@/utils/testUtils.js';
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

const mockDriverId = requestContextDriver.authorizer.claims.sub;
const mockDriver = {
  id: mockDriverId,
  firstName: 'test',
  lastName: 'user',
  email: 'test@example.com',
  name: 'Test User',
  phoneNumber: '303-555-1212',
  address: {
    street: '11382 High St.',
    city: 'Northglenn',
    state: 'CO',
    zipCode: '80233',
  },
  preferredContact: 'TEXT',
  vehicleMake: 'Ford',
  vehicleModel: 'F150',
  vehicleYear: 1998,
  createdAt: '2023-09-23T12:00:00Z',
  updatedAt: '2023-09-23T12:00:00Z',
};

describe('driver lambdas', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should create a driver successfully', async () => {
    // Mock createDriverService
    (
      createDriverService as vi.MockedFunction<typeof createDriverService>
    ).mockResolvedValue({ type: 'success', user: mockDriver });

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
      body: JSON.stringify(mockDriver),
    };

    const result = await createDriver(event, mockLambdaContext);
    expect(result).toEqual(getResult(201, mockDriver));
    expect(createDriverService).toHaveBeenCalledWith(
      expect.anything(),
      mockDriver
    );
  });

  it('should return 400 for invalid create driver input', async () => {
    const invalidDriver = {
      username: 'testdriver',
      // Missing required fields
    };
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
      body: JSON.stringify(invalidDriver),
    };
    const result = await createDriver(event, mockLambdaContext);

    expect(result?.statusCode).toBe(400);
  });

  it('should return 409 for create driver phone number exists', async () => {
    // Mock createDriverService
    (
      createDriverService as vi.MockedFunction<typeof createDriverService>
    ).mockResolvedValue({
      type: 'phone_exists',
      phoneNumber: mockDriver.phoneNumber,
    });

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
      body: JSON.stringify(mockDriver),
    };

    const result = await createDriver(event, mockLambdaContext);
    expect(result.statusCode).toEqual(409);
    expect(JSON.parse(result.body).message).toEqual(
      `A user with phone number ${mockDriver.phoneNumber} already exists`
    );
  });

  it('should return 409 for create driver email exists', async () => {
    // Mock createDriverService
    (
      createDriverService as vi.MockedFunction<typeof createDriverService>
    ).mockResolvedValue({ type: 'email_exists', email: mockDriver.email });

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
      body: JSON.stringify(mockDriver),
    };

    const result = await createDriver(event, mockLambdaContext);
    expect(result.statusCode).toEqual(409);
    expect(JSON.parse(result.body).message).toEqual(
      `A user with email ${mockDriver.email} already exists`
    );
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
    const result = await getDrivers(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(200, { drivers: mockDrivers, total: mockDrivers.length })
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
    const result = await getDrivers(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(200, { drivers: mockDrivers, total: mockDrivers.length })
    );
    expect(getDriversService).toHaveBeenCalledWith(expect.anything(), 22, 13);
  });

  it('should get a driver successfully', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(mockDriver);
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: mockDriverId },
      requestContext: requestContextDriver,
    };

    const result = await getDriver(event, mockLambdaContext);

    expect(result).toEqual(getResult(200, mockDriver));
    expect(getDriverService).toHaveBeenCalledWith(
      expect.anything(),
      mockDriverId
    );
  });

  it('should not get a driver with wrong id', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue({ ...mockDriver, id: 'abc123' });
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: mockDriverId },
      requestContext: requestContextDriver,
    };
    const result = await getDriver(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(403, {
        code: 'Forbidden',
        message: "User doesn't have permission",
      })
    );
  });

  it('should return 404 for get non-existent driver', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(null);
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: mockDriverId },
      requestContext: requestContextAdmin,
    };
    const result = await getDriver(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(404, { code: 'NotFound', message: 'Driver not found' })
    );
  });

  it('should return 400 for get driver missing driverId', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextDriver,
    };
    const result = await getDriver(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(400, {
        code: 'BadRequest',
        message: 'Invalid path parameter: driverId - Required',
      })
    );
  });

  it('should update a driver successfully', async () => {
    const mockUpdatedDriver = {
      ...mockDriver,
      name: 'John Updated',
      phone: '1234567890',
    };
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(mockDriver);
    (
      updateDriverService as vi.MockedFunction<typeof updateDriverService>
    ).mockResolvedValue(mockUpdatedDriver);
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: mockDriverId },
      requestContext: requestContextDriver,
      body: JSON.stringify({ name: 'John Updated', phone: '1234567890' }),
    };

    const result = await updateDriver(event, mockLambdaContext);
    expect(result).toEqual(getResult(200, mockUpdatedDriver));
    expect(updateDriverService).toHaveBeenCalledWith(
      expect.anything(),
      mockDriverId,
      {
        name: 'John Updated',
        phone: '1234567890',
      }
    );
  });

  it('should return 400 for missing driver id', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextDriver,
    };
    const result = await updateDriver(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(400, {
        code: 'BadRequest',
        message: 'Invalid path parameter: driverId - Required',
      })
    );
  });

  it('should return 400 for invalid update driver input', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: mockDriverId },
      requestContext: requestContextDriver,
      body: JSON.stringify({ firstName: '' }), // Assuming empty name is invalid
    };
    const result = await updateDriver(event, mockLambdaContext);

    expect(result?.statusCode).toBe(400);
  });

  it('should return 404 for update driver non-existent driver', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(null);
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: mockDriverId },
      requestContext: requestContextAdmin,
      body: JSON.stringify({ name: 'John Updated' }),
    };
    const result = await updateDriver(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(404, { code: 'NotFound', message: 'Driver not found' })
    );
  });

  it('user should return 403 for update driver not authorized', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue({ ...mockDriver, id: 'abc123' });
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: mockDriverId },
      requestContext: requestContextUser,
      body: JSON.stringify({ name: 'John Updated' }),
    };
    const result = await updateDriver(event, mockLambdaContext);

    expect(result?.statusCode).toBe(403);
  });

  it('should return 204 for delete driver success', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(mockDriver);
    (
      deleteDriverService as vi.MockedFunction<typeof deleteDriverService>
    ).mockResolvedValue(mockDriver);
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: mockDriverId },
      requestContext: requestContextDriver,
    };
    const result = await deleteDriver(event, mockLambdaContext);

    expect(result).toEqual(getResult(204, mockDriver));
  });

  it('should return 204 for delete driver admin success', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(mockDriver);
    (
      deleteDriverService as vi.MockedFunction<typeof deleteDriverService>
    ).mockResolvedValue(mockDriver);
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: mockDriverId },
      requestContext: requestContextAdmin,
    };
    const result = await deleteDriver(event, mockLambdaContext);

    expect(result).toEqual(getResult(204, mockDriver));
  });

  it('should return 404 for delete driver non-existent driver', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue(null);
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: mockDriverId },
      requestContext: requestContextDriver,
    };
    const result = await deleteDriver(event, mockLambdaContext);

    expect(result?.statusCode).toBe(404);
  });

  it('should return 400 for delete driver missing driver id parameter', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextDriver,
    };
    const result = await deleteDriver(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(400, {
        code: 'BadRequest',
        message: 'Invalid path parameter: driverId - Required',
      })
    );
  });

  it('should return 403 for delete driver not authorized', async () => {
    (
      getDriverService as vi.MockedFunction<typeof getDriverService>
    ).mockResolvedValue({ ...mockDriver, id: 'abc123' });
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: mockDriverId },
      requestContext: requestContextDriver,
    };
    const result = await deleteDriver(event, mockLambdaContext);

    expect(result?.statusCode).toBe(403);
  });

  it('should return 403 for delete driver wrong role', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { driverId: mockDriverId },
      requestContext: requestContextUser,
    };
    const result = await deleteDriver(event, mockLambdaContext);

    expect(result?.statusCode).toBe(403);
  });
});
