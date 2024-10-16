import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
import { Prisma, PrismaClient } from '@prisma/client';

import type { components } from '@/schemas/apiSchema.d.ts';

type Driver = components['schemas']['Driver'];
type NewDriver = components['schemas']['NewDriver'];
type UpdateDriver = components['schemas']['UpdateDriver'];

const cognito = new CognitoIdentityProvider();
const prisma = new PrismaClient();

export const createDriverService = async (
  cognitoUserId: string,
  driver: NewDriver,
): Promise<Driver> => {
  try {
    // Verify Cognito user exists
    await cognito.adminGetUser({
      UserPoolId: process.env.COGNITO_USER_POOL_ID || '',
      Username: cognitoUserId,
    });
    const newDriver = await prisma.driver.create({
      data: {
        id: cognitoUserId,
        ...driver, // Prisma will automatically handle createdAt and updatedAt
      },
    });
    return {
      ...newDriver,
      createdAt: newDriver.createdAt.toISOString(),
      updatedAt: newDriver.createdAt.toISOString(),
    };
  } finally {
    await prisma.$disconnect();
  }
};

export const getDriversService = async (
  limit = 10,
  offset = 0,
): Promise<Driver[]> => {
  try {
    const users = await prisma.driver.findMany({
      take: limit,
      skip: offset,
    });
    return users.map((driver) => ({
      ...driver,
      createdAt: driver?.createdAt.toISOString(),
      updatedAt: driver?.updatedAt.toISOString(),
    }));
  } finally {
    await prisma.$disconnect();
  }
};

export const getDriverService = async (id: string): Promise<Driver | null> => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: id },
    });
    return driver === null
      ? driver
      : {
          ...driver,
          createdAt: driver?.createdAt.toISOString(),
          updatedAt: driver?.updatedAt.toISOString(),
        };
  } finally {
    await prisma.$disconnect();
  }
};

export const updateDriverService = async (
  id: string,
  driver: UpdateDriver,
): Promise<Driver | null> => {
  try {
    const updatedDriver = await prisma.driver.update({
      where: { id: id },
      data: {
        ...driver,
      },
    });
    return {
      ...updatedDriver,
      createdAt: updatedDriver.createdAt.toISOString(),
      updatedAt: updatedDriver.updatedAt.toISOString(),
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

export const deleteDriverService = async (
  id: string,
): Promise<Driver | null> => {
  try {
    const driver = await prisma.driver.delete({
      where: {
        id: id,
      },
    });
    return {
      ...driver,
      createdAt: driver.createdAt.toISOString(),
      updatedAt: driver.updatedAt.toISOString(),
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
