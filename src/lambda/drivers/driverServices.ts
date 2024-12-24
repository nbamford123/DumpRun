import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
import {
  Prisma,
  type PrismaClient,
  type Driver as DBDriver,
} from '@prisma/client';

import { formatPhoneForCognito } from '@/utils/formatPhoneForCognito.js';
import { generateSecurePassword } from '@/utils/generateSecurePassword.js';
import {
  type Driver,
  type NewDriver,
  type UpdateDriver,
  type PrismaError,
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

const dbToDriver = (dbDriver: DBDriver): Driver => {
  const {
    street,
    city,
    state,
    zipCode,
    preferredContact,
    createdAt,
    updatedAt,
    ...driver
  } = dbDriver;
  const driverPreferredContact = isValidPreferredContact(preferredContact)
    ? preferredContact
    : 'TEXT';
  return {
    ...driver,
    preferredContact: driverPreferredContact,
    createdAt: dbDriver.createdAt.toISOString(),
    updatedAt: dbDriver.updatedAt.toISOString(),
    address: {
      street: street,
      city: city,
      state: state,
      zipCode: zipCode,
    },
  };
};

const driverToDB = (driver: NewDriver): Partial<DBDriver> => {
  const { address, ...dbDriver } = driver;
  return {
    ...dbDriver,
    ...address,
  };
};

export const createDriverService = async (
  prisma: PrismaClient,
  driverData: NewDriver
): Promise<CreateUserResult<Driver>> => {
  const cognito = cognitoClient.getInstance();
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  try {
    // Start a transaction for the entire driver creation process
    const myDriver = await prisma.$transaction(
      async (tx) => {
        // Create Cognito user with phone number as username (like we would in production)
        const cognitoResponse = await cognito.adminCreateUser({
          UserPoolId: userPoolId,
          Username: driverData.phoneNumber, // Using phone as username like Uber
          UserAttributes: [
            {
              Name: 'phone_number',
              Value: formatPhoneForCognito(driverData.phoneNumber),
            },
            {
              Name: 'phone_number_verified',
              Value: 'true', // Auto-verified for now, will be 'false' when we add SMS
            },
            {
              Name: 'email',
              Value: driverData.email,
            },
            {
              Name: 'email_verified',
              Value: 'true',
            },
            {
              Name: 'given_name',
              Value: driverData.firstName,
            },
            {
              Name: 'family_name',
              Value: driverData.lastName,
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
        const dbNewDriver = {
          ...(driverToDB(driverData) as DBDriver),
          id: cognitoUserId,
        };
        const dbDriver = await tx.driver.create({
          data: dbNewDriver,
        });

        // Set a permanent password (in production, this would happen after SMS verification)
        await cognito.adminSetUserPassword({
          UserPoolId: userPoolId,
          Username: cognitoUserId,
          Password: generateSecurePassword(),
          Permanent: true,
        });

        return dbDriver;
      },
      {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
    return { type: 'success', user: dbToDriver(myDriver) };
  } catch (error) {
    // Handle Cognito-specific errors
    if (isCognitoError(error)) {
      switch (error.name) {
        case 'UsernameExistsException':
          return { type: 'phone_exists', phoneNumber: driverData.phoneNumber };
        // Assuming Zod would catch invalid input, but leaving them here just in case
        // case 'InvalidParameterException':
        //   if (error.message.includes('email')) {
        //     // Cognito might also reject invalid emails
        //     throw new Error(`Invalid email format: ${userData.email}`);
        //   }
        //   if (error.message.includes('phone')) {
        //     throw new Error(`Invalid phone format: ${userData.phoneNumber}`);
        //   }
        //   throw error;
        // case 'TooManyRequestsException':
        //   throw new Error('Rate limit exceeded. Please try again later');
        default:
          throw error;
      }
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = error.meta?.target as string[] | undefined;
      if (target?.includes('email')) {
        return { type: 'email_exists', email: driverData.email };
      }
    }
    throw error;
  }
};

export const getDriversService = async (
  prisma: PrismaClient,
  limit = 10,
  offset = 0
): Promise<Driver[]> => {
  const users = await prisma.driver.findMany({
    take: limit,
    skip: offset,
  });
  return users.map(dbToDriver);
};

export const getDriverService = async (
  prisma: PrismaClient,
  id: string
): Promise<Driver | null> => {
  const driver = await prisma.driver.findUnique({
    where: { id: id },
  });
  return driver === null ? driver : dbToDriver(driver);
};

export const updateDriverService = async (
  prisma: PrismaClient,
  id: string,
  driver: UpdateDriver
): Promise<Driver | null> => {
  try {
    const updatedDriver = await prisma.driver.update({
      where: { id: id },
      data: {
        ...driver,
      },
    });
    return dbToDriver(updatedDriver);
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

export const deleteDriverService = async (
  prisma: PrismaClient,
  id: string
): Promise<Driver | null> => {
  try {
    const driver = await prisma.driver.delete({
      where: {
        id: id,
      },
    });
    return dbToDriver(driver);
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
