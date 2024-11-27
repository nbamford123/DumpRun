import { config } from 'dotenv';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import {
	createUserService,
	getUserService,
	updateUserService,
	deleteUserService,
} from '@/lambda/users/userServices';
import { getPrismaClient } from '@/lambda/middleware/createHandlerPostgres';

import type { NewUser, UpdateUser } from '@/schemas/apiSchema.d.ts';

// Load environment variables from .env.test
config({ path: '.env.test' });

vi.mock('@aws-sdk/client-cognito-identity-provider');

// Mock cognito
const mockCognito = {
	adminGetUser: vi.fn(),
};
mockCognito.adminGetUser.mockResolvedValue({});

const prisma = getPrismaClient();

const mockCognitoUserId = 'test-cognito-id';
const mockUserData = {
	name: 'Test User',
	email: 'test@example.com',
	phone: '1234567890',
	address: '123 Test St',
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
	await prisma.user.deleteMany();
});

describe('User Service Integration Tests', () => {
	it('should create a new user', async () => {
		const createdUser = await createUserService(
			prisma,
			mockCognitoUserId,
			mockUserData,
		);

		expect(createdUser.id).toEqual(mockCognitoUserId);
		expect(createdUser.name).toBe(mockUserData.name);
		expect(createdUser.email).toBe(mockUserData.email);
		expect(createdUser.phone).toBe(mockUserData.phone);
		expect(createdUser.address).toBe(mockUserData.address);
		expect(createdUser).toHaveProperty('createdAt');
		expect(createdUser).toHaveProperty('updatedAt');

		// Verify the user was actually created in the database
		const dbUser = await prisma.user.findUnique({
			where: { id: createdUser.id },
		});
		const dbUserWithISOStrings = {
			...dbUser,
			createdAt: dbUser?.createdAt.toISOString(),
			updatedAt: dbUser?.updatedAt.toISOString(),
		};
		expect(dbUserWithISOStrings).toEqual(createdUser);
	});

	it('should retrieve an existing user', async () => {
		const newUser = await prisma.user.create({
			data: {
				id: mockCognitoUserId,
				...mockUserData,
			},
		});

		const retrievedUser = await getUserService(prisma, newUser.id);
		const newUserWithISOStrings = {
			...newUser,
			createdAt: newUser?.createdAt.toISOString(),
			updatedAt: newUser?.updatedAt.toISOString(),
		};

		expect(retrievedUser).toEqual(newUserWithISOStrings);
	});

	it('should return null for non-existent user', async () => {
		expect(await getUserService(prisma, 'non-existent-id')).toBeNull();
	});

	it('should update an existing user', async () => {
		const newUser = await prisma.user.create({
			data: {
				id: mockCognitoUserId,
				...mockUserData,
			},
		});

		const updateData: UpdateUser = {
			name: 'Robert Smith',
		};

		const updatedUser = await updateUserService(prisma, newUser.id, updateData);

		expect(updatedUser.name).toBe(updateData.name);
		expect(updatedUser.email).toBe(newUser.email);
		expect(new Date(updatedUser.updatedAt).getTime()).toBeGreaterThan(
			newUser.updatedAt.getTime(),
		);

		// Verify the user was actually updated in the database
		const dbUser = await prisma.user.findUnique({ where: { id: newUser.id } });
		const dbUserWithISOStrings = {
			...dbUser,
			createdAt: dbUser?.createdAt.toISOString(),
			updatedAt: dbUser?.updatedAt.toISOString(),
		};
		expect(updatedUser).toEqual(dbUserWithISOStrings);
	});

	it('should return null for updating non-existent user', async () => {
		expect(await updateUserService(prisma, 'non-existent-id', {})).toBeNull();
	});

	it('should delete an existing user', async () => {
		const newUser = await prisma.user.create({
			data: {
				id: mockCognitoUserId,
				...mockUserData,
			},
		});
		const newUserWithISOStrings = {
			...newUser,
			createdAt: newUser?.createdAt.toISOString(),
			updatedAt: newUser?.updatedAt.toISOString(),
		};

		const deletedUser = await deleteUserService(prisma, newUser.id);

		expect(deletedUser).toEqual(newUserWithISOStrings);

		// Verify the user was actually deleted from the database
		const dbUser = await prisma.user.findUnique({ where: { id: newUser.id } });
		expect(dbUser).toBeNull();
	});

	it('should return null for non-existent user', async () => {
		expect(await deleteUserService(prisma, 'non-existent-id')).toBeNull();
	});
});
