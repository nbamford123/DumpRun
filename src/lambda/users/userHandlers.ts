import type { APIGatewayProxyHandler } from 'aws-lambda'
import { schemas } from '@/schemas/zodSchemas.js'

import { createUserService, getUserService, updateUserService, deleteUserService } from './userServices.js'

export const createUser: APIGatewayProxyHandler = async (event) => {
  try {
    const requestBody = JSON.parse(event.body || '{}')
    const result = schemas.NewUser.safeParse(requestBody)

    if (!result.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid input',
          errors: result.error.issues,
        }),
      }
    }
    const newUser = await createUserService(result.data);
    return {
      statusCode: 201,
      body: JSON.stringify(newUser),
    }
  } catch (error) {
    console.error('Error in create user ', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }
  }
}

export const getUser: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing userId in path parameters' }),
      };
    }

    const user = await getUserService(userId);
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'User not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(user),
    };
  } catch (error) {
    console.error('Error in getUser:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};

export const updateUser: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing userId in path parameters' }),
      };
    }

    const requestBody = JSON.parse(event.body || '{}');
    const result = schemas.UpdateUser.safeParse(requestBody);
    if (!result.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid input', errors: result.error.issues }),
      };
    }

    const updatedUser = await updateUserService(userId, result.data);
    if (!updatedUser) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'User not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(updatedUser),
    };
  } catch (error) {
    console.error('Error in updateUser:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};

export const deleteUser: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing userId in path parameters' }),
      };
    }

    const deletedUser = await deleteUserService(userId);

    return {
      statusCode: 204,
      body: JSON.stringify(deletedUser),
    };
  } catch (error) {
    console.error('Error in deleteUser:', error);
    if (error instanceof Error && error.message === 'User not found') {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'User not found' }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};