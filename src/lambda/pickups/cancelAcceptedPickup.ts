import type { APIGatewayProxyHandler } from 'aws-lambda';

import { AuthInfo } from '@/schemas/authInfoSchema.js';

import { getPickupService } from './pickupServices.js';

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
    const authInfo = AuthInfo.parse(event.requestContext.authorizer?.claims);
    // users can't cancel accepted pickupsq
    if (authInfo['custom:role'] !== 'user') {
      const pickupService = getPickupService();
      const pickup = await pickupService.getPickup(pickupId);

      // Can't cancel deleted pickup
      if (!pickup || pickup.status === 'deleted') {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Pickup not found' }),
        };
      }

      if (
        authInfo['custom:role'] === 'admin' ||
        (authInfo['custom:role'] === 'driver' &&
          pickup.driverId === authInfo.sub)
      ) {
        if (pickup.status !== 'accepted') {
          return {
            statusCode: 409,
            body: JSON.stringify({
              message: `Pickup can't be cancelled, current status is: ${pickup.status}`,
            }),
          };
        }
        // Is there any way a pickup could have a driverId and *not* the accepted state?
        const updateData = { status: 'available' as const, driverId: null };
        const returnVal = await pickupService.updatePickup(
          pickupId,
          updateData,
        );
        return {
          statusCode: 200,
          body: JSON.stringify(returnVal),
        };
      }
    }
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: 'Not authorized',
      }),
    };
  } catch (error) {
    console.error('Error cancelling pickup acceptance:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
