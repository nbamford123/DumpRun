import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
import { Prisma, type PrismaClient, type User as DBUser } from '@prisma/client';

import { formatPhoneForCognito } from '@/utils/formatPhoneForCognito.js';
import { generateSecurePassword } from '@/utils/generateSecurePassword.js';

import type {
  User,
  NewUser,
  UpdateUser,
  PrismaError,
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

const isValidPreferredContact = (val: unknown): val is 'CALL' | 'TEXT' =>
  val === 'CALL' || val === 'TEXT';

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

const userToDB = (user: NewUser): Partial<DBUser> => {
  const { address, ...dbUser } = user;
  return {
    ...dbUser,
    ...address,
  };
};

export const createUserService = async (
  prisma: PrismaClient,
  userData: NewUser
): Promise<User> => {
  const cognito = cognitoClient.getInstance();
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  try {
    // Start a transaction for the entire user creation process
    const myUser = await prisma.$transaction(
      async (tx) => {
        // Create Cognito user with phone number as username (like we would in production)
        const cognitoResponse = await cognito.adminCreateUser({
          UserPoolId: userPoolId,
          Username: userData.phoneNumber, // Using phone as username like Uber
          UserAttributes: [
            {
              Name: 'phone_number',
              Value: formatPhoneForCognito(userData.phoneNumber),
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
          ],
          TemporaryPassword: generateSecurePassword(),
          MessageAction: 'SUPPRESS', // We'll handle our own communication
        });

        const cognitoUserId = cognitoResponse.User?.Username;
        if (!cognitoUserId) {
          throw new Error('Failed to get Cognito user ID after creation');
        }

        // Create the user in the database
        const dbNewUser = {
          ...(userToDB(userData) as DBUser),
          id: cognitoUserId,
        };
        const dbUser = await tx.user.create({
          data: dbNewUser,
        });

        // Set a permanent password (in production, this would happen after SMS verification)
        await cognito.adminSetUserPassword({
          UserPoolId: userPoolId,
          Username: cognitoUserId,
          Password: generateSecurePassword(),
          Permanent: true,
        });

        return dbUser;
      },
      {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
    return dbToUser(myUser);
  } catch (error) {
    // What about exisiting cognito user error?
    // What about existing email error? It's unique in prisma db
    // Handle specific error cases that will be important in production
    if ((error as PrismaError).name === 'UsernameExistsException') {
      throw new Error('A user with this phone number already exists');
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('A user with this email already exists');
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
        ...user,
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
  try {
    const user = await prisma.user.delete({
      where: {
        id: id,
      },
    });
    return dbToUser(user);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      // Record to delete does not exist
      return null;
    }
    throw error; // Re-throw other errors
  }
};
