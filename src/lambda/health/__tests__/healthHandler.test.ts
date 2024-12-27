import {
	vi,
	describe,
	it,
	expect,
	beforeEach,
	afterEach,
} from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

import {
	requestContextAdmin,
	requestContextDriver,
	requestContextUser,
	mockLambdaContext,
	getResult
} from '@/utils/testUtils.js';
import type { DeepPartial } from '@/utils/DeepPartial.js';

// Mock the entire healthServices module
vi.mock('../healthServices', () => ({
	checkPostgresHealth: vi.fn(),
	checkDynamoDBHealth: vi.fn(),
}));

// Import after mocking
import { handler as postgresHealth } from '../postgresHealth.js';
import { handler as dynamoDBHealth } from '../dynamodbHealth.js';
import { checkPostgresHealth, checkDynamoDBHealth } from '../healthServices.js';

const mockHealthyStatus = {
	status: 'healthy',
	timestamp: new Date().toISOString(),
};

describe('health check lambdas', () => {
	// Swallow the console warnings so they don't pollute test output
	beforeEach(() => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('postgres should get a healthy result successfully', async () => {
		(
			checkPostgresHealth as vi.MockedFunction<typeof checkPostgresHealth>
		).mockResolvedValue(mockHealthyStatus);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			requestContext: requestContextAdmin,
		};

		const result = await postgresHealth(event, mockLambdaContext as Context);
		expect(result).toEqual(getResult(200, mockHealthyStatus));
	});

	it('postgres should get 403 health unauthorized when driver', async () => {
		const event: DeepPartial<APIGatewayProxyEvent> = {
			requestContext: requestContextDriver,
		};

		const result = await postgresHealth(event, mockLambdaContext as Context);
		expect(result.statusCode).toEqual(403);
	});

	it('postgres should get 403 health unauthorized when user', async () => {
		const event: DeepPartial<APIGatewayProxyEvent> = {
			requestContext: requestContextUser,
		};

		const result = await postgresHealth(event, mockLambdaContext as Context);
		expect(result.statusCode).toEqual(403);
	});

	it('dynamodb should get a healthy result successfully', async () => {
		(
			checkDynamoDBHealth as vi.MockedFunction<typeof checkDynamoDBHealth>
		).mockResolvedValue(mockHealthyStatus);

		const event: DeepPartial<APIGatewayProxyEvent> = {
			requestContext: requestContextAdmin,
		};
		const result = await dynamoDBHealth(event, {} as Context);
		expect(result).toEqual(getResult(200, mockHealthyStatus));
	});

	it('dynamodb should get 403 health unauthorized for driver', async () => {
		const event: DeepPartial<APIGatewayProxyEvent> = {
			requestContext: requestContextDriver,
		};
		const result = await dynamoDBHealth(event, {} as Context);
		expect(result.statusCode).toEqual(403);
	});

	it('dynamodb should get 403 health unauthorized for user', async () => {
		const event: DeepPartial<APIGatewayProxyEvent> = {
			requestContext: requestContextUser,
		};
		const result = await dynamoDBHealth(event, {} as Context);
		expect(result.statusCode).toEqual(403);
	});
});
