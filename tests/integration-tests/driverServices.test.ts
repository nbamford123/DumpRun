import { config } from 'dotenv';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
	createDriverService,
	getDriverService,
	updateDriverService,
	deleteDriverService,
} from '@/lambda/drivers/driverServices';

import type { NewDriver, UpdateDriver } from '@/schemas/apiSchema.d.ts';

// Load environment variables from .env.test
config({ path: '.env.test' });

vi.mock('@aws-sdk/client-cognito-identity-provider');

// Mock cognito
const mockCognito = {
	adminGetUser: vi.fn(),
};
mockCognito.adminGetUser.mockResolvedValue({});

const prisma = new PrismaClient();

const mockCognitoUserId = 'test-cognito-id';
const mockDriverData = {
	name: 'John Doe',
	email: 'john@example.com',
	phone: '303-555-1212',
	address: '11382 High St. Northglenn, CO 80233',
	vehicleMake: 'Ford',
	vehicleModel: 'f150',
	vehicleYear: 1998,
};

beforeAll(async () => {
	// Connect to the test database
	await prisma.$connect();
});

afterAll(async () => {
	// Disconnect from the test database
	await prisma.$disconnect();
});

beforeEach(async () => {
	// Clean up the database before each test
	await prisma.driver.deleteMany();
});

describe('Driver Service Integration Tests', () => {
	it('should create a new Driver', async () => {
		const newDriver: NewDriver = {
			...mockDriverData,
		};

		const createdDriver = await createDriverService(
			mockCognitoUserId,
			newDriver,
		);

		expect(createdDriver.id).toEqual(mockCognitoUserId);
		expect(createdDriver.name).toBe(mockDriverData.name);
		expect(createdDriver.email).toBe(mockDriverData.email);
		expect(createdDriver.phone).toBe(mockDriverData.phone);
		expect(createdDriver.address).toBe(mockDriverData.address);
		expect(createdDriver.vehicleMake).toBe(mockDriverData.vehicleMake);
		expect(createdDriver.vehicleModel).toBe(mockDriverData.vehicleModel);
		expect(createdDriver.vehicleYear).toBe(mockDriverData.vehicleYear);
		expect(createdDriver).toHaveProperty('createdAt');
		expect(createdDriver).toHaveProperty('updatedAt');

		// Verify the user was actually created in the database
		const dbDriver = await prisma.driver.findUnique({
			where: { id: createdDriver.id },
		});
		const dbDriverWithISOStrings = {
			...dbDriver,
			createdAt: dbDriver?.createdAt.toISOString(),
			updatedAt: dbDriver?.updatedAt.toISOString(),
		};
		expect(dbDriverWithISOStrings).toEqual(createdDriver);
	});

	it('should retrieve an existing driver', async () => {
		const newDriver = await prisma.driver.create({
			data: {
				id: mockCognitoUserId,
				...mockDriverData,
			},
		});

		const retrievedDriver = await getDriverService(newDriver.id);
		const newDriverWithISOStrings = {
			...newDriver,
			createdAt: newDriver?.createdAt.toISOString(),
			updatedAt: newDriver?.updatedAt.toISOString(),
		};

		expect(retrievedDriver).toEqual(newDriverWithISOStrings);
	});

	it('should return null for non-existent driver', async () => {
		expect(await getDriverService('non-existent-id')).toBeNull();
	});

	it('should update an existing driver', async () => {
		const newDriver = await prisma.driver.create({
			data: {
				id: mockCognitoUserId,
				...mockDriverData,
			},
		});
		const updateData: UpdateDriver = {
			name: 'Robert Smith',
		};
		const updatedDriver = await updateDriverService(newDriver.id, updateData);

		expect(updatedDriver.name).toBe(updateData.name);
		expect(updatedDriver.email).toBe(newDriver.email);
		expect(new Date(updatedDriver.updatedAt).getTime()).toBeGreaterThan(
			newDriver.updatedAt.getTime(),
		);

		// Verify the user was actually updated in the database
		const dbDriver = await prisma.driver.findUnique({
			where: { id: newDriver.id },
		});
		const dbDriverWithISOStrings = {
			...dbDriver,
			createdAt: dbDriver?.createdAt.toISOString(),
			updatedAt: dbDriver?.updatedAt.toISOString(),
		};
		expect(updatedDriver).toEqual(dbDriverWithISOStrings);
	});

	it('should return null for updating non-existent driver', async () => {
		expect(await updateDriverService('non-existent-id', {})).toBeNull();
	});

	it('should delete an existing driver', async () => {
		const newDriver = await prisma.driver.create({
			data: {
				id: mockCognitoUserId,
				...mockDriverData,
			},
		});

		const newDriverWithISOStrings = {
			...newDriver,
			createdAt: newDriver?.createdAt.toISOString(),
			updatedAt: newDriver?.updatedAt.toISOString(),
		};

		const deletedDriver = await deleteDriverService(newDriver.id);

		expect(deletedDriver).toEqual(newDriverWithISOStrings);

		// Verify the user was actually deleted from the database
		const dbDriver = await prisma.driver.findUnique({
			where: { id: newDriver.id },
		});
		expect(dbDriver).toBeNull();
	});

	it('delete should return null for non-existent driver', async () => {
		expect(await deleteDriverService('non-existent-id')).toBeNull();
	});
});
