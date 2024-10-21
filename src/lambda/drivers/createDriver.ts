import type { APIGatewayProxyHandler } from 'aws-lambda';

import { schemas } from '@/schemas/zodSchemas.js';
import { AuthInfo } from '@/schemas/authInfoSchema.js';

import { createDriverService } from './driverServices.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authInfo = AuthInfo.parse(event.requestContext.authorizer?.claims);
    const requestBody = JSON.parse(event.body || '{}');
    const result = schemas.NewDriver.safeParse(requestBody);
    if (!result.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid input',
          errors: result.error.issues,
        }),
      };
    }
    const newDriver = await createDriverService(authInfo.sub, result.data);
    return {
      statusCode: 201,
      body: JSON.stringify(newDriver),
    };
  } catch (error) {
    console.error('Error in create driver ', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
