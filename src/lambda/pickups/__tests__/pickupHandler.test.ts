import { vi, describe, it, expect, beforeEach, expectTypeOf } from 'vitest';
import type {
	APIGatewayProxyEvent,
	APIGatewayProxyResult,
	Callback,
	Context,
} from 'aws-lambda';
import type { DeepPartial } from '@/utils/DeepPartial.js';
import {
	requestContextAdmin,
	requestContextDriver,
	requestContextUser,
	mockLambdaContext,
	getResult,
} from '@/utils/testUtils.js';

// Mock the entire pickupServices module
vi.mock('../pickupServices', () => ({
	acceptPickupService: vi.fn(),
	availablePickupsService: vi.fn(),
	createPickupService: vi.fn(),
	getPickupService: vi.fn(),
	getPickupsService: vi.fn(),
	updatePickupService: vi.fn(),
	deletePickupService: vi.fn(),
}));
import {
	acceptPickupService,
	availablePickupsService,
	createPickupService,
	getPickupService,
	getPickupsService,
	updatePickupService,
	deletePickupService,
} from '../pickupServices.js';

// Import after mocking
import { handler as createPickup } from '../createPickup.js';
import { handler as getPickup } from '../getPickup.js';
import { handler as getPickups } from '../getPickups.js';
import { handler as updatePickup } from '../updatePickup.js';
import { handler as deletePickup } from '../deletePickup.js';
import { handler as availablePickups } from '../availablePickups.js';
import { handler as acceptPickup } from '../acceptPickup.js';
import { handler as cancelAcceptedPickup } from '../cancelAcceptedPickup.js';

const driverId = requestContextDriver.authorizer.claims.sub;
const userId = requestContextUser.authorizer.claims.sub;
const adminId = requestContextAdmin.authorizer.claims.sub;
const pickupId = 'pickup-id';
const mockPickup = {
	id: pickupId,
	userId,
	location: '11382 High St. Northglenn, CO 80233',
	estimatedWeight: 150,
	requestedTime: new Date(Date.now() + 60000).toISOString(),
	wasteType: 'green',
	createdAt: '2024-09-22T12:00:00Z',
	updatedAt: '2024-09-22T12:00:00Z',
};
const mockAcceptedPickup = {
	...mockPickup,
	driverId,
	status: 'accepted',
};

