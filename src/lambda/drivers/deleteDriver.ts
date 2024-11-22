import {
	createPrismaHandler,
	type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse, NotFound, Forbidden } from '../types/index.js';

import { getDriverService, deleteDriverService } from './driverServices.js';

const deleteDriverHandler: PrismaOperationHandler<'deleteDriver'> = async (
	context,
) => {
	// Only admin or this user can delete
	const driver = await getDriverService(context.client, context.userId);
	if (driver === null) return NotFound('Driver not found');

	if (context.userRole !== 'admin' && context.userId !== driver.id) {
		console.warn('Unauthorized access attempt', {
			requestId: context.requestId,
		});
		return Forbidden("User doesn't have permission");
	}

	const deleteDriver = (await deleteDriverService(
		context.client,
		context.userId,
	)) as NonNullable<unknown>;

	return createSuccessResponse<'deleteDriver'>(204, deleteDriver);
};

export const handler = createPrismaHandler(deleteDriverHandler, {
	requiredRole: ['driver', 'admin'],
	operation: 'deleteDriver',
});
