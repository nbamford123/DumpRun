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

const driverToDB = (driver: NewDriver | UpdateDriver): Partial<DBDriver> => {
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

  // Check for existing email first
  const existingUser = await prisma.driver.findUnique({
    where: { email: driverData.email },
    select: { email: true },
  });

  if (existingUser) {
    return { type: 'email_exists', email: driverData.email };
  }
  let cognitoUserId: string | undefined;

  try {
    const formattedPhone = formatPhoneForCognito(driverData.phoneNumber);
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
        {
          Name: 'custom:role',
          Value: 'driver',
        },
      ],
      TemporaryPassword: process.env.TEST_USER_PASSWORD,
      MessageAction: 'SUPPRESS', // We'll handle our own communication
    });

    cognitoUserId = cognitoResponse.User?.Username;
    if (!cognitoUserId) {
      throw new Error('Failed to get Cognito user ID after creation');
    }

    const myDriver = await prisma.$transaction(
      async (tx) => {
        const dbNewDriver = {
          ...driverToDB(driverData),
          id: cognitoUserId,
        } as DBDriver;
        return await tx.driver.create({
          data: dbNewDriver,
        });
      },
      {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    return { type: 'success', user: dbToDriver(myDriver) };
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
        return { type: 'phone_exists', phoneNumber: driverData.phoneNumber };
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
        ...driverToDB(driver),
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
  const cognito = cognitoClient.getInstance();
  const userPoolId = process.env.COGNITO_USER_POOL_ID;

  if (!userPoolId) {
    throw new Error('COGNITO_USER_POOL_ID environment variable is not set');
  }

  try {
    const deletedDriver = await prisma.$transaction(
      async (tx) => {
        const driver = await tx.driver.findUnique({
          where: { id },
        });
        if (!driver) {
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
        await tx.driver.delete({
          where: { id },
        });

        return driver;
      },
      {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
    return deletedDriver ? dbToDriver(deletedDriver) : null;
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
