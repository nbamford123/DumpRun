import type { APIGatewayProxyHandler } from 'aws-lambda';

import { schemas } from '@/schemas/zodSchemas.js';
import { AuthInfo, listPickupsQuerySchema } from '@/schemas/zodSchemaHelpers.js';

import {
  createPickupService,
  getPickupService,
  getPickupsService,
  updatePickupService,
  deletePickupService,
  availablePickupsService,
  acceptPickupService,
} from './pickupServices.js';
import { validGetPickup } from './pickupHelpers.js';

export const createPickup: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse and validate auth info-- should this be safeParse with a return instead
    // of the throw and 500?
    const authInfo = AuthInfo.parse(
      event.requestContext.authorizer?.claims,
    );
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

    const newPickup = await createPickupService(userId, result.data);
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

export const getPickups: APIGatewayProxyHandler = async (event) => {
  try {
    const authInfo = AuthInfo.parse(
      event.requestContext.authorizer?.claims,
    );
    // only admins are allowed to retrieve a list of pickups
    if (authInfo['custom:role'] !== 'admin') {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Not authorized' }),
      };
    }
    // Extract query parameters
    const { status, limit, cursor } = listPickupsQuerySchema.parse(
      event.queryStringParameters,
    );

    const pickups = await getPickupsService(limit, cursor, status);
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

export const getPickup: APIGatewayProxyHandler = async (event) => {
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

    const pickup = await getPickupService(pickupId);
    const authInfo = AuthInfo.parse(
      event.requestContext.authorizer?.claims,
    );
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

export const updatePickup: APIGatewayProxyHandler = async (event) => {
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

    const authInfo = AuthInfo.parse(
      event.requestContext.authorizer?.claims,
    );
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
    const pickup = await getPickupService(pickupId);
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
    const updatedPickup = await updatePickupService(pickupId, result.data);

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

export const deletePickup: APIGatewayProxyHandler = async (event) => {
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

    const authInfo = AuthInfo.parse(
      event.requestContext.authorizer?.claims,
    );

    // Fetch the existing pickup
    const pickup = await getPickupService(pickupId);
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
        const deletedPickup = await deletePickupService(pickupId, true);
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
    const deletedPickup = await deletePickupService(pickupId);

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

export const availablePickups: APIGatewayProxyHandler = async (event) => {
  try {
    const authInfo = AuthInfo.parse(
      event.requestContext.authorizer?.claims,
    );
    // I guess you have to be a driver to accept a pickup
    // Should we also check that you haven't scheduled another one at the same time?
    if (
      authInfo['custom:role'] === 'driver' ||
      authInfo['custom:role'] === 'admin'
    ) {
      const pickups = await availablePickupsService();
      return {
        statusCode: 200,
        body: JSON.stringify(pickups),
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

export const acceptPickup: APIGatewayProxyHandler = async (event) => {
  try {
    const authInfo = AuthInfo.parse(
      event.requestContext.authorizer?.claims,
    );
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
      const pickup = await getPickupService(pickupId);
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

      const acceptedPickup = await acceptPickupService(driverId, pickupId);
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

export const cancelAcceptedPickup: APIGatewayProxyHandler = async (event) => {
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
    const authInfo = AuthInfo.parse(
      event.requestContext.authorizer?.claims,
    );
    const pickup = await getPickupService(pickupId);

    // Can't cancel deleted pickup
    if (!pickup || pickup.status === 'deleted') {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Pickup not found' }),
      };
    }

    if (
      authInfo['custom:role'] === 'admin' ||
      (authInfo['custom:role'] === 'driver' && pickup.driverId === authInfo.sub)
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
      const returnVal = await updatePickupService(pickupId, updateData);
      return {
        statusCode: 200,
        body: JSON.stringify(returnVal),
      };
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
