import { schemas } from '@/schemas/zodSchemas.js';

import {
	createDynamoHandler,
	type DynamoOperationHandler,
} from '../middleware/createHandlerDynamo.js';
import { createSuccessResponse, Forbidden, NotFound } from '../types/index.js';
import { deletePickupService, getPickupService } from './pickupServices.js';

const deletePickupHandler: DynamoOperationHandler<'deletePickup'> = async (
	context,
) => {
	const pickup = await getPickupService(context.client, context.params.pickupId);

	if (pickup == null || pickup.status === 'deleted')
		return NotFound('Pickup not found');
	// Only admin or user who created pickup can delete
	if (context.userId === pickup.userId || context.userRole === 'admin') {
		// Users can only soft delete their own pickups if they're not in progress (and not cancelled)
		if (
			pickup.status !== 'available' &&
			pickup.status !== 'accepted' &&
			pickup.status !== 'cancelled'
		) {
			return Forbidden(`Cannot delete pickup with status ${pickup.status}`);
		}
		// openapi spec currently doesn't have the delete pickup returned
		const deletedPickup = await deletePickupService(
			context.client,
			pickup.id || '',
		);
		return createSuccessResponse<'deletePickup'>(204);
	}
	console.warn('Unauthorized access attempt', {
		requestId: context.requestId,
	});
	return Forbidden("User doesn't have permission");
};

export const handler = createDynamoHandler<'deletePickup'>(
	deletePickupHandler,
	{
		requiredRole: ['user', 'admin'],
		operation: 'deletePickup',
	},
);