describe('pickup lambdas', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should create a pickup successfully', async () => {
		// Mock createPickupService
		(
			createPickupService as vi.MockedFunction<typeof createPickupService>
		).mockResolvedValue(mockPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			body: JSON.stringify(mockPickup),
			requestContext: requestContextUser,
		};
		const result = await createPickup(event, mockLambdaContext);

		expect(result).toEqual(getResult(201, mockPickup));
		expect(createPickupService).toHaveBeenCalledWith(
			expect.anything(),
			userId,
			mockPickup,
		);
	});

	it('should return 400 for invalid create pickup input', async () => {
		const mockInvalidPickup = {
			location: '11382 High St. Northglenn, CO 80233',
		};
		const event: DeepPartial<APIGatewayProxyEvent> = {
			body: JSON.stringify(mockInvalidPickup),
			requestContext: requestContextUser,
		};
		const result = await createPickup(event, mockLambdaContext);

		expect(result?.statusCode).toBe(400);
	});

	it('should create a pickup successfully as admin', async () => {
		// Mock createPickupService
		(
			createPickupService as vi.MockedFunction<typeof createPickupService>
		).mockResolvedValue(mockPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			body: JSON.stringify(mockPickup),
			requestContext: requestContextAdmin,
		};

		const result = await createPickup(event, mockLambdaContext);
		expect(result).toEqual(getResult(201, mockPickup));
	});

	it('should get a pickup successfully as admin', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextAdmin,
		};
		const result = await getPickup(event, mockLambdaContext);

		expect(result).toEqual(getResult(200, mockPickup));
		expect(getPickupService).toHaveBeenCalledWith(expect.anything(), '123');
	});

	it('should get a pickup successfully', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextUser,
		};
		const result = await getPickup(event, mockLambdaContext);

		expect(result).toEqual(getResult(200, mockPickup));
		expect(getPickupService).toHaveBeenCalledWith(expect.anything(), '123');
	});

	it('should get a deleted pickup successfully as admin', async () => {
		const mockDeletedPickup = { ...mockPickup, status: 'deleted' };
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockDeletedPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextAdmin,
		};
		const result = await getPickup(event, mockLambdaContext);

		expect(result).toEqual(getResult(200, mockDeletedPickup));
		expect(getPickupService).toHaveBeenCalledWith(expect.anything(), '123');
	});

	it('should get a pickup successfully as driver when assigned', async () => {
		const mockAcceptedPickup = { ...mockPickup, status: 'accepted', driverId };
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockAcceptedPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextDriver,
		};
		const result = await getPickup(event, mockLambdaContext);

		expect(result).toEqual(getResult(200, mockAcceptedPickup));
		expect(getPickupService).toHaveBeenCalledWith(expect.anything(), '123');
	});

	it('should get a pickup successfully as driver when available', async () => {
		const mockAvailablePickup = { ...mockPickup, status: 'available' };
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockAvailablePickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextDriver,
		};
		const result = await getPickup(event, mockLambdaContext);

		expect(result).toEqual(getResult(200, mockAvailablePickup));
		expect(getPickupService).toHaveBeenCalledWith(expect.anything(), '123');
	});

	it('should fail to get a pickup successfully as driver when not available or assigned', async () => {
		const mockAvailablePickup = {
			...mockPickup,
			status: 'in_progress',
			driverId: 'driver-123',
		};
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockAvailablePickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextDriver,
		};
		const result = await getPickup(event, mockLambdaContext);

		expect(result?.statusCode).toBe(403);
	});

	it('should fail to get a pickup successfully as driver when deleted', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ ...mockPickup, status: 'deleted', driverId });
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123', includeDeleted: true },
			requestContext: requestContextDriver,
		};
		const result = await getPickup(event, mockLambdaContext);

		expect(result?.statusCode).toBe(404);
	});

	it('should fail to get a pickup successfully as user when deleted', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ ...mockPickup, status: 'deleted', userId });
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123', includeDeleted: true },
			requestContext: requestContextUser,
		};
		const result = await getPickup(event, mockLambdaContext);

		expect(result?.statusCode).toBe(404);
	});

	it('should fail to get a pickup successfully as user when wrong id', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({
			...mockPickup,
			userId: 'user-123',
		});
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextUser,
		};
		const result = await getPickup(event, mockLambdaContext);

		expect(result?.statusCode).toBe(403);
	});

	it('should return 404 for get non-existent pickup', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(null);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: 'nonexistent' },
			requestContext: requestContextAdmin,
		};
		const result = await getPickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(404, {
				code: 'NotFound',
				message: 'Pickup not found',
			}),
		);
	});

	it('should return 400 for get pickup missing pickupId', async () => {
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: {},
			requestContext: requestContextAdmin,
		};
		const result = await getPickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(400, {
				code: 'BadRequest',
				message: 'Invalid path parameter: pickupId - Required',
			}),
		);
	});

	it('should get pickups successfully when admin', async () => {
		const mockPickups = [mockPickup, { ...mockPickup, id: 234 }];
		(
			getPickupsService as vi.MockedFunction<typeof getPickupsService>
		).mockResolvedValue({
			pickups: mockPickups,
			nextCursor: 'def345',
		});
		const event: DeepPartial<APIGatewayProxyEvent> = {
			queryStringParameters: {
				status: 'pending',
				limit: 22,
				cursor: 'abc123',
			},
			requestContext: requestContextAdmin,
		};
		const result = await getPickups(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(200, { pickups: mockPickups, nextCursor: 'def345' }),
		);
		expect(getPickupsService).toHaveBeenCalledWith(
			expect.anything(),
			'pending',
			22,
			'abc123',
			undefined,
			undefined,
		);
	});

	it('should fail to get pickups when not admin', async () => {
		const event: DeepPartial<APIGatewayProxyEvent> = {
			queryStringParameters: {
				status: ['pending', 'assigned'],
				limit: 22,
				cursor: 'abc123',
			},
			requestContext: requestContextUser,
		};
		const result = await getPickups(event, mockLambdaContext);

		expect(result?.statusCode).toBe(403);
	});

	it('should update a pickup successfully', async () => {
		const mockUpdatedPickup = {
			...mockPickup,
			estimatedWeight: 200,
		};
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockPickup);
		(
			updatePickupService as vi.MockedFunction<typeof updatePickupService>
		).mockResolvedValue(mockUpdatedPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextUser,
			body: JSON.stringify({ estimatedWeight: 200 }),
		};
		const result = await updatePickup(event, mockLambdaContext);
		expect(result).toEqual(getResult(200, mockUpdatedPickup));
		expect(updatePickupService).toHaveBeenCalledWith(expect.anything(), '123', {
			estimatedWeight: 200,
		});
	});

	it('should return 400 for invalid update pickup input', async () => {
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextUser,
			body: JSON.stringify({ estimatedWeight: -100 }),
		};
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockPickup);
		const result = await updatePickup(event, mockLambdaContext);

		expect(result?.statusCode).toBe(400);
	});

	it('should return 400 for invalid update pickup input with unallowed fields', async () => {
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextUser,
			body: JSON.stringify({ userdId: 234 }),
		};
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockPickup);
		const result = await updatePickup(event, mockLambdaContext);

		expect(result?.statusCode).toBe(400);
	});

	it('should return 400 for update pickup missing pickupid', async () => {
		const event: DeepPartial<APIGatewayProxyEvent> = {
			requestContext: requestContextUser,
			body: JSON.stringify({ estimatedWeight: -100 }),
		};
		const result = await updatePickup(event, mockLambdaContext);

		expect(result?.statusCode).toBe(400);
	});

	it('should return 404 for update pickup non-existent pickup', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(null);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: 'invalid' },
			requestContext: requestContextUser,
			body: JSON.stringify({ estimatedWeight: 400 }),
		};
		const result = await updatePickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(404, {
				code: 'NotFound',
				message: 'Pickup not found',
			}),
		);
	});

	it('should return 404 for update pickup with deleted pickup', async () => {
		// Update calls get pickup
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(null);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextUser,
			body: JSON.stringify({ estimatedWeight: 400 }),
		};
		const result = await updatePickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(404, {
				code: 'NotFound',
				message: 'Pickup not found',
			}),
		);
	});

	it('should return 204 for valid delete pickup', async () => {
		const mockDeletedPickup = { ...mockPickup, status: 'deleted' };
		const mockAcceptedPickup = { ...mockPickup, status: 'accepted' };
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockAcceptedPickup);
		(
			deletePickupService as vi.MockedFunction<typeof deletePickupService>
		).mockResolvedValue(mockDeletedPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextUser,
		};
		const result = await deletePickup(event, mockLambdaContext);

		expect(result).toEqual(getResult(204));
		expect(deletePickupService).toHaveBeenCalledWith(
			expect.anything(),
			pickupId,
		);
	});

	it('should return 204 for valid delete pickup when admin', async () => {
		const mockDeletedPickup = { ...mockPickup, status: 'deleted' };
		const mockAcceptedPickup = { ...mockPickup, status: 'accepted' };
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockAcceptedPickup);
		(
			deletePickupService as vi.MockedFunction<typeof deletePickupService>
		).mockResolvedValue(mockDeletedPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextAdmin,
		};
		const result = await deletePickup(event, mockLambdaContext);

		expect(result).toEqual(getResult(204));
		expect(deletePickupService).toHaveBeenCalledWith(
			expect.anything(),
			pickupId,
		);
	});

	it('should return 400 for delete pickup missing pickup id', async () => {
		const event: DeepPartial<APIGatewayProxyEvent> = {
			requestContext: requestContextUser,
		};
		const result = await deletePickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(400, {
				code: 'BadRequest',
				message: 'Invalid path parameter: pickupId - Required',
			}),
		);
	});

	it('should return 404 for delete pickup non-existent pickup', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(null);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: 'nonexistent' },
			requestContext: requestContextUser,
		};
		const result = await deletePickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(404, { code: 'NotFound', message: 'Pickup not found' }),
		);
	});

	it('should return 404 for delete pickup deleted pickup', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ ...mockPickup, status: 'deleted' });
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: 'nonexistent' },
			requestContext: requestContextUser,
		};
		const result = await deletePickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(404, { code: 'NotFound', message: 'Pickup not found' }),
		);
	});

	it('should return 403 for delete pickup with driver role', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextDriver,
		};
		const result = await deletePickup(event, mockLambdaContext);

		expect(result?.statusCode).toBe(403);
	});

	it('should return 403 for delete pickup with improper pickup status', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ ...mockPickup, status: 'pending' });
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextUser,
		};
		const result = await deletePickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(403, {
				code: 'Forbidden',
				message: 'Cannot delete pickup with status pending',
			}),
		);

		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ ...mockPickup, status: 'in_progress' });
		const result2 = await deletePickup(event, mockLambdaContext);

		expect(result2).toEqual(
			getResult(403, {
				code: 'Forbidden',
				message: 'Cannot delete pickup with status in_progress',
			}),
		);

		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ ...mockPickup, status: 'completed' });
		const result3 = await deletePickup(event, mockLambdaContext);

		expect(result3).toEqual(
			getResult(403, {
				code: 'Forbidden',
				message: 'Cannot delete pickup with status completed',
			}),
		);
	});

	it('should return 200 for a valid accept pickup', async () => {
		const mockAcceptedPickup = { ...mockPickup, status: 'accepted', driverId };
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ ...mockPickup, status: 'available' });
		(
			acceptPickupService as vi.MockedFunction<typeof acceptPickupService>
		).mockResolvedValue(mockAcceptedPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextDriver,
		};
		const result = await acceptPickup(event, mockLambdaContext);

		expect(result).toEqual(getResult(200, mockAcceptedPickup));
		expect(acceptPickupService).toHaveBeenCalledWith(
			expect.anything(),
			'123',
			driverId,
		);
	});

	it('should return 200 for admin accept pickup', async () => {
		const mockAcceptedPickup = { ...mockPickup, status: 'accepted', adminId };
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ ...mockPickup, status: 'available' });
		(
			acceptPickupService as vi.MockedFunction<typeof acceptPickupService>
		).mockResolvedValue(mockAcceptedPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextAdmin,
		};
		const result = await acceptPickup(event, mockLambdaContext);

		expect(result).toEqual(getResult(200, mockAcceptedPickup));
		expect(acceptPickupService).toHaveBeenCalledWith(
			expect.anything(),
			'123',
			adminId,
		);
	});

	it('should return 400 for acceptPickup with an invalid pickupId', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ ...mockPickup, status: 'available' });
		const event: DeepPartial<APIGatewayProxyEvent> = {
			requestContext: requestContextDriver,
		};
		const result = await acceptPickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(400, {
				code: 'BadRequest',
				message: 'Invalid path parameter: pickupId - Required',
			}),
		);
	});

	it('should return 403 for an invalid role for accept pickup', async () => {
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextUser,
		};
		const result = await acceptPickup(event, mockLambdaContext);

		expect(result?.statusCode).toBe(403);
	});

	it('should return 404 for pickup not found for accept pickup', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(null);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextDriver,
		};
		const result = await acceptPickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(404, { code: 'NotFound', message: 'Pickup not found' }),
		);
	});

	it('should return 404 for deleted pickup for accept pickup', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ ...mockPickup, status: 'deleted' });
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextDriver,
		};
		const result = await acceptPickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(404, { code: 'NotFound', message: 'Pickup not found' }),
		);
	});

	it('should return 409 for a pickup not in available state for accept pickup', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ ...mockPickup, status: 'cancelled' });
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextDriver,
		};
		const result = await acceptPickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(409, { code: 'Conflict', message: 'Pickup not available' }),
		);
	});

	it('should return 200 for a valid admin  get available pickups', async () => {
		const pickups = [
			mockPickup,
			{ ...mockPickup, pickupId: 234 },
			{ ...mockPickup, pickupId: 456 },
		];
		(
			availablePickupsService as vi.MockedFunction<
				typeof availablePickupsService
			>
		).mockResolvedValue(pickups);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			requestContext: requestContextAdmin,
		};
		const result = await availablePickups(event, mockLambdaContext);

		expect(result).toEqual(getResult(200, pickups));
	});

	it('should return 200 for a valid get available pickups', async () => {
		const pickups = [
			mockPickup,
			{ ...mockPickup, pickupId: 234 },
			{ ...mockPickup, pickupId: 456 },
		];
		(
			availablePickupsService as vi.MockedFunction<
				typeof availablePickupsService
			>
		).mockResolvedValue(pickups);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			requestContext: requestContextDriver,
		};
		const result = await availablePickups(event, mockLambdaContext);

		expect(result).toEqual(getResult(200, pickups));
	});

	it('should return 403 for a user get available pickups', async () => {
		const event: DeepPartial<APIGatewayProxyEvent> = {
			requestContext: requestContextUser,
		};
		const result = await availablePickups(event, mockLambdaContext);

		expect(result?.statusCode).toBe(403);
	});

	it('should return 200 for a valid cancel accept pickup', async () => {
		const mockCancelledPickup = { ...mockPickup, status: 'cancelled' };
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockAcceptedPickup);
		(
			updatePickupService as vi.MockedFunction<typeof updatePickupService>
		).mockResolvedValue(mockCancelledPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextDriver,
		};
		const result = await cancelAcceptedPickup(event, mockLambdaContext);
		expect(result).toEqual(getResult(200, mockCancelledPickup));
	});

	it('should return 200 for admin cancel pickup', async () => {
		const mockCancelledPickup = { ...mockPickup, status: 'cancelled' };
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockAcceptedPickup);
		(
			updatePickupService as vi.MockedFunction<typeof updatePickupService>
		).mockResolvedValue(mockCancelledPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextAdmin,
		};
		const result = await cancelAcceptedPickup(event, mockLambdaContext);
		expect(result).toEqual(getResult(200, mockCancelledPickup));
	});

	it('should return 200 for user cancel pickup', async () => {
		const mockCancelledPickup = { ...mockPickup, status: 'cancelled' };
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(mockAcceptedPickup);
		(
			updatePickupService as vi.MockedFunction<typeof updatePickupService>
		).mockResolvedValue(mockCancelledPickup);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextUser,
		};
		const result = await cancelAcceptedPickup(event, mockLambdaContext);
		expect(result).toEqual(getResult(200, mockCancelledPickup));
	});

	it('should return 400 for cancelAcceptedPickup without pickupId', async () => {
		const event: DeepPartial<APIGatewayProxyEvent> = {
			requestContext: requestContextDriver,
		};
		const result = await cancelAcceptedPickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(400, {
				code: 'BadRequest',
				message: 'Invalid path parameter: pickupId - Required',
			}),
		);
	});

	it('should return 403 for an invalid user for cancel accepted pickup', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ ...mockAcceptedPickup, userId: 'abc123' });
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextUser,
		};
		const result = await cancelAcceptedPickup(event, mockLambdaContext);

		expect(result?.statusCode).toBe(403);
	});

	it('should return 403 for an invalid driver for cancel accepted pickup', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ ...mockAcceptedPickup, driverId: 'abc123' });
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextDriver,
		};
		const result = await cancelAcceptedPickup(event, mockLambdaContext);

		expect(result?.statusCode).toBe(403);
	});

	it('should return 404 for pickup not found for cancel accepted pickup', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue(null);
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextDriver,
		};
		const result = await cancelAcceptedPickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(404, { code: 'NotFound', message: 'Pickup not found' }),
		);
	});

	it('should return 404 for deleted pickup for cancel accepted pickup', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ mockPickup, status: 'deleted' });
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextDriver,
		};
		const result = await cancelAcceptedPickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(404, { code: 'NotFound', message: 'Pickup not found' }),
		);
	});

	it('should return 409 for a invalid pickup state cancel accept pickup', async () => {
		(
			getPickupService as vi.MockedFunction<typeof getPickupService>
		).mockResolvedValue({ ...mockAcceptedPickup, status: 'pending' });
		const event: DeepPartial<APIGatewayProxyEvent> = {
			pathParameters: { pickupId: '123' },
			requestContext: requestContextDriver,
		};
		const result = await cancelAcceptedPickup(event, mockLambdaContext);

		expect(result).toEqual(
			getResult(409, {
				code: 'Conflict',
				message: "Pickup can't be cancelled, current status is: pending",
			}),
		);
	});
});
