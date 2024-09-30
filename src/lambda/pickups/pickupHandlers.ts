import type { APIGatewayProxyHandler } from 'aws-lambda';
import { schemas, AuthInfoSchema } from '@/schemas/zodSchemas.js';

import {
  createPickupService,
  getPickupService,
  updatePickupService,
  deletePickupService,
  availablePickupsService,
  acceptPickupService,
} from './pickupServices.js';

export const createPickup: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse and validate auth info
    const authInfo = AuthInfoSchema.parse(
      event.requestContext.authorizer?.claims,
    );

    // Fine-grained authorization
    if (!['user', 'admin'].includes(authInfo['custom:role'])) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: 'Forbidden: Insufficient permissions to create pickup',
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

export const getPickup: APIGatewayProxyHandler = async (event) => {
  // Who can get pickups? The driver who accepted it, the user who created it, and admin?
  // Where else would that be enforced if not here?
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
    if (!pickup) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Pickup not found' }),
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

    const authInfo = AuthInfoSchema.parse(
      event.requestContext.authorizer?.claims,
    );
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
    let updateData = { ...result.data };
    // Fetch the existing pickup
    const pickup = await getPickupService(pickupId);
    if (!pickup) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Pickup not found' }),
      };
    }

    // Authorization and business logic checks
    if (authInfo['custom:role'] === 'admin') {
      // Admins can update anything
    } else if (
      authInfo['custom:role'] === 'user' &&
      pickup.userId === authInfo.sub
    ) {
      if (pickup.status === 'accepted' || pickup.status === 'completed') {
        return {
          statusCode: 403,
          body: JSON.stringify({
            message: 'Cannot modify an accepted or completed pickup',
          }),
        };
      }
      // For pending pickups, users can update any field
    } else if (
      authInfo['custom:role'] === 'driver' &&
      pickup.driverId === authInfo.sub
    ) {
      if (updateData.status !== 'pending') {
        return {
          statusCode: 403,
          body: JSON.stringify({
            message: 'Drivers can only cancel their acceptance',
          }),
        };
      }
      updateData = { status: 'pending', driverId: null };
    } else {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: 'Not authorized to update this pickup',
        }),
      };
    }

    // Update the pickup
    const updatedPickup = await updatePickupService(pickupId, updateData);

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
  // Only user can delete their own pickup? or admin
  // Do we want to delete them, or just leave them as cancelled?
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

    const deletedPickup = await deletePickupService(pickupId);

    if (!deletedPickup) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Pickup not found' }),
      };
    }
    return {
      statusCode: 204,
      body: JSON.stringify(deletedPickup),
    };
  } catch (error) {
    console.error('Error in deletePickup:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};

export const availablePickups: APIGatewayProxyHandler = async (event) => {
  try {
    const authInfo = AuthInfoSchema.parse(
      event.requestContext.authorizer?.claims,
    );
    // Drivers or admin can get the list of available pickups (constrained by geographic location?)
    // We might want this to be constrained by truck size vs. load size too.
    if (
      authInfo['custom:role'] === 'admin' ||
      authInfo['custom:role'] === 'driver'
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
        message: 'Not authorized to update this pickup',
      }),
    };
    // return error wrong role or whatever here
  } catch (error) {
    console.error('Error in availablePickups:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};

export const acceptPickup: APIGatewayProxyHandler = async (event) => {
  try {
    const authInfo = AuthInfoSchema.parse(
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
      if (!pickup) {
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

      const acceptedPickup = acceptPickupService(driverId, pickupId);
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
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
