import { schemas } from '@/schemas/zodSchemas.js';

import {
	createDynamoHandler,
	type DynamoOperationHandler,
} from '../middleware/createHandlerDynamo.js';
import { createSuccessResponse, NotFound, Forbidden } from '../types/index.js';

import { getPickupService, updatePickupService } from './pickupServices.js';

const updatePickupHandler: DynamoOperationHandler<'updatePickup'> = async (
	context,
) => {
	// Only admin or this user can update
	const pickup = await getPickupService(
		context.client,
		context.params.pickupId,
	);
	if (pickup == null || pickup.status === 'deleted')
		return NotFound('Pickup not found');
	if (context.userRole === 'admin' || context.cognitoUserId === pickup.userId) {
		if (pickup.status === 'accepted' || pickup.status === 'completed') {
			return Forbidden('Cannot modify an accepted or completed pickup');
		}
		const updatePickup = (await updatePickupService(
			context.client,
			context.params.pickupId,
			context.body,
		)) as NonNullable<unknown>;
		return createSuccessResponse<'updatePickup'>(200, updatePickup);
	}
	console.warn('Unauthorized access attempt', {
		requestId: context.requestId,
	});
	return Forbidden("User doesn't have permission");
};

export const handler = createDynamoHandler(updatePickupHandler, {
	requiredRole: ['user', 'admin'],
	operation: 'updatePickup',
	validateInput: schemas.UpdatePickup,
});
