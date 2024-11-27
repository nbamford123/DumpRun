import { schemas } from '@/schemas/zodSchemas.js';

import {
	createDynamoHandler,
	type DynamoOperationHandler,
} from '../middleware/createHandlerDynamo.js';
import { createSuccessResponse } from '../types/index.js';
import { createPickupService } from './pickupServices.js';

const createPickupHandler: DynamoOperationHandler<'createPickup'> = async (
	context,
) => {
	const newPickup = await createPickupService(
		context.client,
		context.userId,
		context.body,
	);
	return createSuccessResponse<'createPickup'>(201, newPickup);
};

export const handler = createDynamoHandler<'createPickup'>(createPickupHandler, {
	requiredRole: ['user', 'admin'],
	validateInput: schemas.NewPickup,
});
