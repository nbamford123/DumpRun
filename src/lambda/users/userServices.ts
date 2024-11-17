import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
import { Prisma, PrismaClient } from '@prisma/client';

import type { components } from '@/schemas/apiSchema.d.ts';

type User = components['schemas']['User'];
type NewUser = components['schemas']['NewUser'];
type UpdateUser = components['schemas']['UpdateUser'];

const cognito = new CognitoIdentityProvider();
const prisma = new PrismaClient();

export const createUserService = async (
	cognitoUserId: string,
	userData: NewUser,
): Promise<User> => {
	try {
		// Verify Cognito user exists
		await cognito.adminGetUser({
			UserPoolId: process.env.COGNITO_USER_POOL_ID || '',
			Username: cognitoUserId,
		});

		// If the above doesn't throw, the user exists in Cognito
		const dbUser = await prisma.user.create({
			data: {
				id: cognitoUserId,
				...userData,
			},
		});

		return {
			...dbUser,
			createdAt: dbUser.createdAt.toISOString(),
			updatedAt: dbUser.updatedAt.toISOString(),
		};
	} catch (error) {
		if ((error as Error & { code: string }).code === 'UserNotFoundException') {
			throw new Error(`Cognito user with ID ${cognitoUserId} not found`);
		}
		throw error; // Re-throw other errors
	} finally {
		await prisma.$disconnect();
	}
};

export const getUsersService = async (
	limit = 10,
	offset = 0,
): Promise<User[]> => {
	const prisma = new PrismaClient();
	try {
		const users = await prisma.user.findMany({
			take: limit,
			skip: offset,
		});
		return users.map((user) => ({
			...user,
			createdAt: user?.createdAt.toISOString(),
			updatedAt: user?.updatedAt.toISOString(),
		}));
	} finally {
		await prisma.$disconnect();
	}
};

export const getUserService = async (id: string): Promise<User | null> => {
	const prisma = new PrismaClient();
	try {
		const user = await prisma.user.findUnique({
			where: { id: id },
		});
		return user === null
			? user
			: {
					...user,
					createdAt: user?.createdAt.toISOString(),
					updatedAt: user?.updatedAt.toISOString(),
				};
	} finally {
		await prisma.$disconnect();
	}
};

export const updateUserService = async (
	id: string,
	user: UpdateUser,
): Promise<User | null> => {
	const prisma = new PrismaClient();
	try {
		const updatedUser = await prisma.user.update({
			where: { id: id },
			data: {
				...user,
			},
		});
		return {
			...updatedUser,
			createdAt: updatedUser.createdAt.toISOString(),
			updatedAt: updatedUser.updatedAt.toISOString(),
		};
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === 'P2025'
		) {
			// Record to update does not exist
			return null;
		}
		throw error; // Re-throw other errors
	} finally {
		await prisma.$disconnect();
	}
};

export const deleteUserService = async (id: string): Promise<User | null> => {
	const prisma = new PrismaClient();
	try {
		const user = await prisma.user.delete({
			where: {
				id: id,
			},
		});
		return {
			...user,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
		};
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === 'P2025'
		) {
			// Record to delete does not exist
			return null;
		}
		throw error; // Re-throw other errors
	} finally {
		await prisma.$disconnect();
	}
};
