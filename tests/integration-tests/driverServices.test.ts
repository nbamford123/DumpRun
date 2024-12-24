import { config } from 'dotenv';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import {
  createDriverService,
  getDriverService,
  updateDriverService,
  deleteDriverService,
} from '@/lambda/drivers/driverServices';
import { getPrismaClient } from '@/lambda/middleware/createHandlerPostgres.js';

import type { NewDriver, UpdateDriver } from '@/schemas/apiSchema.d.ts';

// Load environment variables from .env.test
const out = config({ path: '.env.test', override: true });
console.log(`Connecting to database ${process.env.DATABASE_URL}`);
const mockCognitoUserId = 'test-cognito-id';

// Mock the AWS SDK
vi.mock('@aws-sdk/client-cognito-identity-provider', () => {
  const adminCreateUser = vi
    .fn()
    .mockImplementation(() => ({ User: { Username: mockCognitoUserId } }));
  const adminDeleteUser = vi.fn();
  const adminSetUserPassword = vi.fn();
  const adminUpdateUserAttributes = vi.fn();

  return {
    CognitoIdentityProvider: vi.fn().mockImplementation(() => ({
      adminCreateUser,
      adminDeleteUser,
      adminSetUserPassword,
      adminUpdateUserAttributes,
    })),
  };
});

const prisma = getPrismaClient();

const mockDriverData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phoneNumber: '303-555-1212',
  address: {
    street: '123 Test St',
    city: 'Denver',
    state: 'CO',
    zipCode: '80203',
  },
  preferredContact: 'TEXT',
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
  it('should create a new driver', async () => {
    const result = await createDriverService(prisma, mockDriverData);
    expect(result.user).toEqual({
      ...mockDriverData,
      id: mockCognitoUserId,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    // Verify the user was actually created in the database
    const dbDriver = await prisma.driver.findUnique({
      where: { id: result.user.id },
    });
    expect(dbDriver).not.toBeNull();
  });

  it('should retrieve an existing driver', async () => {
    const { address, ...dbDriver } = mockDriverData;
    const newDriver = await prisma.driver.create({
      data: {
        id: mockCognitoUserId,
        ...dbDriver,
        ...address,
      },
    });

    const retrievedDriver = await getDriverService(prisma, newDriver.id);
    expect(retrievedDriver).not.toBeNull();
  });

  it('should return null for non-existent driver', async () => {
    expect(await getDriverService(prisma, 'non-existent-id')).toBeNull();
  });

  it('should update an existing driver', async () => {
    const { address, ...dbDriver1 } = mockDriverData;
    const newDriver = await prisma.driver.create({
      data: {
        id: mockCognitoUserId,
        ...dbDriver1,
        ...address,
      },
    });

    const updateData: UpdateDriver = {
      firstName: 'Robert',
    };
    const updatedDriver = await updateDriverService(
      prisma,
      newDriver.id,
      updateData
    );

    expect(updatedDriver.name).toBe(updateData.name);
    expect(updatedDriver.email).toBe(newDriver.email);
    expect(new Date(updatedDriver.updatedAt).getTime()).toBeGreaterThan(
      newDriver.updatedAt.getTime()
    );

    // Verify the user was actually updated in the database
    const { street, city, state, zipCode, ...dbDriver } =
      await prisma.driver.findUnique({
        where: { id: newDriver.id },
      });
    const dbDriverWithISOStrings = {
      ...dbDriver,
      address: {
        street,
        city,
        state,
        zipCode,
      },
      createdAt: dbDriver?.createdAt.toISOString(),
      updatedAt: dbDriver?.updatedAt.toISOString(),
    };
    expect(updatedDriver).toEqual(dbDriverWithISOStrings);
  });

  it('should return null for updating non-existent driver', async () => {
    expect(await updateDriverService(prisma, 'non-existent-id', {})).toBeNull();
  });

  it('should delete an existing driver', async () => {
    const { address, ...dbDriver1 } = mockDriverData;
    const { street, city, state, zipCode, ...newDriver } =
      await prisma.driver.create({
        data: {
          id: mockCognitoUserId,
          ...dbDriver1,
          ...address,
        },
      });

    const newDriverWithISOStrings = {
      ...newDriver,
      address: {
        street,
        city,
        state,
        zipCode,
      },
      createdAt: newDriver?.createdAt.toISOString(),
      updatedAt: newDriver?.updatedAt.toISOString(),
    };

    const deletedDriver = await deleteDriverService(prisma, newDriver.id);

    expect(deletedDriver).toEqual(newDriverWithISOStrings);

    // Verify the user was actually deleted from the database
    const dbDriver = await prisma.driver.findUnique({
      where: { id: newDriver.id },
    });
    expect(dbDriver).toBeNull();
  });

  it('delete should return null for non-existent driver', async () => {
    expect(await deleteDriverService(prisma, 'non-existent-id')).toBeNull();
  });
});
