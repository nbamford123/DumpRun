import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
import { Prisma, type PrismaClient, type User as DBUser } from '@prisma/client';

import { formatPhoneForCognito } from '@/utils/formatPhoneForCognito.js';
import { generateSecurePassword } from '@/utils/generateSecurePassword.js';

import {
  type User,
  type NewUser,
  type UpdateUser,
  type CreateUserResult,
  isCognitoError,
  isValidPreferredContact,
} from '../types/schemaTypes.js';

const cognitoClient = (() => {
  let instance: CognitoIdentityProvider | null = null;

  return {
    getInstance: () => {
      const userPoolId = process.env.COGNITO_USER_POOL_ID;
      const region = process.env.AWS_REGION;

      if (!userPoolId) {
        throw new Error('COGNITO_USER_POOL_ID environment variable is not set');
      }

      if (!region) {
        throw new Error('AWS_REGION environment variable is not set');
      }

      if (!instance) {
        instance = new CognitoIdentityProvider({ region });
      }

      return instance;
    },
  };
})();

const dbToUser = (dbUser: DBUser): User => {
  const {
    street,
    city,
    state,
    zipCode,
    preferredContact,
    createdAt,
    updatedAt,
    ...user
  } = dbUser;
  const userPreferredContact = isValidPreferredContact(preferredContact)
    ? preferredContact
    : 'TEXT';
  return {
    ...user,
    preferredContact: userPreferredContact,
    createdAt: dbUser.createdAt.toISOString(),
    updatedAt: dbUser.updatedAt.toISOString(),
    address: {
      street: street,
      city: city,
      state: state,
      zipCode: zipCode,
    },
  };
};

const userToDB = (user: NewUser | UpdateUser): Partial<DBUser> => {
  const { address, ...dbUser } = user;
  return {
    ...dbUser,
    ...address,
  };
};

export const createUserService = async (
  prisma: PrismaClient,
  userData: NewUser
): Promise<CreateUserResult<User>> => {
  const cognito = cognitoClient.getInstance();
  const userPoolId = process.env.COGNITO_USER_POOL_ID;

  // Check for existing email first
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
    select: { email: true },
  });

  if (existingUser) {
    return { type: 'email_exists', email: userData.email };
  }
  let cognitoUserId: string | undefined;

  try {
    const formattedPhone = formatPhoneForCognito(userData.phoneNumber);
    // Create Cognito user with phone number as username (like we would in production), and test password for now
    const cognitoResponse = await cognito.adminCreateUser({
      UserPoolId: userPoolId,
      Username: formattedPhone, // Using phone as username like Uber
      UserAttributes: [
        {
          Name: 'phone_number',
          Value: formattedPhone,
        },
        {
          Name: 'phone_number_verified',
          Value: 'true', // Auto-verified for now, will be 'false' when we add SMS
        },
        {
          Name: 'email',
          Value: userData.email,
        },
        {
          Name: 'email_verified',
          Value: 'true',
        },
        {
          Name: 'given_name',
          Value: userData.firstName,
        },
        {
          Name: 'family_name',
          Value: userData.lastName,
        },
        {
          Name: 'custom:role',
          Value: 'user',
        },
      ],
      TemporaryPassword: process.env.TEST_USER_PASSWORD,
      MessageAction: 'SUPPRESS', // We'll handle our own communication
    });

    cognitoUserId = cognitoResponse.User?.Username;
    if (!cognitoUserId) {
      throw new Error('Failed to get Cognito user ID after creation');
    }

    const myUser = await prisma.$transaction(
      async (tx) => {
        const dbNewUser = {
          ...userToDB(userData),
          id: cognitoUserId,
        } as DBUser;
        return await tx.user.create({
          data: dbNewUser,
        });
      },
      {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    return { type: 'success', user: dbToUser(myUser) };
  } catch (error) {
    // Clean up Cognito user if transaction fails
    if (cognitoUserId) {
      try {
        await cognito.adminDeleteUser({
          UserPoolId: userPoolId,
          Username: cognitoUserId,
        });
      } catch (deleteError) {
        console.error(
          'Failed to delete Cognito user during rollback:',
          deleteError
        );
      }
    }

    if (isCognitoError(error)) {
      if (error.name === 'UsernameExistsException') {
        return { type: 'phone_exists', phoneNumber: userData.phoneNumber };
      }
    }

    throw error;
  }
};

export const getUsersService = async (
  prisma: PrismaClient,
  limit = 10,
  offset = 0
): Promise<User[]> => {
  const users = await prisma.user.findMany({
    take: limit,
    skip: offset,
  });
  return users.map(dbToUser);
};

export const getUserService = async (
  prisma: PrismaClient,
  id: string
): Promise<User | null> => {
  const user = await prisma.user.findUnique({
    where: { id: id },
  });
  return user === null ? user : dbToUser(user);
};

export const updateUserService = async (
  prisma: PrismaClient,
  id: string,
  user: UpdateUser
): Promise<User | null> => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        ...userToDB(user),
      },
    });
    return dbToUser(updatedUser);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      // Record to update does not exist
      return null;
    }
    throw error; // Re-throw other errors
  }
};

export const deleteUserService = async (
  prisma: PrismaClient,
  id: string
): Promise<User | null> => {
  const cognito = cognitoClient.getInstance();
  const userPoolId = process.env.COGNITO_USER_POOL_ID;

  if (!userPoolId) {
    throw new Error('COGNITO_USER_POOL_ID environment variable is not set');
  }

  try {
    const deletedUser = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id },
        });
        if (!user) {
          return null;
        }

        // Delete from Cognito first
        try {
          await cognito.adminDeleteUser({
            UserPoolId: userPoolId,
            Username: id,
          });
        } catch (error) {
          if (
            !isCognitoError(error) ||
            error.name !== 'UserNotFoundException'
          ) {
            throw error;
          }
          // If user not found in Cognito, continue with DB deletion
          console.warn(`Cognito user ${id} not found during deletion`);
        }
        await tx.user.delete({
          where: { id },
        });

        return user;
      },
      {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
    return deletedUser ? dbToUser(deletedUser) : null;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      // Record to delete does not exist
      return null;
    }
    if (isCognitoError(error) && error.name === 'UserNotFoundException') {
      console.error(
        `Inconsistency detected: User ${id} exists in DB but not in Cognito`
      );
      return null;
    }
    throw error; // Re-throw other errors
  }
};
