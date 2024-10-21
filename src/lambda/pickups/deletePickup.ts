import type { APIGatewayProxyHandler } from 'aws-lambda';

import { AuthInfo } from '@/schemas/authInfoSchema.js';

import { getPickupService } from './pickupServices.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  // Shouldn't the custom role checks come before the getPickup?
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

    const pickupService = getPickupService();
    // Fetch the existing pickup
    const pickup = await pickupService.getPickup(pickupId);
    // Can't delete a deleted pickup
    if (!pickup || pickup.status === 'deleted') {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Pickup not found' }),
      };
    }

    // Check authorization and pickup state
    if (authInfo['custom:role'] === 'admin') {
      // Admins can delete any pickup
      if (event.queryStringParameters?.hardDelete === 'true') {
        const deletedPickup = await pickupService.deletePickup(pickupId, true);
        return {
          statusCode: 204,
          body: JSON.stringify({
            message: 'Pickup deleted successfully',
          }),
        };
      }
    } else if (
      authInfo['custom:role'] === 'user' &&
      pickup.userId === authInfo.sub
    ) {
      // Users can only soft delete their own pickups if they're not in progress (and not cancelled)
      if (
        pickup.status !== 'available' &&
        pickup.status !== 'accepted' &&
        pickup.status !== 'cancelled'
      ) {
        return {
          statusCode: 403,
          body: JSON.stringify({
            message: `Cannot delete pickup with status ${pickup.status}`,
          }),
        };
      }
    } else {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: 'Not authorized to delete this pickup',
        }),
      };
    }

    // Perform soft delete
    const deletedPickup = await pickupService.deletePickup(pickupId);

    return {
      statusCode: 200,
      body: JSON.stringify(deletedPickup),
    };
  } catch (error) {
    console.error('Error deleting pickup:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
