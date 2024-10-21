import type { APIGatewayProxyHandler } from 'aws-lambda';

import { AuthInfo } from '@/schemas/authInfoSchema.js';

import { getPickupService } from './pickupServices.js';
import { validGetPickup } from './pickupHelpers.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const pickupId = event.pathParameters?.pickupId;
    if (!pickupId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing pickupId in path parameters',
        }),
      };
    }

    const pickupService = getPickupService();
    const pickup = await pickupService.getPickup(pickupId);
    const authInfo = AuthInfo.parse(event.requestContext.authorizer?.claims);
    // only admin can retrieve deleted pickups
    if (
      !pickup ||
      (pickup.status === 'deleted' && authInfo['custom:role'] !== 'admin')
    ) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Pickup not found' }),
      };
    }

    const requesterId = event?.requestContext?.authorizer?.claims.sub;

    if (!validGetPickup(authInfo['custom:role'], requesterId, pickup)) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: 'Not authorized',
        }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(pickup),
    };
  } catch (error) {
    console.error('Error in getPickup:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
