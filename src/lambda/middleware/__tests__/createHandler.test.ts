import { vi, describe, it, expect } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { z } from 'zod';

import { getCorsHeaders } from '@/utils/corsHeaders';
import type { DeepPartial } from '@/utils/DeepPartial.js';

import { createHandler } from '../createHandler.js';
import {
  requestContextAdmin,
  requestContextDriver,
} from '@/utils/testUtils.js';

const getResult = (statusCode: number, body?: Record<string, unknown>) => ({
  statusCode,
  headers: getCorsHeaders(),
  body: body ? JSON.stringify(body) : undefined,
});
const awsRequestId = 'request123';

describe('createHandler', () => {
  it('should return a successful handler result', async () => {
    const mockHandler = vi.fn();
    const handler = createHandler(mockHandler, { requiredRole: ['admin'] });
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
    };
    await handler(event, {
      awsRequestId,
    } as Context);
    expect(mockHandler).toHaveBeenCalledWith({
      requestId: awsRequestId,
      cognitoUserId: requestContextAdmin.authorizer.claims.sub,
      userRole: requestContextAdmin.authorizer.claims['custom:role'],
    });
  });

  it('should return a 400 handler result for bad input', async () => {
    const errors: unknown[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args);
    });
    const handler = createHandler<'getPostgresHealth'>(vi.fn(), {
      requiredRole: ['admin'],
      validateInput: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email format'),
      }),
    });
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
      body: JSON.stringify({ name: 'Nate' }),
    };
    const result = await handler(event, {
      awsRequestId,
    } as Context);
    expect(result).toEqual(
      getResult(400, {
        code: 'BadRequest',
        message: 'Invalid input',
      })
    );
    expect(errors[0]).toEqual([
      'Input validation failed',
      {
        requestId: 'request123',
        errors: 'Invalid input: email - Required',
      },
    ]);
  });
  // TODO: What really ought to be done here (and for path parameters, is mock the zod helpers)
  it('should return a 400 handler result for invalid query parameters', async () => {
    const errors: unknown[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args);
    });
    const handler = createHandler<'listUsers'>(vi.fn(), {
      requiredRole: ['admin'],
      operation: 'listUsers',
    });
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
      queryStringParameters: {
        limit: 'b',
      },
    };
    const result = await handler(event, {
      awsRequestId,
    } as Context);
    expect(result).toEqual(
      getResult(400, {
        code: 'BadRequest',
        message: 'Invalid query parameters',
      })
    );
    expect(errors[0]).toEqual([
      'Query parameter validation failed',
      {
        requestId: 'request123',
        errors: [
          {
            code: 'invalid_type',
            expected: 'number',
            message: 'Expected number, received string',
            path: ['limit'],
            received: 'string',
          },
        ],
      },
    ]);
  });

  it('should return a 401 handler result for bad auth', async () => {
    const errors: unknown[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args);
    });
    const handler = createHandler(vi.fn(), { requiredRole: ['admin'] });
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: {},
    };
    const result = await handler(event, {
      awsRequestId,
    } as Context);
    expect(result).toEqual(
      getResult(401, {
        code: 'Unauthorized',
        message: 'Invalid authorization data',
      })
    );
    expect(errors[0]).toEqual([
      'Auth validation failed',
      {
        errors: expect.any(Array),
        requestId: 'request123',
      },
    ]);
  });

  it('should return a 403 handler result for invalid role', async () => {
    const errors: unknown[] = [];
    vi.spyOn(console, 'warn').mockImplementation((...args) => {
      errors.push(args);
    });
    const handler = createHandler(vi.fn(), { requiredRole: ['admin'] });
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextDriver,
    };
    const result = await handler(event, {
      awsRequestId,
    } as Context);
    expect(result).toEqual(
      getResult(403, {
        code: 'Forbidden',
        message: 'User does not have required role',
      })
    );
    expect(errors[0]).toEqual([
      'Unauthorized access attempt',
      {
        requestId: 'request123',
        role: 'driver',
      },
    ]);
  });
  it('should get 500 for handler internal server error', async () => {
    const errors: unknown[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args);
    });
    const mockHandler = vi.fn();
    mockHandler.mockRejectedValue(new Error('Database error'));

    const handler = createHandler(mockHandler, { requiredRole: ['admin'] });
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
    };
    const result = await handler(event, {
      awsRequestId,
    } as Context);
    expect(result).toEqual(
      getResult(500, {
        code: 'InternalServerError',
        message: 'An unexpected error occurred',
      })
    );
    expect(errors[0]).toEqual([
      'Handler execution failed',
      {
        requestId: awsRequestId,
        error: 'Database error',
      },
    ]);
  });
});
