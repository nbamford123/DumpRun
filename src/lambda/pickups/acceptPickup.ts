import type { APIGatewayProxyHandler } from 'aws-lambda';

import { AuthInfo } from '@/schemas/authInfoSchema.js';

import { getPickupService } from './pickupServices.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const pickupService = getPickupService();
    const authInfo = AuthInfo.parse(event.requestContext.authorizer?.claims);
    // I guess you have to be a driver to accept a pickup
    // Should we also check that you haven't scheduled another one at the same time?
    if (
      authInfo['custom:role'] === 'driver' ||
      authInfo['custom:role'] === 'admin'
    ) {
      const driverId = event?.requestContext?.authorizer?.claims.sub;
      const pickupId = event.pathParameters?.pickupId;
      if (!pickupId) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: 'Missing pickupId in path parameters',
          }),
        };
      }
      const pickup = await pickupService.getPickup(pickupId);
      // Don't return deleted pickup
      if (!pickup || pickup.status === 'deleted') {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Pickup not found' }),
        };
      }
      if (pickup.status !== 'available') {
        return {
          statusCode: 409,
          body: JSON.stringify({ message: 'Pickup not available' }),
        };
      }

      const acceptedPickup = await pickupService.acceptPickup(driverId, pickupId);
      if (!acceptedPickup) {
        throw new Error('Failed to accept pickup');
      }
      return {
        statusCode: 200,
        body: JSON.stringify(acceptedPickup),
      };
    }
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: 'Not authorized to accept this pickup',
      }),
    };

    // return error wrong role or whatever here. not a driver?
  } catch (error) {
    console.error('Error in acceptPickup:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
