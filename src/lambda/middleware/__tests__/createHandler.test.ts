import { vi, describe, it, expect, afterEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

import { getCorsHeaders } from '@/utils/corsHeaders';
import type { DeepPartial } from '@/utils/DeepPartial.js';
// Mock the entire userServices module
vi.mock('../healthServices', () => ({
	checkPostgresHealth: vi.fn(),
	checkDynamoDBHealth: vi.fn(),
}));

// Import after mocking
import { createHandler } from '../createHandler.js';

const mockHealthyStatus = {
	status: 'healthy',
	timestamp: new Date().toISOString(),
};
const mockUnhealthyStatus = {
	status: 'unhealthy',
	timestamp: new Date().toISOString(),
};

const requestContextNonAdmin = {
	requestContext: {
		authorizer: {
			claims: {
				sub: 'driver_id',
				'custom:role': 'driver',
			},
		},
	},
};
const requestContextAdmin = {
	requestContext: {
		authorizer: {
			claims: {
				sub: 'admin-id',
				'custom:role': 'admin',
			},
		},
	},
};

const getResult = (statusCode: number, body?: Record<string, unknown>) => ({
	statusCode,
	headers: getCorsHeaders(),
	body: body ? JSON.stringify(body) : undefined,
});

describe('createHandler', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should return a successful handler result', async () => {
		(
			checkPostgresHealth as vi.MockedFunction<typeof checkPostgresHealth>
		).mockResolvedValue(mockHealthyStatus);

		const result = await postgresHealth(requestContextAdmin, {} as Context);
		expect(result).toEqual(getResult(200, mockHealthyStatus));
	});

	it('should get an unhealthy postgres result successfully', async () => {
		(
			checkPostgresHealth as vi.MockedFunction<typeof checkPostgresHealth>
		).mockResolvedValue(mockUnhealthyStatus);

		const result = await postgresHealth(requestContextAdmin, {} as Context);
		expect(result).toEqual(getResult(200, mockUnhealthyStatus));
	});

	it('should get 403 health unauthorized when not admin', async () => {
		const errors: unknown[] = [];
		vi.spyOn(console, 'warn').mockImplementation((...args) => {
			errors.push(args);
		});
		(
			checkPostgresHealth as vi.MockedFunction<typeof checkPostgresHealth>
		).mockResolvedValue(mockUnhealthyStatus);

		const result = await postgresHealth(requestContextNonAdmin, {
			awsRequestId: 'request123',
		} as Context);
		expect(result).toEqual(
			getResult(403, {
				code: 'Forbidden',
				message: 'User does not have required role',
			}),
		);
		expect(errors[0]).toEqual([
			'Unauthorized access attempt',
			{
				requestId: 'request123',
				role: 'driver',
			},
		]);
	});

	it('should get 500 for postgres health internal server error', async () => {
		const errors: unknown[] = [];
		vi.spyOn(console, 'error').mockImplementation((...args) => {
			errors.push(args);
		});
		(
			checkPostgresHealth as vi.MockedFunction<typeof checkPostgresHealth>
		).mockRejectedValue(new Error('Database error'));

		const result = await postgresHealth(requestContextAdmin, {
			awsRequestId: 'request123',
		} as Context);
		expect(result).toEqual(
			getResult(500, {
				code: 'InternalServerError',
				message: 'An unexpected error occurred',
			}),
		);
		expect(errors[0]).toEqual([
			'Handler execution failed',
			{
				requestId: 'request123',
				error: 'Database error',
			},
		]);
	});

	it('should get a healthy dynamodb result successfully', async () => {
		(
			checkDynamoDBHealth as vi.MockedFunction<typeof checkDynamoDBHealth>
		).mockResolvedValue(mockHealthyStatus);

		const result = await dynamoDBHealth(requestContextAdmin, {} as Context);
		expect(result).toEqual(getResult(200, mockHealthyStatus));
	});

	it('should get an unhealthy dynamodb result successfully', async () => {
		(
			checkDynamoDBHealth as vi.MockedFunction<typeof checkDynamoDBHealth>
		).mockResolvedValue(mockUnhealthyStatus);

		const result = await dynamoDBHealth(requestContextAdmin, {} as Context);
		expect(result).toEqual(getResult(200, mockUnhealthyStatus));
	});

	it('should get 403 for dynamodb health unauthorized', async () => {
		const errors: unknown[] = [];
		vi.spyOn(console, 'warn').mockImplementation((...args) => {
			errors.push(args);
		});
		const event: DeepPartial<APIGatewayProxyEvent> = {
			requestContext: requestContextNonAdmin,
		};

		const result = await dynamoDBHealth(requestContextNonAdmin, {
			awsRequestId: 'request123',
		} as Context);
		expect(result).toEqual(
			getResult(403, {
				code: 'Forbidden',
				message: 'User does not have required role',
			}),
		);
		expect(errors[0]).toEqual([
			'Unauthorized access attempt',
			{
				requestId: 'request123',
				role: 'driver',
			},
		]);
	});

	it('should get 500 for dynamodb health internal server error', async () => {
		const errors: unknown[] = [];
		vi.spyOn(console, 'error').mockImplementation((...args) => {
			errors.push(args);
		});
		(
			checkDynamoDBHealth as vi.MockedFunction<typeof checkDynamoDBHealth>
		).mockRejectedValue(new Error('Database error'));

		const result = await dynamoDBHealth(requestContextAdmin, {
			awsRequestId: 'request123',
		} as Context);

		expect(result).toEqual(
			getResult(500, {
				code: 'InternalServerError',
				message: 'An unexpected error occurred',
			}),
		);
		expect(errors[0]).toEqual([
			'Handler execution failed',
			{
				requestId: 'request123',
				error: 'Database error',
			},
		]);
	});
});
