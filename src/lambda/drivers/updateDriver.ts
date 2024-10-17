import type { APIGatewayProxyHandler } from 'aws-lambda';

import { schemas } from '@/schemas/zodSchemas.js';
import { AuthInfo } from '@/schemas/authInfoSchema.js';

import { updateDriverService } from './driverServices.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authInfo = AuthInfo.parse(event.requestContext.authorizer?.claims);

    const driverId = event.pathParameters?.driverId;
    if (!driverId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing driverId in path parameters',
        }),
      };
    }

    if (
      authInfo['custom:role'] === 'admin' ||
      (authInfo['custom:role'] === 'driver' && authInfo.sub === driverId)
    ) {
      const requestBody = JSON.parse(event.body || '{}');
      const result = schemas.UpdateDriver.safeParse(requestBody);
      if (!result.success) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: 'Invalid input',
            errors: result.error.issues,
          }),
        };
      }

      const updatedUDriver = await updateDriverService(driverId, result.data);
      if (!updatedUDriver) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Driver not found' }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(updatedUDriver),
      };
    }
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: 'Not authorized',
      }),
    };
  } catch (error) {
    console.error('Error in updateDriver:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
