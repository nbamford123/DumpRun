import type { APIGatewayProxyHandler } from 'aws-lambda';

import { schemas } from '@/schemas/zodSchemas.js';
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
    // Only users and admins can update pickups
    if (!['admin', 'user'].includes(authInfo['custom:role'])) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: 'Not authorized',
        }),
      };
    }
    const result = schemas.UpdatePickup.safeParse(
      JSON.parse(event.body || '{}'),
    );
    if (!result.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid input',
          errors: result.error.issues,
        }),
      };
    }
    // Fetch the existing pickup
    const pickupService = getPickupService();
    const pickup = await pickupService.getPickup(pickupId);
    // Can't update deleted pickup
    if (!pickup || pickup.status === 'deleted') {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Pickup not found' }),
      };
    }

    if (authInfo['custom:role'] === 'user' && pickup.userId === authInfo.sub) {
      if (pickup.status === 'accepted' || pickup.status === 'completed') {
        return {
          statusCode: 403,
          body: JSON.stringify({
            message: 'Cannot modify an accepted or completed pickup',
          }),
        };
      }
      // For pending pickups, users can update any field
    }

    // Update the pickup
    const updatedPickup = await pickupService.updatePickup(
      pickupId,
      result.data,
    );

    return {
      statusCode: 200,
      body: JSON.stringify(updatedPickup),
    };
  } catch (error) {
    console.error('Error updating pickup:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
