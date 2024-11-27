import { schemas } from '@/schemas/zodSchemas.js';

import {
	createDynamoHandler,
	type DynamoOperationHandler,
} from '../middleware/createHandlerDynamo.js';
import { getPickupService, acceptPickupService } from './pickupServices.js';
import {
	createSuccessResponse,
	Conflict,
	NotFound,
} from '../types/index.js';

const acceptPickupHandler: DynamoOperationHandler<'acceptPickup'> = async (
	context,
) => {
	// Should we also check that you haven't scheduled another one at the same time?
	const pickup = await getPickupService(
		context.client,
		context.params.pickupId,
	);
	if (pickup === null || pickup.status === 'deleted')
		return NotFound('Pickup not found');
	if (pickup.status !== 'available') return Conflict('Pickup not available');

	const acceptedPickup = (await acceptPickupService(
		context.client,
		context.params.pickupId,
		context.userId,
	)) as NonNullable<unknown>;
	return createSuccessResponse<'acceptPickup'>(200, acceptedPickup);
};

export const handler = createDynamoHandler(acceptPickupHandler, {
	requiredRole: ['driver', 'admin'],
	operation: 'acceptPickup',
	validateInput: schemas.UpdatePickup,
});
