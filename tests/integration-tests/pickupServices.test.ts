import { config } from 'dotenv';
import {
	describe,
	it,
	expect,
	beforeAll,
	afterAll,
	afterEach,
	vi,
} from 'vitest';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	DynamoDBDocumentClient,
	DeleteCommand,
	ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { PickupService } from '@/lambda/pickups/pickupServices';

// Load environment variables from .env.test
config({ path: '.env.test' });

const dynamoConfig = {
	region: process.env.DYNAMODB_REGION,
	endpoint: process.env.DYNAMODB_ENDPOINT,
	credentials: {
		accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.DYNAMODB_SECRET_ACCESS_KEY || '',
	},
};
const pickupService = new PickupService('Pickups', dynamoConfig);

describe('Pickup Service Integration Tests', () => {
	let dynamoDB: DynamoDBDocumentClient;

	beforeAll(async () => {
		const client = new DynamoDBClient(dynamoConfig);
		dynamoDB = DynamoDBDocumentClient.from(client);
	});

	afterEach(async () => {
		try {
			const scanParams = {
				TableName: 'Pickups',
			};
			const scanResult = await dynamoDB.send(new ScanCommand(scanParams));
			const deletePromises = scanResult.Items?.map((item) =>
				dynamoDB.send(
					new DeleteCommand({
						TableName: 'Pickups',
						Key: { id: item.id },
					}),
				),
			);
			if (deletePromises) {
				await Promise.all(deletePromises);
			}
			console.log('aftereach complete!');
		} catch (error) {
			console.error('Error in afterEach:', error);
			throw error; // Re-throw the error so Vitest knows the hook failed
		}
	});

	afterAll(() => {
		dynamoDB.destroy();
	});

	it('should create and get a new pickup', async () => {
		const userId = 'testUser123';
		const newPickup = {
			location: '123 Test St, Test City',
			estimatedWeight: 50,
			wasteType: 'recyclable',
			requestedTime: '2023-04-01T10:00:00Z',
		};

		const createdPickup = await pickupService.createPickup(userId, newPickup);

		expect(createdPickup).toBeDefined();
		expect(createdPickup.id).toBeDefined();
		expect(createdPickup.userId).toBe(userId);
		expect(createdPickup.status).toBe('pending');
		expect(createdPickup.location).toBe(newPickup.location);
		expect(createdPickup.estimatedWeight).toBe(newPickup.estimatedWeight);
		expect(createdPickup.wasteType).toBe(newPickup.wasteType);
		expect(createdPickup.requestedTime).toBe(newPickup.requestedTime);

		// Verify the pickup was actually created in the database
		const retrievedPickup = await pickupService.getPickup(createdPickup.id);
		expect(retrievedPickup).toEqual(createdPickup);
	});

	it('should throw on get nonexistant pickup', async () => {
		const userId = 'testUser123';
		const newPickup = {
			location: '123 Test St, Test City',
			estimatedWeight: 50,
			wasteType: 'recyclable',
			requestedTime: '2023-04-01T10:00:00Z',
		};

		await pickupService.createPickup(userId, newPickup);
		await expect(pickupService.getPickup('nonExistentId')).rejects.toThrow(
			'Failed to retrieve pickup',
		);
	});

	it('should update a pickup', async () => {
		const userId = 'testUser123';
		const newPickup = {
			location: '123 Test St, Test City',
			estimatedWeight: 50,
			wasteType: 'recyclable',
			requestedTime: '2023-04-01T10:00:00Z',
		};

		const createdPickup = await pickupService.createPickup(userId, newPickup);
		const updateData = {
			estimatedWeight: 250,
		};
		const updatedPickup = await pickupService.updatePickup(
			createdPickup.id,
			updateData,
		);
		expect(updatedPickup).toEqual({ ...createdPickup, ...updateData });
	});

	it('should hard delete a pickup', async () => {
		const userId = 'testUser123';
		const newPickup = {
			location: '123 Test St, Test City',
			estimatedWeight: 50,
			wasteType: 'recyclable',
			requestedTime: '2023-04-01T10:00:00Z',
		};

		const createdPickup = await pickupService.createPickup(userId, newPickup);
		const deletedPickup = await pickupService.deletePickup(
			createdPickup.id,
			true,
		);
		expect(deletedPickup).toEqual(createdPickup);

		// Perform a get operation to verify the status in the database
		await expect(pickupService.getPickup(createdPickup.id)).rejects.toThrow(
			'Failed to retrieve pickup',
		);
	});

	it('should soft delete a pickup', async () => {
		const userId = 'testUser123';
		const newPickup = {
			location: '123 Test St, Test City',
			estimatedWeight: 50,
			wasteType: 'recyclable',
			requestedTime: '2023-04-01T10:00:00Z',
		};

		const createdPickup = await pickupService.createPickup(userId, newPickup);
		const deletedPickup = await pickupService.deletePickup(createdPickup.id);
		expect(deletedPickup.id).toEqual(createdPickup.id);
		expect(deletedPickup.status).toEqual('deleted');
		expect(deletedPickup).toHaveProperty('deletedAt');
		expect(new Date(deletedPickup.deletedAt).toISOString()).toEqual(
			deletedPickup.deletedAt,
		);

		// Perform a get operation to verify the status in the database
		const retrievedPickup = await pickupService.getPickup(createdPickup.id);
		expect(deletedPickup).toEqual(retrievedPickup);
	});

	it('should get pickups', async () => {
		const userId = 'testUser123';
		const pickup = {
			location: '123 Test St, Test City',
			estimatedWeight: 50,
			wasteType: 'recyclable',
			requestedTime: '2023-04-01T10:00:00Z',
		};
		const p1 = await pickupService.createPickup(userId, pickup);
		const p2 = await pickupService.createPickup(userId, {
			...pickup,
			estimatedWeight: 60,
			requestedTime: '2024-04-01T10:00:00Z',
		});
		const p3 = await pickupService.createPickup(userId, {
			...pickup,
			estimatedWeight: 70,
			requestedTime: '2024-05-01T10:00:00Z',
		});
		const p4 = await pickupService.createPickup(userId, {
			...pickup,
			estimatedWeight: 80,
			requestedTime: '2024-06-01T10:00:00Z',
		});
		const pickups = await pickupService.getPickups('pending');
		const srt = (a, b) => a.id.localeCompare(b.id);
		expect(pickups.pickups.sort(srt)).toEqual([p1, p2, p3, p4].sort(srt));
	});

	it('should get pickups in the specified time range', async () => {
		const userId = 'testUser123';
		const pickup = {
			location: '123 Test St, Test City',
			estimatedWeight: 50,
			wasteType: 'recyclable',
			requestedTime: '2023-04-01T10:00:00Z',
		};
		const p1 = await pickupService.createPickup(userId, pickup);
		const p2 = await pickupService.createPickup(userId, pickup);
		const p3 = await pickupService.createPickup(userId, pickup);
		const p4 = await pickupService.createPickup(userId, {
			...pickup,
			requestedTime: '2024-04-01T10:00:00Z',
		});
		const pickups = await pickupService.getPickups(
			'pending',
			undefined,
			undefined,
			'2024-03-01T10:00:00Z',
			'2024-04-10T10:00:00Z',
		);
		expect(pickups.pickups[0]).toEqual(p4);
	});

	it('should get pickups with a cursor', async () => {
		const userId = 'testUser123';
		const pickup = {
			location: '123 Test St, Test City',
			estimatedWeight: 50,
			wasteType: 'recyclable',
			requestedTime: '2023-04-01T10:00:00Z',
		};
		const p1 = await pickupService.createPickup(userId, pickup);
		const p2 = await pickupService.createPickup(userId, {
			...pickup,
			estimatedWeight: 60,
			requestedTime: '2024-04-01T10:00:00Z',
		});
		const p3 = await pickupService.createPickup(userId, {
			...pickup,
			estimatedWeight: 70,
			requestedTime: '2024-05-01T10:00:00Z',
		});
		const p4 = await pickupService.createPickup(userId, {
			...pickup,
			estimatedWeight: 80,
			requestedTime: '2024-06-01T10:00:00Z',
		});
		const pickups = await pickupService.getPickups(
			'pending',
			2,
			undefined,
			undefined,
			undefined,
			true,
		);
		expect(pickups.pickups).toEqual([p4, p3]);
		console.log(pickups);
		const pickups2 = await pickupService.getPickups(
			'pending',
			2,
			pickups.nextCursor,
			undefined,
			undefined,
			true,
		);
		console.log(pickups2);
		expect(pickups2.pickups).toEqual([p2, p1]);
	});

	it('should get available pickups', async () => {
		const userId = 'testUser123';
		const pickup = {
			location: '123 Test St, Test City',
			estimatedWeight: 50,
			wasteType: 'recyclable',
			requestedTime: '2023-04-01T10:00:00Z',
		};
		const p1 = await pickupService.createPickup(userId, pickup);
		const p2 = await pickupService.createPickup(userId, pickup);
		const p3 = await pickupService.createPickup(userId, pickup);
		const p4 = await pickupService.createPickup(userId, pickup);
		const update = {
			status: 'available',
		};
		const p2a = await pickupService.updatePickup(p2.id, update);
		const p4a = await pickupService.updatePickup(p4.id, update);

		const avail = await pickupService.availablePickups();
		const srt = (a, b) => a.id.localeCompare(b.id);
		expect(avail.sort(srt)).toEqual([p2a, p4a].sort(srt));
	});

	it('should accept a pickup', async () => {
		const userId = 'testUser123';
		const pickup = {
			location: '123 Test St, Test City',
			estimatedWeight: 50,
			wasteType: 'recyclable',
			requestedTime: '2023-04-01T10:00:00Z',
		};
		const p1 = await pickupService.createPickup(userId, pickup);
		const p2 = await pickupService.createPickup(userId, pickup);
		const p3 = await pickupService.createPickup(userId, pickup);
		const p4 = await pickupService.createPickup(userId, pickup);
		const update = {
			status: 'available',
		};
		const p2a = await pickupService.updatePickup(p2.id, update);
		const p4a = await pickupService.updatePickup(p4.id, update);

		const accepted = await pickupService.acceptPickup(p2.id, 'driver123');
		expect(accepted).toEqual({
			...p2,
			driverId: 'driver123',
			status: 'accepted',
		});
	});

	it('should fail to accept a pickup that doesnt exist', async () => {
		await expect(
			pickupService.acceptPickup('fakeid', 'driver123'),
		).rejects.toThrow('Pickup not found');
	});
});
