import { schemas } from '@/schemas/zodSchemas.js';

import {
	createDynamoHandler,
	type DynamoOperationHandler,
} from '../middleware/createHandlerDynamo.js';
import { getPickupService, updatePickupService } from './pickupServices.js';
import {
	createSuccessResponse,
	Conflict,
	Forbidden,
	NotFound,
} from '../types/index.js';

const cancelAcceptedPickupHandler: DynamoOperationHandler<
	'cancelAcceptance'
> = async (context) => {
	const pickup = await getPickupService(
		context.client,
		context.params.pickupId,
	);
	if (pickup === null || pickup.status === 'deleted')
		return NotFound('Pickup not found');

	// If you're the user or driver, you can cancel (or admin)
	if (
		context.userRole === 'admin' ||
		pickup.driverId === context.userId ||
		pickup.userId === context.userId
	) {
		if (pickup.status !== 'accepted')
			return Conflict(
				`Pickup can't be cancelled, current status is: ${pickup.status}`,
			);
		const cancelledPickup = await updatePickupService(
			context.client,
			context.params.pickupId,
			{ status: 'cancelled', driverId: null },
		);
		return createSuccessResponse<'cancelAcceptance'>(200, cancelledPickup);
	}
	return Forbidden("User doesn't have permission");
};

export const handler = createDynamoHandler(cancelAcceptedPickupHandler, {
	requiredRole: ['driver', 'admin', 'user'],
	operation: 'cancelAcceptance',
});
