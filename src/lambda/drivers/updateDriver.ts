import { schemas } from '@/schemas/zodSchemas.js';

import {
	createPrismaHandler,
	type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse, NotFound, Forbidden } from '../types/index.js';

import { getDriverService, updateDriverService } from './driverServices.js';

const updateDriverHandler: PrismaOperationHandler<'updateDriver'> = async (
	context,
) => {
	// Only admin or this user can update
	const user = await getDriverService(context.client, context.userId);
	if (user === null) return NotFound('Driver not found');
	if (context.userRole !== 'admin' && context.userId !== user.id) {
		console.warn('Unauthorized access attempt', {
			requestId: context.requestId,
		});
		return Forbidden("Driver doesn't have permission");
	}
	const updateUser = await updateDriverService(
		context.client,
		context.userId,
		context.body,
	) as NonNullable<unknown>;
	return createSuccessResponse<'updateDriver'>(200, updateUser);
};

export const handler = createPrismaHandler(updateDriverHandler, {
	requiredRole: ['driver', 'admin'],
	operation: 'updateDriver',
	validateInput: schemas.UpdateDriver,
});
