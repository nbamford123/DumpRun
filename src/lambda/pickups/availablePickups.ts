import { schemas } from '@/schemas/zodSchemas.js';

import {
	createDynamoHandler,
	type DynamoOperationHandler,
} from '../middleware/createHandlerDynamo.js';
import { availablePickupsService } from './pickupServices.js';
import { createSuccessResponse } from '../types/index.js';

const availablePickupsHandler: DynamoOperationHandler<
	'listAvailablePickups'
> = async (context) => {
	const pickups = await availablePickupsService(context.client);
	return createSuccessResponse<'listAvailablePickups'>(200, pickups);
};

export const handler = createDynamoHandler(availablePickupsHandler, {
	requiredRole: ['driver', 'admin'],
});
