import type { APIGatewayProxyHandler } from 'aws-lambda';

import { schemas } from '@/schemas/zodSchemas.js';
import { AuthInfo } from '@/schemas/authInfoSchema.js';

import { createUserService } from './userServices.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Log the event to debug issues
    const authInfo = AuthInfo.parse(event.requestContext.authorizer?.claims);
    const requestBody = JSON.parse(event.body || '{}');
    const result = schemas.NewUser.safeParse(requestBody);
    if (!result.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid input',
          errors: result.error.issues,
        }),
      };
    }
    const newUser = await createUserService(authInfo.sub, result.data);
    return {
      statusCode: 201,
      body: JSON.stringify(newUser),
    };
  } catch (error) {
    console.error('Error in create user ', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
