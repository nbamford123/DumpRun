import { schemas } from '@/schemas/zodSchemas.js';

import {
	createDynamoHandler,
	type DynamoOperationHandler,
} from '../middleware/createHandlerDynamo.js';

import { getPickupService } from './pickupServices.js';
import { validGetPickup } from './pickupHelpers.js';
import { createSuccessResponse, NotFound, Forbidden } from '../types/index.js';

const getPickupHandler: DynamoOperationHandler<'getPickup'> = async (
	context,
) => {
	const pickup = await getPickupService(
		context.client,
		context.params.pickupId,
	);
	if (!pickup || (pickup.status === 'deleted' && context.userRole !== 'admin'))
		return NotFound('Pickup not found');

	if (validGetPickup(context.userRole, context.userId, pickup))
		return createSuccessResponse<'getPickup'>(200, pickup);

	return Forbidden("User doesn't have permission");
};

export const handler = createDynamoHandler(getPickupHandler, {
	requiredRole: ['driver', 'admin', 'user'],
	operation: 'getPickup',
});
