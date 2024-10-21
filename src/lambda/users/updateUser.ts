import type { APIGatewayProxyHandler } from 'aws-lambda';

import { schemas } from '@/schemas/zodSchemas.js';
import { AuthInfo } from '@/schemas/authInfoSchema.js';

import { updateUserService } from './userServices.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authInfo = AuthInfo.parse(event.requestContext.authorizer?.claims);

    const userId = event.pathParameters?.userId;
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing userId in path parameters' }),
      };
    }
    if (
      authInfo['custom:role'] === 'admin' ||
      (authInfo['custom:role'] === 'user' && authInfo.sub === userId)
    ) {
      const requestBody = JSON.parse(event.body || '{}');
      const result = schemas.UpdateUser.safeParse(requestBody);
      if (!result.success) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: 'Invalid input',
            errors: result.error.issues,
          }),
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
    }
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: 'Not authorized',
      }),
    };
  } catch (error) {
    console.error('Error in updateUser:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
