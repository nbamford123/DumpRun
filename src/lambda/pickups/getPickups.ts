import { schemas } from '@/schemas/zodSchemas.js';

import {
	createDynamoHandler,
	type DynamoOperationHandler,
} from '../middleware/createHandlerDynamo.js';
import { createSuccessResponse } from '../types/index.js';

import { getPickupsService } from './pickupServices.js';

const getPickupsHandler: DynamoOperationHandler<'listPickups'> = async (
	context,
) => {
	const { pickups, nextCursor } = await getPickupsService(
		context.client,
		context.query.status,
		context.query.limit,
		context.query.cursor,
		context.query.startRequestedTime,
		context.query.endRequestedTime,
	);
	return createSuccessResponse<'listPickups'>(200, {
		pickups,
		nextCursor: nextCursor || undefined,
	});
};

export const handler = createDynamoHandler(getPickupsHandler, {
	requiredRole: ['admin'],
	operation: 'listPickups',
});

