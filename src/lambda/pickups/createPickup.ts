import type { APIGatewayProxyHandler } from 'aws-lambda';

import { schemas } from '@/schemas/zodSchemas.js';
import { AuthInfo } from '@/schemas/authInfoSchema.js';

import { getPickupService } from './pickupServices.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse and validate auth info-- should this be safeParse with a return instead
    // of the throw and 500?
    const authInfo = AuthInfo.parse(event.requestContext.authorizer?.claims);
    // Fine-grained authorization
    if (!['user', 'admin'].includes(authInfo['custom:role'])) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: 'Not authorized',
        }),
      };
    }
    // Get Pickup data and userId
    const result = schemas.NewPickup.safeParse(JSON.parse(event.body || '{}'));
    if (!result.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid input',
          errors: result.error.issues,
        }),
      };
    }

    const userId = event?.requestContext?.authorizer?.claims.sub;

    const pickupService = getPickupService();
    const newPickup = await pickupService.createPickup(userId, result.data);
    return {
      statusCode: 201,
      body: JSON.stringify(newPickup),
    };
  } catch (error) {
    console.error('Error in create pickup ', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
