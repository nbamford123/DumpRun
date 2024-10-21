import type { APIGatewayProxyHandler } from 'aws-lambda';

import { AuthInfo } from '@/schemas/authInfoSchema.js';
import { listPickupsQuerySchema } from '@/schemas/zodSchemaHelpers.js';

import { getPickupService } from './pickupServices.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authInfo = AuthInfo.parse(event.requestContext.authorizer?.claims);
    // only admins are allowed to retrieve a list of pickups
    if (authInfo['custom:role'] !== 'admin') {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Not authorized' }),
      };
    }
    // Extract query parameters
    const { status, limit, cursor, startRequestedTime, endRequestedTime } =
      listPickupsQuerySchema.parse(event.queryStringParameters);

    const pickupService = getPickupService();
    const pickups = await pickupService.getPickups(
      status,
      limit,
      cursor,
      startRequestedTime,
      endRequestedTime,
    );
    return {
      statusCode: 200,
      body: JSON.stringify(pickups),
    };
  } catch (error) {
    console.error('Error in getPickups:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
