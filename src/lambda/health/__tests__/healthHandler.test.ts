import { vi, describe, it, expect, beforeEach } from 'vitest';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Callback,
  Context,
} from 'aws-lambda';

import type { DeepPartial } from '@/utils/DeepPartial.js';
import type { HealthCheck } from '../types.js';
// Mock the entire userServices module
vi.mock('../healthServices', () => ({
  checkPostgresHealth: vi.fn(),
  checkDynamoDBHealth: vi.fn(),
}));

// Import after mocking
import { handler as postgresHealth } from '../postgresHealth.js';
import { handler as dynamoDBHealth } from '../dynamodbHealth.js';
import { checkPostgresHealth, checkDynamoDBHealth } from '../healthServices.js';

const mockHealthyStatus: HealthCheck = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
};
const mockUnhealthyStatus: HealthCheck = {
  status: 'unhealthy',
  timestamp: new Date().toISOString(),
};

const requestContextNonAdmin = {
  authorizer: {
    claims: {
      sub: 'driver_id',
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

describe('health check lambdas', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should get a healthy postgres result successfully', async () => {
    (
      checkPostgresHealth as vi.MockedFunction<typeof checkPostgresHealth>
    ).mockResolvedValue(mockHealthyStatus);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
    };

    const result = await postgresHealth(event, {} as Context, {} as Callback);
    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockHealthyStatus,
    );
  });

  it('should get an unhealthy postgres result successfully', async () => {
    (
      checkPostgresHealth as vi.MockedFunction<typeof checkPostgresHealth>
    ).mockResolvedValue(mockUnhealthyStatus);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
    };

    const result = await postgresHealth(event, {} as Context, {} as Callback);
    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockUnhealthyStatus,
    );
  });

  it('should return 403 for postgres health unauthorized', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextNonAdmin,
    };

    const result = await postgresHealth(event, {} as Context, {} as Callback);

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toHaveProperty(
      'message',
      'Not authorized',
    );
  });

  it('should return 500 for postgres health internal server error', async () => {
    (
      checkPostgresHealth as vi.MockedFunction<typeof checkPostgresHealth>
    ).mockRejectedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
    };

    const result = await postgresHealth(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Database error',
      status: 'unhealthy',
      timestamp: expect.any(String),
    });
  });

  it('should get a healthy dynamodb result successfully', async () => {
    (
      checkDynamoDBHealth as vi.MockedFunction<typeof checkDynamoDBHealth>
    ).mockResolvedValue(mockHealthyStatus);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
    };

    const result = await dynamoDBHealth(event, {} as Context, {} as Callback);
    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockHealthyStatus,
    );
  });

  it('should get an unhealthy postgres result successfully', async () => {
    (
      checkDynamoDBHealth as vi.MockedFunction<typeof checkDynamoDBHealth>
    ).mockResolvedValue(mockUnhealthyStatus);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
    };

    const result = await dynamoDBHealth(event, {} as Context, {} as Callback);
    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockUnhealthyStatus,
    );
  });

  it('should return 403 for postgres health unauthorized', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextNonAdmin,
    };

    const result = await dynamoDBHealth(event, {} as Context, {} as Callback);

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toHaveProperty(
      'message',
      'Not authorized',
    );
  });

  it('should return 500 for postgres health internal server error', async () => {
    (
      checkDynamoDBHealth as vi.MockedFunction<typeof checkDynamoDBHealth>
    ).mockRejectedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
    };

    const result = await dynamoDBHealth(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Database error',
      status: 'unhealthy',
      timestamp: expect.any(String),
    });
  });
});
