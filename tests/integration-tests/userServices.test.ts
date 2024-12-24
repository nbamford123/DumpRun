import { config } from 'dotenv';
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from 'vitest';

import { getPrismaClient } from '@/lambda/middleware/createHandlerPostgres';
import {
  createUserService,
  getUserService,
  updateUserService,
  deleteUserService,
} from '@/lambda/users/userServices';

import type { NewUser, UpdateUser } from '@/schemas/apiSchema.d.ts';

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

const mockUserData: NewUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phoneNumber: '1234567890',
  address: {
    street: '123 Test St',
    city: 'Denver',
    state: 'CO',
    zipCode: '80203',
  },
  preferredContact: 'TEXT',
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
    const result = await createUserService(prisma, mockUserData);
    expect(result.user).toEqual({
      ...mockUserData,
      id: mockCognitoUserId,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
      isDeleted: expect.any(Boolean),
      pickupNotes: null,
    });

    // Verify the user was actually created in the database
    const dbUser = await prisma.user.findUnique({
      where: { id: result.user.id },
    });
    expect(dbUser).toEqual(expect.any(Object));
  });

  it('should retrieve an existing user', async () => {
    const { address, ...dbUser } = mockUserData;
    const newUser = await prisma.user.create({
      data: {
        id: mockCognitoUserId,
        ...dbUser,
        ...address,
      },
    });

    const retrievedUser = await getUserService(prisma, newUser.id);
    expect(retrievedUser).not.toBeNull();
  });

  it('should return null for non-existent user', async () => {
    expect(await getUserService(prisma, 'non-existent-id')).toBeNull();
  });

  it('should update an existing user', async () => {
    const { address, ...dbUser1 } = mockUserData;
    const newUser = await prisma.user.create({
      data: {
        id: mockCognitoUserId,
        ...dbUser1,
        ...address,
      },
    });

    const updateData: UpdateUser = {
      firstName: 'Robert',
    };

    const updatedUser = await updateUserService(prisma, newUser.id, updateData);

    expect(updatedUser.firstName).toBe(updateData.firstName);
    expect(updatedUser.email).toBe(newUser.email);
    expect(new Date(updatedUser.updatedAt).getTime()).toBeGreaterThan(
      newUser.updatedAt.getTime()
    );

    // Verify the user was actually updated in the database
    const { street, city, state, zipCode, ...dbUser } =
      await prisma.user.findUnique({ where: { id: newUser.id } });
    const dbUserWithISOStrings = {
      ...dbUser,
      address: {
        street,
        city,
        state,
        zipCode,
      },
      createdAt: dbUser?.createdAt.toISOString(),
      updatedAt: dbUser?.updatedAt.toISOString(),
    };
    expect(updatedUser).toEqual(dbUserWithISOStrings);
  });

  it('should return null for updating non-existent user', async () => {
    expect(await updateUserService(prisma, 'non-existent-id', {})).toBeNull();
  });

  it('should delete an existing user', async () => {
    const { address, ...dbUser1 } = mockUserData;
    const { street, city, state, zipCode, ...newUser } =
      await prisma.user.create({
        data: {
          id: mockCognitoUserId,
          ...dbUser1,
          ...address,
        },
      });
    const newUserWithISOStrings = {
      ...newUser,
      address: {
        street,
        city,
        state,
        zipCode,
      },
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
